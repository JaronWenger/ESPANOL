export async function fetchSyncedLyrics(title, artist) {
  const params = new URLSearchParams({ track_name: title, artist_name: artist });
  const res = await fetch(`https://lrclib.net/api/get?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.syncedLyrics || null; // LRC-format string or null if not available
}

export async function searchLrclib(query) {
  const res = await fetch(
    `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) return [];
  return res.json(); // array of { trackName, artistName, syncedLyrics, ... }
}
