export async function fetchAlbumArt(title, artist) {
  const query = encodeURIComponent(`${artist} ${title}`);
  const res = await fetch(
    `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=10`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const results = data.results || [];
  if (!results.length) return null;

  // Prefer a result whose artist name actually matches
  const artistLower = artist.toLowerCase();
  const match =
    results.find((r) => r.artistName?.toLowerCase().includes(artistLower)) ||
    results[0];

  if (!match?.artworkUrl100) return null;
  return match.artworkUrl100.replace('100x100bb', '500x500bb');
}
