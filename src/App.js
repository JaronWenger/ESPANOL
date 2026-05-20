import { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import LyricsDisplay from './components/LyricsDisplay';
import PlayerBar from './components/PlayerBar';
import UploadModal from './components/UploadModal';
import WordModal from './components/WordModal';
import { fetchSyncedLyrics } from './utils/lrclib';
import { parseLRC, getLyricIndex } from './utils/lrcParser';
import { fetchAlbumArt } from './utils/albumArt';
import logo from './assets/Espanol-modified.png';
// eslint-disable-next-line import/no-webpack-loader-syntax
import defaultAudio from './assets/MUSIC/LO QUE LE PASÓ A HAWAii.mp3';
import './App.css';

function extractWords(text) {
  return (text || '').split(/\s+/)
    .map(w => w.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/gi, ''))
    .filter(Boolean);
}

const DEFAULT_SONG = {
  title: 'Lo Que Le Pasó a Hawaii',
  artist: 'Bad Bunny',
  audioUrl: defaultAudio,
  lyrics: [],
};

export default function App() {
  const player = useAudioPlayer();
  const [song, setSong] = useState(DEFAULT_SONG);
  const [showEnglish, setShowEnglish] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordList, setWordList] = useState([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);

  // Auto-fetch lyrics + album art for the default song on mount
  useEffect(() => {
    fetchSyncedLyrics(DEFAULT_SONG.title, DEFAULT_SONG.artist)
      .then((lrc) => {
        if (lrc) {
          const { lyrics } = parseLRC(lrc);
          setSong((s) => ({ ...s, lyrics }));
        }
      })
      .catch(() => {});

    fetchAlbumArt(DEFAULT_SONG.title, DEFAULT_SONG.artist)
      .then((art) => { if (art) setSong((s) => ({ ...s, albumArt: art })); })
      .catch(() => {});
  }, []);

  const loadSong = useCallback(
    ({ audioUrl, lyrics, title, artist }) => {
      setSong({ title, artist, audioUrl, lyrics, albumArt: null });
      player.loadSrc(audioUrl);
      setShowUpload(false);
      fetchAlbumArt(title, artist)
        .then((art) => { if (art) setSong((s) => ({ ...s, albumArt: art })); })
        .catch(() => {});
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

  // Spacebar play/pause + arrow key word navigation when modal is open
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = ['INPUT', 'TEXTAREA'].includes(tag);

      if (selectedWord && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) {
        e.preventDefault();
        const dir = e.code === 'ArrowRight' ? 1 : -1;
        const nextWordIdx = wordIdx + dir;

        if (nextWordIdx >= 0 && nextWordIdx < wordList.length) {
          // Still within the same line
          setWordIdx(nextWordIdx);
          setSelectedWord(wordList[nextWordIdx]);
        } else {
          // Move to the adjacent line, skipping instrumentals
          const lyrics = song.lyrics;
          let nextLine = lineIdx + dir;
          while (nextLine >= 0 && nextLine < lyrics.length && lyrics[nextLine].instrumental) {
            nextLine += dir;
          }
          if (nextLine >= 0 && nextLine < lyrics.length) {
            const words = extractWords(lyrics[nextLine].spanish);
            if (words.length) {
              const newWordIdx = dir === 1 ? 0 : words.length - 1;
              setLineIdx(nextLine);
              setWordList(words);
              setWordIdx(newWordIdx);
              setSelectedWord(words[newWordIdx]);
            }
          }
        }
        return;
      }

      if (selectedWord && ['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
        setSelectedWord(null);
        return;
      }

      if ((e.code === 'ArrowUp' || e.code === 'ArrowDown') && !inInput && !showUpload && !selectedWord) {
        e.preventDefault();
        const lyrics = song.lyrics;
        const current = getLyricIndex(lyrics, player.currentTime);
        const dir = e.code === 'ArrowDown' ? 1 : -1;
        let next = current + dir;
        while (next >= 0 && next < lyrics.length && lyrics[next].instrumental) next += dir;
        if (next >= 0 && next < lyrics.length) player.seek(lyrics[next].time);
        return;
      }

      if (e.code === 'Space' && !inInput && !showUpload && !selectedWord) {
        e.preventDefault();
        player.toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [player, showUpload, selectedWord, wordList, wordIdx, lineIdx, song.lyrics, song.audioUrl]);

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
        onWordClick={(word) => {
          document.activeElement?.blur();
          const activeLine = getLyricIndex(song.lyrics, player.currentTime);
          const line = song.lyrics[activeLine];
          const words = extractWords(line?.spanish);
          const idx = words.indexOf(word);
          setLineIdx(activeLine);
          setWordList(words);
          setWordIdx(idx >= 0 ? idx : 0);
          setSelectedWord(word);
        }}
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
        albumArt={song.albumArt}
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
