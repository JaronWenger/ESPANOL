import { useRef, useState, useEffect, useCallback } from 'react';

export function useAudioPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [audioSrc, setAudioSrc] = useState(null);
  const pendingSeekRef = useRef(null);
  // Used during the silent iOS unlock to suppress UI state flicker.
  const silentPlayRef = useRef(false);
  // If the user taps play while the silent unlock is still in progress, queue it.
  const pendingPlayRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onPlay  = () => { if (!silentPlayRef.current) setIsPlaying(true);  };
    const onPause = () => { if (!silentPlayRef.current) setIsPlaying(false); };
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

    if (audio.paused) {
      const seekTo = pendingSeekRef.current;
      pendingSeekRef.current = null;

      if (seekTo !== null && audio.readyState < 1) {
        // The silent unlock didn't fire yet (e.g. first tap was play itself and
        // the unlock raced with this call). Mute, force-load, seek, unmute.
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
    if (audio.readyState >= 1) {
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
  };
}
