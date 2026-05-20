import { useState, useRef } from 'react';
import { parseLRC } from '../utils/lrcParser';
import { fetchSyncedLyrics } from '../utils/lrclib';
import { recognizeSong } from '../utils/acr';
import './UploadModal.css';

const LRC_EXAMPLE = `[ti:Song Title]
[ar:Artist Name]
[00:04.00]Primera línea de la canción
[00:07.50]Segunda línea de la canción
[00:11.00]Tercera línea aquí`;

export default function UploadModal({ onLoad, onClose }) {
  const [mp3File, setMp3File] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lrcPreview, setLrcPreview] = useState(null); // parsed lyrics from lrclib
  const [lrcFile, setLrcFile] = useState(null);       // manual .lrc file
  const [lrcText, setLrcText] = useState('');         // manual paste
  const [tab, setTab] = useState('auto');             // 'auto' | 'manual'
  const [recognizing, setRecognizing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  const mp3Ref = useRef();
  const lrcRef = useRef();

  const handleMp3Drop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.includes('audio')) {
      setMp3File(file);
      setLrcPreview(null);
      setError('');
    }
  };

  const handleMp3Pick = (file) => {
    setMp3File(file);
    setLrcPreview(null);
    setError('');
  };

  const handleRecognize = async () => {
    if (!mp3File) return setError('Drop an MP3 file first.');
    setRecognizing(true);
    setError('');
    try {
      const result = await recognizeSong(mp3File);
      if (!result) {
        setError('Song not recognized. Try entering the title and artist manually.');
      } else {
        const t = result.title || '';
        const a = result.artist || '';
        setTitle(t);
        setArtist(a);
        await doFetchLyrics(t, a);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRecognizing(false);
    }
  };

  const doFetchLyrics = async (t, a) => {
    const trackTitle = (t || title || '').trim();
    const trackArtist = (a || artist || '').trim();
    if (!trackTitle) return setError('Enter a song title first.');
    setFetching(true);
    setError('');
    try {
      const lrc = await fetchSyncedLyrics(trackTitle, trackArtist);
      if (!lrc) {
        setError('No synced lyrics found on lrclib.net for this song. Try the Manual tab.');
        setLrcPreview(null);
      } else {
        const { lyrics } = parseLRC(lrc);
        setLrcPreview(lyrics);
      }
    } catch (e) {
      setError('Could not reach lrclib.net. Check your connection.');
    } finally {
      setFetching(false);
    }
  };

  const submitAuto = () => {
    if (!mp3File) return setError('Please select an MP3 file.');
    if (!lrcPreview?.length) return setError('Fetch lyrics first.');
    onLoad({
      audioUrl: URL.createObjectURL(mp3File),
      lyrics: lrcPreview,
      title: title || mp3File.name.replace(/\.[^.]+$/, ''),
      artist: artist || 'Unknown Artist',
    });
  };

  const submitManual = async () => {
    if (!mp3File) return setError('Please select an MP3 file.');
    setError('');

    let lyrics = [];
    let detectedTitle = title;
    let detectedArtist = artist;

    if (lrcFile) {
      const text = await lrcFile.text();
      const parsed = parseLRC(text);
      lyrics = parsed.lyrics;
      if (!detectedTitle && parsed.meta.ti) detectedTitle = parsed.meta.ti;
      if (!detectedArtist && parsed.meta.ar) detectedArtist = parsed.meta.ar;
    } else if (lrcText.trim()) {
      const parsed = parseLRC(lrcText);
      lyrics = parsed.lyrics;
      if (!detectedTitle && parsed.meta.ti) detectedTitle = parsed.meta.ti;
      if (!detectedArtist && parsed.meta.ar) detectedArtist = parsed.meta.ar;
    }

    onLoad({
      audioUrl: URL.createObjectURL(mp3File),
      lyrics,
      title: detectedTitle || mp3File.name.replace(/\.[^.]+$/, ''),
      artist: detectedArtist || 'Unknown Artist',
    });
  };

  const switchTab = (t) => { setTab(t); setError(''); };

  return (
    <div className="upload-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="upload-modal">
        <div className="upload-header">
          <h2>Load a Song</h2>
          <button className="upload-close" onClick={onClose}>✕</button>
        </div>

        <div className="upload-tabs">
          <button className={`upload-tab ${tab === 'auto' ? 'active' : ''}`} onClick={() => switchTab('auto')}>
            Auto-Detect
          </button>
          <button className={`upload-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => switchTab('manual')}>
            Manual Files
          </button>
        </div>

        {/* ── AUTO TAB ── */}
        {tab === 'auto' && (
          <div className="upload-section">
            {/* MP3 drop */}
            <div
              className={`drop-zone ${mp3File ? 'has-file' : ''}`}
              onDrop={handleMp3Drop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => mp3Ref.current.click()}
            >
              {mp3File ? (
                <>
                  <div className="drop-zone-icon">🎵</div>
                  <div className="drop-zone-name">{mp3File.name}</div>
                  <div className="drop-zone-size">{(mp3File.size / 1024 / 1024).toFixed(1)} MB</div>
                </>
              ) : (
                <>
                  <div className="drop-zone-icon">⬆</div>
                  <div className="drop-zone-hint">Drop MP3 here or click to browse</div>
                </>
              )}
            </div>
            <input ref={mp3Ref} type="file" accept="audio/*" style={{ display: 'none' }}
              onChange={(e) => handleMp3Pick(e.target.files[0])} />

            {/* Recognize row */}
            <button
              className="recognize-btn"
              onClick={handleRecognize}
              disabled={!mp3File || recognizing || fetching}
            >
              {recognizing ? <><span className="spinner" /> Recognizing…</> : '🎙 Recognize Song'}
            </button>

            <div className="or-divider"><span>or enter manually</span></div>

            {/* Title + Artist */}
            <div className="upload-meta-row">
              <input className="upload-input" placeholder="Song title" value={title}
                onChange={(e) => setTitle(e.target.value)} />
              <input className="upload-input" placeholder="Artist" value={artist}
                onChange={(e) => setArtist(e.target.value)} />
            </div>

            <button
              className="fetch-lyrics-btn"
              onClick={() => doFetchLyrics()}
              disabled={!title.trim() || fetching || recognizing}
            >
              {fetching
                ? <><span className="spinner" /> Searching lrclib.net…</>
                : '🔍 Find Synced Lyrics'}
            </button>

            {/* Lyrics preview */}
            {lrcPreview && lrcPreview.length > 0 && (
              <div className="lyrics-preview">
                <div className="lyrics-preview-label">
                  ✓ {lrcPreview.length} lines found
                </div>
                {lrcPreview.slice(0, 4).map((l, i) => (
                  <div key={i} className="lyrics-preview-line">{l.spanish}</div>
                ))}
                {lrcPreview.length > 4 && (
                  <div className="lyrics-preview-more">+ {lrcPreview.length - 4} more lines</div>
                )}
              </div>
            )}

            {error && <div className="upload-error">{error}</div>}

            <button
              className="upload-submit"
              onClick={submitAuto}
              disabled={!mp3File || !lrcPreview?.length}
            >
              Load Song
            </button>
          </div>
        )}

        {/* ── MANUAL TAB ── */}
        {tab === 'manual' && (
          <div className="upload-section">
            <div
              className={`drop-zone ${mp3File ? 'has-file' : ''}`}
              onDrop={handleMp3Drop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => mp3Ref.current.click()}
            >
              {mp3File ? (
                <>
                  <div className="drop-zone-icon">🎵</div>
                  <div className="drop-zone-name">{mp3File.name}</div>
                  <div className="drop-zone-size">{(mp3File.size / 1024 / 1024).toFixed(1)} MB</div>
                </>
              ) : (
                <>
                  <div className="drop-zone-icon">⬆</div>
                  <div className="drop-zone-hint">Drop MP3 here or click to browse</div>
                </>
              )}
            </div>

            <div className="upload-lrc-row">
              <label className="upload-lrc-label">
                <span>Synced lyrics (.lrc) — optional</span>
                <button className="lrc-pick-btn" onClick={() => lrcRef.current.click()} type="button">
                  {lrcFile ? lrcFile.name : 'Choose .lrc file'}
                </button>
              </label>
              <input ref={lrcRef} type="file" accept=".lrc,text/*" style={{ display: 'none' }}
                onChange={(e) => setLrcFile(e.target.files[0])} />
            </div>

            <div className="paste-label-row">
              <span className="paste-label">Or paste .lrc text</span>
              <button className="paste-example-btn" onClick={() => setLrcText(LRC_EXAMPLE)} type="button">
                Show example
              </button>
            </div>
            <textarea
              className="lrc-textarea"
              placeholder={`[00:04.00]Primera línea\n[00:07.50]Segunda línea\n...`}
              value={lrcText}
              onChange={(e) => setLrcText(e.target.value)}
              spellCheck={false}
            />
            <div className="paste-hint">
              Get .lrc files at <a href="https://lrclib.net" target="_blank" rel="noreferrer">lrclib.net</a>
            </div>

            <div className="upload-meta-row">
              <input className="upload-input" placeholder="Song title (optional)" value={title}
                onChange={(e) => setTitle(e.target.value)} />
              <input className="upload-input" placeholder="Artist (optional)" value={artist}
                onChange={(e) => setArtist(e.target.value)} />
            </div>

            {error && <div className="upload-error">{error}</div>}

            <button className="upload-submit" onClick={submitManual} disabled={!mp3File}>
              Load Song
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
