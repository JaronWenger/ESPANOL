import { useEffect, useRef } from 'react';
import './PlaylistModal.css';

export default function PlaylistModal({ songs, albumArts, currentIdx, onSelect, onAddSong, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="playlist-backdrop">
      <div className="playlist-modal" ref={ref}>
        <div className="playlist-header">
          <span className="playlist-title">Playlist</span>
          <button className="playlist-close" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="playlist-songs">
          {songs.map((song, i) => (
            <button
              key={i}
              className={`playlist-song ${i === currentIdx ? 'active' : ''}`}
              onClick={() => { onSelect(i); onClose(); }}
            >
              <div className="playlist-song-art">
                {albumArts[i]
                  ? <img src={albumArts[i]} alt={song.title} />
                  : <div className="playlist-song-art-placeholder">♪</div>
                }
                {i === currentIdx && <div className="playlist-song-playing-bar" />}
              </div>
              <div className="playlist-song-meta">
                <div className="playlist-song-title">{song.title}</div>
                <div className="playlist-song-artist">{song.artist}</div>
              </div>
              {i === currentIdx && (
                <div className="playlist-now-playing">▶</div>
              )}
            </button>
          ))}
        </div>

        <button className="playlist-add-btn" onClick={() => { onAddSong(); onClose(); }}>
          <span className="playlist-add-icon">+</span>
          Add Song
        </button>
      </div>
    </div>
  );
}
