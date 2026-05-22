import { useRef, useState, useEffect, useCallback } from 'react';

export function useAudioPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [audioSrc, setAudioSrc] = useState(null);
  const pendingSeekRef = useRef(null);
  const silentPlayRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const swappingRef = useRef(false); // true during swapSrc handoff — suppresses spurious state updates

  const [karaoke, setKaraoke] = useState(false);
  const karaokeRef = useRef(false);
  const acxRef = useRef(null);       // AudioContext
  const acxSrcRef = useRef(null);    // MediaElementSourceNode
  const acxSplRef = useRef(null);    // ChannelSplitter
  const acxMrgRef = useRef(null);    // ChannelMerger (karaoke output)

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (swappingRef.current) return; // ignore position-0 updates during src reload
      setCurrentTime(audio.currentTime);
    };
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onPlay  = () => { if (!silentPlayRef.current) setIsPlaying(true);  };
    const onPause = () => {
      if (silentPlayRef.current || swappingRef.current) return; // ignore src-change pause during swap
      setIsPlaying(false);
    };
    // Fallback: if metadata loads without a preceding play() (desktop, or iOS
    // serving from cache), apply any pending seek directly here.
    // Skip if the silent unlock is in progress — it triggers loadedmetadata
    // while playing muted, and iOS won't honor a currentTime assignment during
    // active playback. Leave pendingSeekRef intact for toggle() to apply after
    // the unlock completes (readyState >= 1, audio paused — seek sticks there).
    const onLoadedMetadata = () => {
      if (silentPlayRef.current) return;
      if (pendingSeekRef.current !== null) {
        audio.currentTime = pendingSeekRef.current;
        setCurrentTime(pendingSeekRef.current);
        pendingSeekRef.current = null;
      }
    };

    audio.addEventListener('timeupdate',      onTimeUpdate);
    audio.addEventListener('durationchange',  onDurationChange);
    audio.addEventListener('ended',           onEnded);
    audio.addEventListener('play',            onPlay);
    audio.addEventListener('pause',           onPause);
    audio.addEventListener('loadedmetadata',  onLoadedMetadata);

    // iOS ignores preload="auto" — nothing loads until play(). On the very first
    // touch anywhere, silently play-then-immediately-pause so iOS loads the audio
    // metadata. After this: duration is known, the scrubber is interactive, and
    // seeks work — all before the user ever presses the play button.
    const silentUnlock = () => {
      if (audio.readyState > 0 || !audio.src) return;
      silentPlayRef.current = true;
      audio.muted = true;
      audio.addEventListener('loadedmetadata', () => {
        audio.pause();
        audio.muted = false;
        silentPlayRef.current = false;
        if (pendingPlayRef.current) {
          pendingPlayRef.current = false;
          audio.play().catch(() => {});
        }
      }, { once: true });
      audio.play().catch(() => {
        audio.muted = false;
        silentPlayRef.current = false;
      });
    };
    document.addEventListener('touchstart', silentUnlock, { once: true, passive: true });

    return () => {
      audio.removeEventListener('timeupdate',      onTimeUpdate);
      audio.removeEventListener('durationchange',  onDurationChange);
      audio.removeEventListener('ended',           onEnded);
      audio.removeEventListener('play',            onPlay);
      audio.removeEventListener('pause',           onPause);
      audio.removeEventListener('loadedmetadata',  onLoadedMetadata);
      document.removeEventListener('touchstart', silentUnlock);
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (silentPlayRef.current) {
      // Silent unlock still in progress — queue the play intent and bail.
      // The loadedmetadata handler above will fire play() when unlock finishes.
      if (audio.paused) pendingPlayRef.current = true;
      return;
    }

    if (acxRef.current?.state === 'suspended') acxRef.current.resume();

    if (audio.paused) {
      const seekTo = pendingSeekRef.current;
      pendingSeekRef.current = null;

      if (seekTo !== null && audio.readyState < 2) {
        // readyState 0: silent unlock hasn't fired yet.
        // readyState 1: silent unlock ran (metadata loaded) but iOS still won't
        // honor a currentTime assignment before play() — it needs an active play
        // context to make range requests. Mute, start play, seek in .then(), unmute.
        audio.muted = true;
        audio.play()
          .then(() => {
            audio.currentTime = seekTo;
            setCurrentTime(seekTo);
            const unmute = () => { audio.muted = false; };
            audio.addEventListener('seeked', unmute, { once: true });
            setTimeout(unmute, 1000);
          })
          .catch(() => { audio.muted = false; });
      } else {
        if (seekTo !== null) audio.currentTime = seekTo;
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(time);
    if (audio.readyState >= 2) {
      // readyState 2+ means the browser has buffered data and will honor a seek.
      // readyState 0-1 on iOS: no buffered data, currentTime assignment is silently
      // ignored. Store for toggle() to apply via the muted-play-then-seek path.
      audio.currentTime = time;
    } else {
      pendingSeekRef.current = time;
    }
  }, []);

  const setVolume = useCallback((v) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = v;
    setVolumeState(v);
  }, []);

  const toggleKaraoke = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Lazy-init AudioContext on first toggle (requires user gesture).
    // createMediaElementSource permanently routes audio through the context,
    // so we only do this once and keep it for the session.
    if (!acxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaElementSource(audio);
      const splitter = ctx.createChannelSplitter(2);
      const gainNeg = ctx.createGain();
      gainNeg.gain.value = -1;
      const merger = ctx.createChannelMerger(2);

      // Phase cancellation: both output channels carry L−R.
      // Vocals are typically center-panned (equal L and R), so L−R ≈ 0 for them.
      splitter.connect(merger, 0, 0);   // +L → left out
      splitter.connect(merger, 0, 1);   // +L → right out
      splitter.connect(gainNeg, 1);     // R → invert
      gainNeg.connect(merger, 0, 0);    // −R adds to left out  → L−R
      gainNeg.connect(merger, 0, 1);    // −R adds to right out → L−R

      acxRef.current = ctx;
      acxSrcRef.current = src;
      acxSplRef.current = splitter;
      acxMrgRef.current = merger;

      src.connect(ctx.destination); // start in normal (bypass) mode
    }

    const newVal = !karaokeRef.current;
    karaokeRef.current = newVal;

    const ctx = acxRef.current;
    const src = acxSrcRef.current;
    const splitter = acxSplRef.current;
    const merger = acxMrgRef.current;

    if (newVal) {
      try { src.disconnect(ctx.destination); } catch {}
      src.connect(splitter);
      merger.connect(ctx.destination);
    } else {
      try { src.disconnect(splitter); } catch {}
      try { merger.disconnect(ctx.destination); } catch {}
      src.connect(ctx.destination);
    }

    if (ctx.state === 'suspended') ctx.resume();
    setKaraoke(newVal);
  }, []);

  // Equal-power crossfade between two sources.
  // cos/sin curves keep combined power constant — no loudness dip or boost.
  const swapSrc = useCallback((newSrc) => {
    const audio = audioRef.current;
    if (!audio) return;
    const savedVol = audio.volume;
    const t = audio.currentTime;
    const wasPlaying = !audio.paused;
    const FADE_MS = 700;

    // No crossfade needed when paused — just swap the source.
    if (!wasPlaying) {
      audio.src = newSrc;
      pendingSeekRef.current = t;
      setCurrentTime(t);
      return;
    }

    // Lazy-init AudioContext — only runs once per session.
    if (!acxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaElementSource(audio);
      const splitter = ctx.createChannelSplitter(2);
      const gainNeg = ctx.createGain(); gainNeg.gain.value = -1;
      const merger = ctx.createChannelMerger(2);
      splitter.connect(merger, 0, 0); splitter.connect(merger, 0, 1);
      splitter.connect(gainNeg, 1);
      gainNeg.connect(merger, 0, 0); gainNeg.connect(merger, 0, 1);
      acxRef.current = ctx;
      acxSrcRef.current = src;
      acxSplRef.current = splitter;
      acxMrgRef.current = merger;
      src.connect(ctx.destination);
    }

    const ctx = acxRef.current;
    const outSrc = acxSrcRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const outGain = ctx.createGain();
    outGain.gain.value = 1;
    try { outSrc.disconnect(ctx.destination); } catch {}
    outSrc.connect(outGain);
    outGain.connect(ctx.destination);

    const inGain = ctx.createGain();
    inGain.gain.value = 0;
    const inAudio = new Audio(newSrc);
    const inSrc = ctx.createMediaElementSource(inAudio);
    inSrc.connect(inGain);
    inGain.connect(ctx.destination);

    let fadeStarted = false;
    const runFade = () => {
      if (fadeStarted) return;
      fadeStarted = true;
      // Re-sync to outgoing position to correct drift from loading/seeking delay.
      // inGain is still 0 here so the momentary seek is inaudible.
      inAudio.currentTime = audio.currentTime;

      const t0 = performance.now();
      const tick = () => {
        const p = Math.min(1, (performance.now() - t0) / FADE_MS);
        const angle = p * Math.PI / 2;
        outGain.gain.value = Math.cos(angle);
        inGain.gain.value  = Math.sin(angle);

        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          // Tear down old source graph.
          try { outSrc.disconnect(outGain); } catch {}
          try { outGain.disconnect(); } catch {}
          outSrc.connect(ctx.destination);

          // Hand off to the main element (preserves all event listeners).
          // swappingRef suppresses the spurious pause event and position-0 timeupdate
          // that fire during src reload, so the lyric highlight never jumps.
          const pos = inAudio.currentTime;
          swappingRef.current = true;
          audio.volume = savedVol;
          audio.src = newSrc;
          pendingSeekRef.current = pos;
          setCurrentTime(pos);
          toggle();

          // Clear suppression once the main element has seeked to the right spot.
          const clearSwap = () => {
            swappingRef.current = false;
            setCurrentTime(audio.currentTime);
          };
          audio.addEventListener('seeked', clearSwap, { once: true });
          setTimeout(() => { swappingRef.current = false; }, 1500); // safety fallback

          // Keep inAudio playing to bridge any gap while the main element reloads,
          // then smooth-ramp inGain to 0 to avoid a click at the cut point.
          setTimeout(() => {
            inGain.gain.setTargetAtTime(0, ctx.currentTime, 0.01); // ~30 ms decay
            setTimeout(() => {
              inAudio.pause();
              try { inSrc.disconnect(); } catch {}
              try { inGain.disconnect(); } catch {}
            }, 80);
          }, 200);
        }
      };
      requestAnimationFrame(tick);
    };

    // Call play() immediately while still in the user-gesture stack (iOS requirement).
    // inGain is 0 so nothing is audible. After play() resolves, seek to t;
    // once seeked and buffered at that position, kick off the crossfade.
    inAudio.play()
      .then(() => {
        if (t > 0) {
          inAudio.currentTime = t;
          inAudio.addEventListener('seeked', runFade, { once: true });
          setTimeout(runFade, 500); // fallback if seeked never fires
        } else {
          runFade();
        }
      })
      .catch(() => runFade());
  }, [toggle]);

  // Explicitly turn Web Audio karaoke off (for song-change resets).
  const setKaraokeOff = useCallback(() => {
    if (!karaokeRef.current) return;
    karaokeRef.current = false;
    const ctx = acxRef.current;
    const src = acxSrcRef.current;
    const splitter = acxSplRef.current;
    const merger = acxMrgRef.current;
    if (ctx && src) {
      try { src.disconnect(splitter); } catch {}
      try { merger.disconnect(ctx.destination); } catch {}
      src.connect(ctx.destination);
    }
    setKaraoke(false);
  }, []);

  const loadSrc = useCallback((src) => {
    setAudioSrc(src);
    setCurrentTime(0);
    setIsPlaying(false);
    pendingSeekRef.current = null;
  }, []);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    audioSrc,
    toggle,
    seek,
    setVolume,
    loadSrc,
    swapSrc,
    karaoke,
    toggleKaraoke,
    setKaraokeOff,
  };
}
