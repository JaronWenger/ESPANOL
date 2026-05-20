export async function fetchAlbumArt(title, artist) {
  const query = encodeURIComponent(`${artist} ${title}`);
  const res = await fetch(
    `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const result = data.results?.[0];
  if (!result?.artworkUrl100) return null;
  // Replace 100x100 thumbnail with 500x500
  return result.artworkUrl100.replace('100x100bb', '500x500bb');
}
