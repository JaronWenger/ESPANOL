# EspañolMusic

Learn Spanish through music. Load a song, follow along with synced lyrics, tap any word for an instant translation and pronunciation.

**[Live app →](https://jarongwenger.github.io/ESPANOL)**

## Features

- 5 built-in Spanish songs with pre-translated lyrics
- Upload any MP3 — auto-recognizes the song and fetches synced lyrics
- Tap a word to look it up; swipe left/right to browse words
- English translation toggle, per-word pronunciation (Web Speech API)
- Shuffle, repeat, Spotify-style prev/next behavior
- PWA — installable on iPhone and Android

## Dev

```bash
npm start       # dev server on :3000
npm run build
npm run deploy  # → GitHub Pages
```

Requires `.env` with `REACT_APP_ACR_HOST`, `REACT_APP_ACR_ACCESS_KEY`, `REACT_APP_ACR_ACCESS_SECRET` for song recognition.
