import { useState, useEffect, useRef } from 'react';
import './WordModal.css';

export default function WordModal({ word, onClose }) {
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const ref = useRef(null);

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

    // Strip diacritics before querying — MyMemory gives wrong results for accented chars
    const normalized = word.normalize('NFD').replace(/[̀-ͯ]/g, '');
    fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(normalized)}&langpair=es|en`
    )
      .then((r) => r.json())
      .then((d) => {
        setTranslation(d.responseData?.translatedText || '—');
        setLoading(false);
      })
      .catch(() => {
        setTranslation('(offline)');
        setLoading(false);
      });
  }, [word]);

  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'es-ES';
    utter.rate = 0.75;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  if (!word) return null;

  return (
    <div className="word-modal-backdrop">
      <div className="word-modal" ref={ref}>
        <button className="word-modal-close" onClick={onClose}>✕</button>
        <div className="word-modal-word">{word}</div>
        <div className="word-modal-lang">Spanish</div>

        <button
          className={`word-modal-speak ${speaking ? 'speaking' : ''}`}
          onClick={speak}
          title="Hear pronunciation"
        >
          {speaking ? '🔊 Speaking…' : '🔉 Pronounce'}
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
          ← → to browse words
        </div>
      </div>
    </div>
  );
}
