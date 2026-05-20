const LINES_PER_CHUNK = 8;
const SEP = '\n';

async function translateChunk(lines) {
  const joined = lines.join(SEP);
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(joined)}&langpair=es|en`
  );
  const data = await res.json();
  const raw = data.responseData?.translatedText || '';

  // MyMemory sometimes returns a rate-limit warning string
  if (raw.toLowerCase().includes('mymemory warning')) return lines.map(() => '');

  const result = raw.split(SEP);
  // If line count matches, great. Otherwise return what we have, padded with blanks.
  return lines.map((_, i) => result[i]?.trim() || '');
}

export async function translateLyrics(lyrics, onProgress) {
  const translatable = lyrics.map((l, i) => ({ idx: i, text: l.spanish || '', instrumental: l.instrumental }));
  const translations = new Array(lyrics.length).fill('');

  // Skip instrumental lines
  const textLines = translatable.filter(l => !l.instrumental && l.text.trim());

  for (let i = 0; i < textLines.length; i += LINES_PER_CHUNK) {
    const chunk = textLines.slice(i, i + LINES_PER_CHUNK);
    try {
      const results = await translateChunk(chunk.map(l => l.text));
      chunk.forEach((l, k) => { translations[l.idx] = results[k]; });
    } catch {
      // leave blank on error, don't crash
    }
    if (onProgress) onProgress(Math.min(i + LINES_PER_CHUNK, textLines.length), textLines.length);
    // Small pause between chunks to stay within rate limits
    if (i + LINES_PER_CHUNK < textLines.length) await new Promise(r => setTimeout(r, 120));
  }

  return translations;
}
