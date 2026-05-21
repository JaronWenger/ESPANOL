import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import LyricsDisplay from './components/LyricsDisplay';
import PlayerBar from './components/PlayerBar';
import UploadModal from './components/UploadModal';
import WordModal from './components/WordModal';
import AlbumCarousel from './components/AlbumCarousel';
import PlaylistModal from './components/PlaylistModal';
import { getLyricIndex } from './utils/lrcParser';
import { speakEs } from './utils/speech';
import { fetchAlbumArt } from './utils/albumArt';
import { translateLyrics } from './utils/translateLyrics';
import logo from './assets/Espanol-modified.png';
import { BUILT_IN_SONGS } from './assets/builtInSongs';
import './App.css';

function extractWords(text) {
  return (text || '').split(/\s+/)
    .map(w => w.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/gi, ''))
    .filter(Boolean);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const player = useAudioPlayer();
  const [builtInIdx, setBuiltInIdx] = useState(0);
  const [song, setSong] = useState({ ...BUILT_IN_SONGS[0] });
  const [showEnglish, setShowEnglish] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordList, setWordList] = useState([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off' | 'all' | 'one'
  const [shuffleOrder, setShuffleOrder] = useState(() =>
    shuffleArray(BUILT_IN_SONGS.map((_, i) => i))
  );
  const [albumArts, setAlbumArts] = useState(() =>
    BUILT_IN_SONGS.map(s => s.albumArt || null)
  );
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Keep refs for use inside the 'ended' event listener
  const builtInIdxRef = useRef(builtInIdx);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  const shuffleOrderRef = useRef(shuffleOrder);
  // Set to true before a manual skip so the src-change useEffect auto-plays
  const shouldPlayOnLoadRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  useEffect(() => { builtInIdxRef.current = builtInIdx; }, [builtInIdx]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleOrderRef.current = shuffleOrder; }, [shuffleOrder]);

  // Pre-fetch album arts for all built-in songs that don't have hardcoded art
  useEffect(() => {
    BUILT_IN_SONGS.forEach((s, i) => {
      if (s.albumArt) return;
      fetchAlbumArt(s.title, s.artist)
        .then((art) => {
          if (!art) return;
          setAlbumArts(prev => {
            const next = [...prev];
            next[i] = art;
            return next;
          });
          if (builtInIdxRef.current === i) {
            setSong(prev => ({ ...prev, albumArt: art }));
          }
        })
        .catch(() => {});
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep albumArts in sync when song.albumArt updates for a built-in song
  useEffect(() => {
    if (builtInIdx >= 0 && song.albumArt) {
      setAlbumArts(prev => {
        if (prev[builtInIdx] === song.albumArt) return prev;
        const next = [...prev];
        next[builtInIdx] = song.albumArt;
        return next;
      });
    }
  }, [builtInIdx, song.albumArt]);

  const applyTranslations = useCallback((lyrics) => {
    setTranslating(true);
    translateLyrics(lyrics).then(translations => {
      setSong(s => ({
        ...s,
        lyrics: s.lyrics.map((line, i) => ({ ...line, english: translations[i] || '' })),
      }));
      setTranslating(false);
    }).catch(() => setTranslating(false));
  }, []);

  const switchToBuiltIn = useCallback((idx, autoPlay = false) => {
    const s = BUILT_IN_SONGS[idx];
    shouldPlayOnLoadRef.current = autoPlay;
    setBuiltInIdx(idx);
    setAlbumArts(arts => {
      const cachedArt = arts[idx] || s.albumArt || null;
      setSong({ ...s, albumArt: cachedArt });
      if (!cachedArt) {
        fetchAlbumArt(s.title, s.artist)
          .then((art) => {
            if (!art) return;
            setSong(prev => ({ ...prev, albumArt: art }));
            setAlbumArts(prev => {
              const next = [...prev];
              next[idx] = art;
              return next;
            });
          })
          .catch(() => {});
      }
      return arts;
    });
    player.loadSrc(s.audioUrl);
    setSelectedWord(null);
  }, [player]);

  // Auto-advance when song ends (respects repeat + shuffle)
  useEffect(() => {
    const audio = player.audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      const r = repeatRef.current;
      const s = shuffleRef.current;
      const idx = builtInIdxRef.current;
      const order = shuffleOrderRef.current;
      const total = BUILT_IN_SONGS.length;

      if (r === 'one') {
        audio.currentTime = 0;
        audio.play();
        return;
      }

      let nextIdx;
      if (s) {
        const pos = order.indexOf(idx);
        const nextPos = (pos + 1) % total;
        nextIdx = order[nextPos];
        if (nextPos === 0 && r === 'off') return; // end of shuffled list, don't wrap
      } else {
        nextIdx = idx + 1;
        if (nextIdx >= total) {
          if (r === 'all') nextIdx = 0;
          else return; // end of list
        }
      }

      const next = BUILT_IN_SONGS[nextIdx];
      shouldPlayOnLoadRef.current = true;
      setBuiltInIdx(nextIdx);
      setSong({ ...next, albumArt: next.albumArt || null });
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [player.audioRef]);

  const loadSong = useCallback(
    ({ audioUrl, lyrics, title, artist }) => {
      setBuiltInIdx(-1);
      setSong({ title, artist, audioUrl, lyrics, albumArt: null });
      player.loadSrc(audioUrl);
      setShowUpload(false);
      setSelectedWord(null);
      if (lyrics.length) applyTranslations(lyrics);
      fetchAlbumArt(title, artist)
        .then((art) => { if (art) setSong((s) => ({ ...s, albumArt: art })); })
        .catch(() => {});
    },
    [player, applyTranslations]
  );

  // Sync audio src when song changes; auto-play if a skip requested it
  useEffect(() => {
    const audio = player.audioRef.current;
    if (!audio) return;
    if (song.audioUrl) {
      audio.src = song.audioUrl;
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
        audio.addEventListener('loadedmetadata', () => { audio.currentTime = 0.5; }, { once: true });
      }
      if (shouldPlayOnLoadRef.current) {
        shouldPlayOnLoadRef.current = false;
        audio.play().catch(() => {});
      }
    } else {
      audio.removeAttribute('src');
    }
  }, [song.audioUrl, player.audioRef]);

  // Sync repeat='one' with audio.loop
  useEffect(() => {
    const audio = player.audioRef.current;
    if (!audio) return;
    audio.loop = repeat === 'one';
  }, [repeat, player.audioRef]);

  const handleToggleShuffle = useCallback(() => {
    setShuffle(v => {
      if (!v) {
        // turning on: build a new shuffled order starting from current song
        const rest = BUILT_IN_SONGS.map((_, i) => i).filter(i => i !== builtInIdx);
        setShuffleOrder([builtInIdx, ...shuffleArray(rest)]);
      }
      return !v;
    });
  }, [builtInIdx]);

  const handleToggleRepeat = useCallback(() => {
    setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off');
  }, []);

  // Prev/next respecting shuffle, always looping
  const getNextIdx = useCallback((dir) => {
    if (builtInIdx < 0) return dir === 1 ? 0 : BUILT_IN_SONGS.length - 1;
    if (shuffle) {
      const pos = shuffleOrder.indexOf(builtInIdx);
      const newPos = (pos + dir + shuffleOrder.length) % shuffleOrder.length;
      return shuffleOrder[newPos];
    }
    return (builtInIdx + dir + BUILT_IN_SONGS.length) % BUILT_IN_SONGS.length;
  }, [builtInIdx, shuffle, shuffleOrder]);

  const speakSpanish = useCallback((text) => speakEs(text), []);

  const navigateWord = useCallback((dir) => {
    const nextWordIdx = wordIdx + dir;
    if (nextWordIdx >= 0 && nextWordIdx < wordList.length) {
      const word = wordList[nextWordIdx];
      setWordIdx(nextWordIdx);
      setSelectedWord(word);
      if (!player.isPlaying) speakSpanish(word);
    } else {
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
          if (!player.isPlaying) speakSpanish(words[newWordIdx]);
        }
      }
    }
  }, [wordIdx, wordList, lineIdx, song.lyrics, player.isPlaying, speakSpanish]);

  // Keyboard handler
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = ['INPUT', 'TEXTAREA'].includes(tag);

      if (selectedWord && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) {
        e.preventDefault();
        navigateWord(e.code === 'ArrowRight' ? 1 : -1);
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
  }, [player, showUpload, selectedWord, navigateWord, song.lyrics, song.audioUrl]);

  const prevIdx = getNextIdx(-1);
  const nextIdx = getNextIdx(1);
  const carouselIdx = builtInIdx >= 0 ? builtInIdx : 0;

  return (
    <div className="app">
      <audio ref={player.audioRef} preload="auto" />

      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <img src={logo} alt="EspañolMusic" className="app-logo-img" />
        </div>
        <AlbumCarousel
          songs={BUILT_IN_SONGS}
          albumArts={albumArts}
          currentIdx={carouselIdx}
          onOpen={() => setShowPlaylist(true)}
          onSelect={(idx) => switchToBuiltIn(idx, player.isPlaying)}
        />
        <div className="app-header-actions">
          <button className="load-btn" onClick={() => setShowUpload(true)}>
            <span className="load-btn-label">+ Load Song</span>
            <span className="load-btn-icon" aria-hidden="true">+</span>
          </button>
        </div>
      </header>

      {/* Song title banner */}
      {song.title && (
        <div className="song-banner">
          <div className="song-banner-title">{song.title}</div>
          <div className="song-banner-artist">{song.artist}</div>
        </div>
      )}

      {/* Lyrics */}
      <LyricsDisplay
        lyrics={song.lyrics}
        currentTime={player.currentTime}
        isPlaying={player.isPlaying}
        showEnglish={showEnglish}
        onSeek={player.seek}
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
          if (!player.isPlaying) speakSpanish(word);
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
        translating={translating}
        hasAudio={!!song.audioUrl}
        onPrev={() => {
          if (player.currentTime > 3) {
            player.seek(0);
          } else {
            switchToBuiltIn(prevIdx, player.isPlaying);
          }
        }}
        onNext={() => switchToBuiltIn(nextIdx, player.isPlaying)}
        shuffle={shuffle}
        onToggleShuffle={handleToggleShuffle}
        repeat={repeat}
        onToggleRepeat={handleToggleRepeat}
      />

      {/* Playlist modal */}
      {showPlaylist && (
        <PlaylistModal
          songs={BUILT_IN_SONGS}
          albumArts={albumArts}
          currentIdx={builtInIdx}
          onSelect={(idx) => switchToBuiltIn(idx)}
          onAddSong={() => setShowUpload(true)}
          onClose={() => setShowPlaylist(false)}
        />
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal onLoad={loadSong} onClose={() => setShowUpload(false)} />
      )}

      {/* Word lookup modal */}
      {selectedWord && (
        <WordModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onNavigate={navigateWord}
        />
      )}
    </div>
  );
}
