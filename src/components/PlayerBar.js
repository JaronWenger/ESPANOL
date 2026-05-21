import { useState, useEffect, useRef, useCallback } from 'react';
import './PlayerBar.css';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerBar({
  isPlaying,
  currentTime,
  duration,
  volume,
  onToggle,
  onSeek,
  onVolume,
  songTitle,
  songArtist,
  albumArt,
  showEnglish,
  onToggleEnglish,
  translating,
  hasAudio,
  onPrev,
  onNext,
  shuffle,
  onToggleShuffle,
  repeat,
  onToggleRepeat,
}) {
  const [artBroken, setArtBroken] = useState(false);
  useEffect(() => { setArtBroken(false); }, [albumArt]);

  // Custom scrubber state
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(null);
  const scrubTrackRef = useRef(null);

  const getRatio = (e) => {
    const rect = scrubTrackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const handleScrubDown = useCallback((e) => {
    if (!hasAudio || !duration) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrubbing(true);
    setScrubValue(getRatio(e) * duration);
  }, [hasAudio, duration]);

  const handleScrubMove = useCallback((e) => {
    if (!scrubbing) return;
    setScrubValue(getRatio(e) * duration);
  }, [scrubbing, duration]);

  const handleScrubUp = useCallback((e) => {
    if (!scrubbing) return;
    setScrubbing(false);
    onSeek(getRatio(e) * duration);
    setScrubValue(null);
  }, [scrubbing, duration, onSeek]);

  const displayTime = scrubbing && scrubValue !== null ? scrubValue : currentTime;
  const progress = duration ? displayTime / duration : 0;

  return (
    <div className="player-bar">
      {/* Song info */}
      <div className="player-info">
        {albumArt && !artBroken
          ? <img
              src={albumArt}
              alt="Album art"
              className="player-album-art"
              onError={() => setArtBroken(true)}
            />
          : <div className="player-note">♪</div>
        }
        <div className="player-meta">
          <div className="player-title">{songTitle || 'No song loaded'}</div>
          <div className="player-artist">{songArtist || 'Upload a song to begin'}</div>
        </div>
        {/* EN toggle visible only on mobile — sits in the info row */}
        <button
          className={`translation-toggle info-en-toggle ${showEnglish ? 'active' : ''} ${translating ? 'loading' : ''}`}
          onClick={onToggleEnglish}
          title={translating ? 'Translating…' : showEnglish ? 'Hide English' : 'Show English'}
        >
          {translating ? '…' : 'EN'}
        </button>
      </div>

      {/* Center controls */}
      <div className="player-center">
        <div className="player-controls">
          {/* Shuffle */}
          <button
            className={`player-extra-btn ${shuffle ? 'active' : ''}`}
            onClick={onToggleShuffle}
            title={shuffle ? 'Shuffle on' : 'Shuffle off'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>

          {/* Skip prev */}
          <button
            className={`player-skip ${!onPrev ? 'disabled' : ''}`}
            onClick={onPrev}
            disabled={!onPrev}
            title="Previous song"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19,5 9,12 19,19" />
              <rect x="5" y="5" width="3" height="14" rx="1" />
            </svg>
          </button>

          {/* Play/pause */}
          <button
            className={`player-play ${isPlaying ? 'playing' : ''} ${!hasAudio ? 'disabled' : ''}`}
            onClick={onToggle}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            disabled={!hasAudio}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          {/* Skip next */}
          <button
            className={`player-skip ${!onNext ? 'disabled' : ''}`}
            onClick={onNext}
            disabled={!onNext}
            title="Next song"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,5 15,12 5,19" />
              <rect x="16" y="5" width="3" height="14" rx="1" />
            </svg>
          </button>

          {/* Repeat */}
          <button
            className={`player-extra-btn ${repeat !== 'off' ? 'active' : ''}`}
            onClick={onToggleRepeat}
            title={repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
          >
            {repeat === 'one' ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="player-progress-row">
          <span className="player-time">{formatTime(displayTime)}</span>
          <div
            ref={scrubTrackRef}
            className={`player-scrubber-track ${(!hasAudio || !duration) ? 'disabled' : ''} ${scrubbing ? 'scrubbing' : ''}`}
            onPointerDown={handleScrubDown}
            onPointerMove={handleScrubMove}
            onPointerUp={handleScrubUp}
            onPointerCancel={() => { setScrubbing(false); setScrubValue(null); }}
          >
            <div className="player-scrubber-rail" />
            <div className="player-scrubber-fill" style={{ width: `${progress * 100}%` }} />
            <div className="player-scrubber-thumb" style={{ left: `${progress * 100}%` }} />
          </div>
          <span className="player-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="player-right">
        {/* Translation toggle */}
        <button
          className={`translation-toggle ${showEnglish ? 'active' : ''} ${translating ? 'loading' : ''}`}
          onClick={onToggleEnglish}
          title={translating ? 'Translating…' : showEnglish ? 'Hide English translation' : 'Show English translation'}
        >
          {translating ? '…' : 'EN'}
        </button>

        {/* Volume */}
        <div className="volume-group">
          <svg className="volume-icon" viewBox="0 0 24 24" fill="currentColor">
            {volume === 0 ? (
              <path d="M11 5L6 9H2v6h4l5 4V5zm9.07 1.93a10 10 0 010 14.14l-1.41-1.41a8 8 0 000-11.32l1.41-1.41zM15.54 8.46a5 5 0 010 7.07l-1.41-1.41a3 3 0 000-4.24l1.41-1.42z" />
            ) : volume < 0.5 ? (
              <path d="M11 5L6 9H2v6h4l5 4V5zm3.54 3.46a5 5 0 010 7.07l-1.41-1.41a3 3 0 000-4.24l1.41-1.42z" />
            ) : (
              <path d="M11 5L6 9H2v6h4l5 4V5zm9.07 1.93a10 10 0 010 14.14l-1.41-1.41a8 8 0 000-11.32l1.41-1.41zM15.54 8.46a5 5 0 010 7.07l-1.41-1.41a3 3 0 000-4.24l1.41-1.42z" />
            )}
          </svg>
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            style={{ '--progress': `${volume * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
