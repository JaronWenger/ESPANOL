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
      result.push({ time, spanish: text, english: '', instrumental: !text });
    }
  }

  result.sort((a, b) => a.time - b.time);

  // Insert instrumental markers for gaps longer than 10 seconds
  // Place the marker 40% into the gap so the previous lyric stays active long enough to read
  const withGaps = [];
  for (let i = 0; i < result.length; i++) {
    withGaps.push(result[i]);
    const next = result[i + 1];
    if (next && !result[i].instrumental && !next.instrumental) {
      const gap = next.time - result[i].time;
      if (gap >= 10) {
        const markerTime = result[i].time + 3.5;
        withGaps.push({ time: markerTime, spanish: '', english: '', instrumental: true });
      }
    }
  }

  return { lyrics: withGaps, meta };
}

export function getLyricIndex(lyrics, currentTime) {
  if (!lyrics.length) return -1;
  let idx = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time - 0.05) idx = i;
    else break;
  }
  return idx;
}
