import { useRef, useState, useEffect, useCallback } from 'react';

export function useAudioPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [audioSrc, setAudioSrc] = useState(null);
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  // Lazily create an AudioContext routed through a GainNode.
  // Must be called inside a user-gesture handler so iOS unlocks the context.
  const ensureCtx = useCallback(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      ctx.createMediaElementSource(audio).connect(gain);
      audioCtxRef.current = ctx;
      gainRef.current = gain;
    } catch (_) {}
  }, []);

  const toggle = useCallback(() => {
    ensureCtx();
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }, [ensureCtx]);

  // Adjust gain to counteract iOS audio-session ducking during speech synthesis.
  // Normal playback: 1. During speech: 2 (cancels iOS's ~50% duck).
  const setGain = useCallback((value) => {
    ensureCtx();
    if (gainRef.current) gainRef.current.gain.value = value;
  }, [ensureCtx]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
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
    setGain,
  };
}
