// Parse .lrc file format into timestamped lyrics array
export function parseLRC(content) {
  const lines = content.split('\n');
  const result = [];
  const tagRe = /^\[(\w+):(.+)\]$/;
  const timeRe = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;

  const meta = {};

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const tagMatch = line.match(tagRe);
    if (tagMatch) {
      meta[tagMatch[1]] = tagMatch[2].trim();
      continue;
    }

    const timeMatch = line.match(timeRe);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      const centis = parseInt(timeMatch[3].padEnd(3, '0'));
      const time = minutes * 60 + seconds + centis / 1000;
      const text = timeMatch[4].trim();
      if (text) result.push({ time, spanish: text, english: '' });
    }
  }

  result.sort((a, b) => a.time - b.time);
  return { lyrics: result, meta };
}

export function getLyricIndex(lyrics, currentTime) {
  if (!lyrics.length) return -1;
  let idx = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) idx = i;
    else break;
  }
  return idx;
}
