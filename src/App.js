import { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import LyricsDisplay from './components/LyricsDisplay';
import PlayerBar from './components/PlayerBar';
import UploadModal from './components/UploadModal';
import WordModal from './components/WordModal';
import { demoSong } from './utils/demoSong';
import logo from './assets/Espanol-modified.png';
import './App.css';

export default function App() {
  const player = useAudioPlayer();
  const [song, setSong] = useState(demoSong);
  const [showEnglish, setShowEnglish] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);

  const loadSong = useCallback(
    ({ audioUrl, lyrics, title, artist }) => {
      setSong({ title, artist, audioUrl, lyrics });
      player.loadSrc(audioUrl);
      setShowUpload(false);
    },
    [player]
  );

  // Sync audio src attribute when song changes
  useEffect(() => {
    const audio = player.audioRef.current;
    if (!audio) return;
    if (song.audioUrl) {
      audio.src = song.audioUrl;
    } else {
      audio.removeAttribute('src');
    }
  }, [song.audioUrl, player.audioRef]);

  // Spacebar play/pause
  useEffect(() => {
    const handler = (e) => {
      if (
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) &&
        !showUpload &&
        !selectedWord
      ) {
        e.preventDefault();
        player.toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [player, showUpload, selectedWord]);

  return (
    <div className="app">
      <audio ref={player.audioRef} preload="metadata" />

      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <img src={logo} alt="EspañolMusic" className="app-logo-img" />
        </div>
        <div className="app-header-actions">
          <button className="load-btn" onClick={() => setShowUpload(true)}>
            + Load Song
          </button>
        </div>
      </header>

      {/* Song title banner */}
      {song.title && (
        <div className="song-banner">
          <div className="song-banner-title">{song.title}</div>
          <div className="song-banner-artist">{song.artist}</div>
          <div className="song-banner-hint">
            Click any{' '}
            <span className="hint-green">word</span> to look it up &middot; Click a line to jump &middot;{' '}
            <kbd>Space</kbd> to play/pause
          </div>
        </div>
      )}

      {/* Lyrics */}
      <LyricsDisplay
        lyrics={song.lyrics}
        currentTime={player.currentTime}
        showEnglish={showEnglish}
        onSeek={(time) => {
          player.seek(time);
          if (!player.isPlaying && song.audioUrl) {
            player.audioRef.current?.play();
          }
        }}
        onWordClick={setSelectedWord}
      />

      {/* Player bar */}
      <PlayerBar
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        onToggle={player.toggle}
        onSeek={player.seek}
        onVolume={player.setVolume}
        songTitle={song.title}
        songArtist={song.artist}
        showEnglish={showEnglish}
        onToggleEnglish={() => setShowEnglish((v) => !v)}
        hasAudio={!!song.audioUrl}
      />

      {/* Upload modal */}
      {showUpload && (
        <UploadModal onLoad={loadSong} onClose={() => setShowUpload(false)} />
      )}

      {/* Word lookup modal */}
      {selectedWord && (
        <WordModal word={selectedWord} onClose={() => setSelectedWord(null)} />
      )}
    </div>
  );
}
