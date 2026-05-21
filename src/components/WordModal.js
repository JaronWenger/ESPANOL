import { useState, useEffect, useRef } from 'react';
import { lookupLocal } from '../utils/spanishDict';
import { speakEs } from '../utils/speech';
import './WordModal.css';

const SWIPE_THRESHOLD = 40;

export default function WordModal({ word, onClose, onNavigate }) {
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const ref = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!word) return;
    setLoading(true);
    setTranslation('');

    // Check local dictionary first (instant, no rate limit)
    const local = lookupLocal(word);
    if (local) {
      setTranslation(local);
      setLoading(false);
      return;
    }

    // Fall back to Google Translate (unofficial endpoint, no key needed)
    fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(word)}`
    )
      .then((r) => r.json())
      .then((d) => {
        setTranslation(d?.[0]?.[0]?.[0] || '\u2014');
        setLoading(false);
      })
      .catch(() => {
        setTranslation('(offline)');
        setLoading(false);
      });
  }, [word]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    // swipe left → next word, swipe right → prev word
    onNavigate(dx < 0 ? 1 : -1);
  };

  const speak = () => {
    speakEs(word, {
      onStart: () => setSpeaking(true),
      onEnd:   () => setSpeaking(false),
    });
  };

  if (!word) return null;

  return (
    <div className="word-modal-backdrop">
      <div
          className="word-modal"
          ref={ref}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
        <button className="word-modal-close" onClick={onClose}>&#x2715;</button>
        <div className="word-modal-word">{word}</div>
        <div className="word-modal-lang">Spanish</div>

        <button
          className={`word-modal-speak ${speaking ? 'speaking' : ''}`}
          onClick={speak}
          title="Hear pronunciation"
        >
          {speaking ? 'Speaking...' : 'Pronounce'}
        </button>

        <div className="word-modal-divider" />

        <div className="word-modal-label">English meaning</div>
        {loading ? (
          <div className="word-modal-loading">
            <span className="dot-pulse" />
          </div>
        ) : (
          <div className="word-modal-translation">{translation}</div>
        )}

        <div className="word-modal-nav-hint">
          &larr; &rarr; to browse words
        </div>
      </div>
    </div>
  );
}
