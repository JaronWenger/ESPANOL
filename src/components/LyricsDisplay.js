import { useEffect, useRef } from 'react';
import { getLyricIndex } from '../utils/lrcParser';
import './LyricsDisplay.css';

function speakLine(text) {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'es-ES';
  utter.rate = 0.75;
  window.speechSynthesis.cancel();
  setTimeout(() => window.speechSynthesis.speak(utter), 50);
}

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

  // Auto-scroll active line to center
  useEffect(() => {
    if (userScrollingRef.current) return;
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIdx]);

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
                speakLine(line.spanish);
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
