import { useRef, useState, useEffect, useCallback } from 'react';

export function useAudioPlayer() {
  const audioRef = useRef(null);
  const karaokeAudioRef = useRef(null);
  const activeIsKaraokeRef = useRef(false); // which element is currently "live"

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [audioSrc, setAudioSrc] = useState(null);
  const pendingSeekRef = useRef(null);
  const silentPlayRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const swappingRef = useRef(false); // true during swapSrc — suppresses spurious pause/timeupdate

  const [karaoke, setKaraoke] = useState(false);
  const karaokeRef = useRef(false);
  const acxRef = useRef(null);       // AudioContext
  const acxSrcRef = useRef(null);    // MediaElementSourceNode
  const acxSplRef = useRef(null);    // ChannelSplitter
  const acxMrgRef = useRef(null);    // ChannelMerger (karaoke output)

  useEffect(() => {
    const audio = audioRef.current;
    const kar = karaokeAudioRef.current;
    if (!audio) return;

    const onTimeUpdate = (e) => {
      if (swappingRef.current) return;
      setCurrentTime(e.target.currentTime);
    };
    // Only the main element drives duration — both tracks are the same song length.
    const onDurationChange = (e) => {
      if (e.target === audioRef.current) setDuration(e.target.duration || 0);
    };
    const onEnded = () => setIsPlaying(false);
    const onPlay  = () => { if (!silentPlayRef.current) setIsPlaying(true); };
    const onPause = () => {
      if (silentPlayRef.current || swappingRef.current) return;
      setIsPlaying(false);
    };
    // Fallback: if metadata loads without a preceding play() (desktop/cache hit),
    // apply any pending seek directly. Skip during silent unlock to avoid racing.
    const onLoadedMetadata = () => {
      if (silentPlayRef.current) return;
      if (pendingSeekRef.current !== null) {
        audio.currentTime = pendingSeekRef.current;
        setCurrentTime(pendingSeekRef.current);
        pendingSeekRef.current = null;
      }
    };

    const els = [audio, kar].filter(Boolean);
    els.forEach(el => {
      el.addEventListener('timeupdate',     onTimeUpdate);
      el.addEventListener('durationchange', onDurationChange);
      el.addEventListener('ended',          onEnded);
      el.addEventListener('play',           onPlay);
      el.addEventListener('pause',          onPause);
    });
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    // iOS ignores preload="auto" — nothing loads until play(). On the very first
    // touch anywhere, silently play-then-pause BOTH elements so iOS buffers both
    // tracks. After this, switching between vocal and instrumental is instant.
    const silentUnlock = () => {
      if (audio.readyState === 0 && audio.src) {
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
      }
      // Silently unlock the karaoke element to start buffering it in parallel.
      if (kar && kar.readyState === 0 && kar.src) {
        kar.muted = true;
        kar.play().then(() => {
          kar.pause();
          kar.muted = false;
        }).catch(() => { kar.muted = false; });
      }
    };
    document.addEventListener('touchstart', silentUnlock, { once: true, passive: true });

    return () => {
      els.forEach(el => {
        el.removeEventListener('timeupdate',     onTimeUpdate);
        el.removeEventListener('durationchange', onDurationChange);
        el.removeEventListener('ended',          onEnded);
        el.removeEventListener('play',           onPlay);
        el.removeEventListener('pause',          onPause);
      });
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      document.removeEventListener('touchstart', silentUnlock);
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = activeIsKaraokeRef.current ? karaokeAudioRef.current : audioRef.current;
    if (!audio || !audio.src) return;

    if (silentPlayRef.current) {
      if (audio.paused) pendingPlayRef.current = true;
      return;
    }

    if (acxRef.current?.state === 'suspended') acxRef.current.resume();

    if (audio.paused) {
      const seekTo = pendingSeekRef.current;
      pendingSeekRef.current = null;

      if (seekTo !== null && audio.readyState < 2) {
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
    const audio = activeIsKaraokeRef.current ? karaokeAudioRef.current : audioRef.current;
    if (!audio) return;
    setCurrentTime(time);
    if (audio.readyState >= 2) {
      audio.currentTime = time;
    } else {
      pendingSeekRef.current = time;
    }
  }, []);

  const setVolume = useCallback((v) => {
    const audio = audioRef.current;
    const kar = karaokeAudioRef.current;
    if (audio) audio.volume = v;
    if (kar) kar.volume = v;
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

  // Swap between the pre-loaded vocal and instrumental elements.
  // Both are already buffered (unlocked on first touchstart), so the switch is instant.
  const swapSrc = useCallback(() => {
    const main = audioRef.current;
    const kar = karaokeAudioRef.current;
    if (!main || !kar) return;

    const fromEl = activeIsKaraokeRef.current ? kar : main;
    const toEl   = activeIsKaraokeRef.current ? main : kar;

    const t = fromEl.currentTime;
    const wasPlaying = !fromEl.paused;

    activeIsKaraokeRef.current = !activeIsKaraokeRef.current;

    // swappingRef suppresses the pause event from fromEl.pause() so isPlaying
    // doesn't flicker to false mid-swap.
    swappingRef.current = true;
    fromEl.pause();
    toEl.currentTime = t;
    setCurrentTime(t);

    if (wasPlaying) {
      toEl.play()
        .then(() => { swappingRef.current = false; })
        .catch(() => { swappingRef.current = false; });
    } else {
      swappingRef.current = false;
    }
  }, []);

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
    activeIsKaraokeRef.current = false; // always start on the vocal element
    setAudioSrc(src);
    setCurrentTime(0);
    setIsPlaying(false);
    pendingSeekRef.current = null;
  }, []);

  return {
    audioRef,
    karaokeAudioRef,
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
