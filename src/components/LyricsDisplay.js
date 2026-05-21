import { useEffect, useRef } from 'react';
import { getLyricIndex } from '../utils/lrcParser';
import { speakEs } from '../utils/speech';
import './LyricsDisplay.css';

export default function LyricsDisplay({
  lyrics,
  currentTime,
  isPlaying,
  showEnglish,
  onSeek,
  onWordClick,
}) {
  const activeIdx = getLyricIndex(lyrics, currentTime);
  const containerRef = useRef(null);
  const activeRef = useRef(null);
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const prevActiveIdxRef = useRef(activeIdx);

  // Auto-scroll active line to center.
  // A jump of more than 1 line means the user seeked — override scroll suppression.
  useEffect(() => {
    const prev = prevActiveIdxRef.current;
    prevActiveIdxRef.current = activeIdx;
    if (Math.abs(activeIdx - prev) > 1) userScrollingRef.current = false;
    if (userScrollingRef.current) return;
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIdx]);

  // Anchor the active line in place while EN translations animate in/out.
  // Each rAF tick measures how far the element drifted and cancels it via scrollTop.
  useEffect(() => {
    const el = activeRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const anchorTop = el.getBoundingClientRect().top;
    const deadline = performance.now() + 400; // outlast the 350ms CSS transition

    let rafId;
    const tick = () => {
      const drift = el.getBoundingClientRect().top - anchorTop;
      if (Math.abs(drift) > 0.5) container.scrollTop += drift;
      if (performance.now() < deadline) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showEnglish]);

  // Track user scroll to pause auto-scroll temporarily
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      userScrollingRef.current = true;
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        userScrollingRef.current = false;
      }, 3000);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const renderWords = (text, isActive) =>
    text.split(/(\s+)/).map((chunk, i) => {
      if (/^\s+$/.test(chunk)) return <span key={i}>{chunk}</span>;
      const cleanWord = chunk.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/g, '');
      if (!cleanWord || !isActive) return <span key={i}>{chunk}</span>;
      return (
        <span
          key={i}
          className="lyric-word"
          onClick={(e) => {
            e.stopPropagation();
            onWordClick(cleanWord);
          }}
          title={`Click to look up "${cleanWord}"`}
        >
          {chunk}
        </span>
      );
    });

  if (!lyrics.length) {
    return (
      <div className="lyrics-empty">
        <div className="lyrics-empty-icon">♪</div>
        <p>No lyrics loaded yet.</p>
        <p className="lyrics-empty-sub">
          Upload an MP3 + .lrc file, or paste a YouTube link above.
        </p>
      </div>
    );
  }

  return (
    <div className="lyrics-container" ref={containerRef}>
      <div className="lyrics-padding-top" />
      {lyrics.map((line, idx) => {
        const isActive = idx === activeIdx;
        const isPast = idx < activeIdx;

        if (line.instrumental) {
          return (
            <div
              key={idx}
              ref={isActive ? activeRef : null}
              className={`lyric-line lyric-instrumental ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
              onClick={() => { if (!isActive || isPlaying) onSeek(line.time); }}
            >
              <span className="lyric-instrumental-notes">♪ ♪ ♪</span>
            </div>
          );
        }

        return (
          <div
            key={idx}
            ref={isActive ? activeRef : null}
            className={`lyric-line ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
            onClick={() => {
              if (isActive && !isPlaying) {
                speakEs(line.spanish);
                onSeek(line.time);
              } else {
                onSeek(line.time);
              }
            }}
          >
            <div className="lyric-spanish">
              {renderWords(line.spanish, isActive)}
            </div>
            {line.english && (
              <div className={`lyric-english ${showEnglish ? 'visible' : 'hidden'}`}>
                {line.english}
              </div>
            )}
          </div>
        );
      })}
      <div className="lyrics-padding-bottom" />
    </div>
  );
}
