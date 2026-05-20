async function hmacSHA1Base64(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function recognizeSong(file) {
  const host = process.env.REACT_APP_ACR_HOST;
  const accessKey = process.env.REACT_APP_ACR_ACCESS_KEY;
  const accessSecret = process.env.REACT_APP_ACR_ACCESS_SECRET;

  if (!accessKey || !accessSecret || !host) {
    throw new Error('ACRCloud credentials missing — add REACT_APP_ACR_HOST, REACT_APP_ACR_ACCESS_KEY, and REACT_APP_ACR_ACCESS_SECRET to your .env and restart.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `POST\n/v1/identify\n${accessKey}\naudio\n1\n${timestamp}`;
  const signature = await hmacSHA1Base64(stringToSign, accessSecret);

  // Skip ~10% of the file to avoid intros, send up to 3 MB
  const skip = Math.min(200 * 1024, Math.floor(file.size * 0.1));
  const maxBytes = 3 * 1024 * 1024;
  const slice = file.size > skip + maxBytes
    ? file.slice(skip, skip + maxBytes)
    : file.size > skip
      ? file.slice(skip)
      : file;

  const form = new FormData();
  form.append('sample', slice, 'audio.mp3');
  form.append('access_key', accessKey);
  form.append('data_type', 'audio');
  form.append('signature_version', '1');
  form.append('signature', signature);
  form.append('sample_bytes', String(slice.size));
  form.append('timestamp', String(timestamp));

  const res = await fetch(`https://${host}/v1/identify`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`ACRCloud HTTP error: ${res.status}`);

  const data = await res.json();
  console.log('[ACRCloud response]', data);

  // 1001 = no result found
  if (data.status?.code === 1001) return null;
  if (data.status?.code !== 0) throw new Error(`ACRCloud: ${data.status?.msg || 'Unknown error'}`);

  const track = data.metadata?.music?.[0];
  if (!track) return null;

  return {
    title: track.title || '',
    artist: track.artists?.[0]?.name || '',
    album: track.album?.name || '',
  };
}
