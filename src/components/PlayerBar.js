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
  hasAudio,
}) {
  const progress = duration ? currentTime / duration : 0;

  return (
    <div className="player-bar">
      {/* Song info */}
      <div className="player-info">
        {albumArt
          ? <img src={albumArt} alt="Album art" className="player-album-art" />
          : <div className="player-note">♪</div>
        }
        <div className="player-meta">
          <div className="player-title">{songTitle || 'No song loaded'}</div>
          <div className="player-artist">{songArtist || 'Upload a song to begin'}</div>
        </div>
      </div>

      {/* Center controls */}
      <div className="player-center">
        <div className="player-controls">
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
        </div>

        {/* Progress bar */}
        <div className="player-progress-row">
          <span className="player-time">{formatTime(currentTime)}</span>
          <div className="player-progress-track">
            <input
              type="range"
              className="player-scrubber"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              disabled={!hasAudio}
              style={{ '--progress': `${progress * 100}%` }}
            />
          </div>
          <span className="player-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="player-right">
        {/* Translation toggle */}
        <button
          className={`translation-toggle ${showEnglish ? 'active' : ''}`}
          onClick={onToggleEnglish}
          title={showEnglish ? 'Hide English translation' : 'Show English translation'}
        >
          EN
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
