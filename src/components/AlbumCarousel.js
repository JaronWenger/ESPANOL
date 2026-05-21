import { useState, useEffect, useRef, useCallback } from 'react';
import './AlbumCarousel.css';

const CLONE = 2;
const ITEM_W = 48;
const GAP = 10;
const STEP = ITEM_W + GAP;

export default function AlbumCarousel({ songs, albumArts, currentIdx, onOpen, onSelect }) {
  const n = songs.length;
  const trackRef = useRef(null);
  const [trackPos, setTrackPos] = useState(currentIdx + CLONE);
  const prevIdxRef = useRef(currentIdx);
  const [brokenUrls, setBrokenUrls] = useState(new Set());

  const handleImgError = useCallback((url) => {
    setBrokenUrls(prev => new Set([...prev, url]));
  }, []);

  // [clone(n-2), clone(n-1), s0, s1, ..., s(n-1), clone(0), clone(1)]
  const trackItems = [
    ...Array.from({ length: CLONE }, (_, i) => (n - CLONE + i + n) % n),
    ...Array.from({ length: n }, (_, i) => i),
    ...Array.from({ length: CLONE }, (_, i) => i % n),
  ];

  useEffect(() => {
    const prev = prevIdxRef.current;
    if (currentIdx === prev) return;
    prevIdxRef.current = currentIdx;

    const goForward = (prev + 1) % n === currentIdx;
    const goBackward = (prev - 1 + n) % n === currentIdx;

    if (goForward) {
      setTrackPos(p => p + 1);
    } else if (goBackward) {
      setTrackPos(p => p - 1);
    } else {
      const track = trackRef.current;
      if (track) track.style.transition = 'none';
      setTrackPos(currentIdx + CLONE);
      requestAnimationFrame(() => {
        if (trackRef.current) trackRef.current.style.transition = '';
      });
    }
  }, [currentIdx, n]);

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return;
    const track = trackRef.current;
    if (!track) return;

    setTrackPos(pos => {
      let next = pos;
      if (pos < CLONE) next = pos + n;
      else if (pos >= CLONE + n) next = pos - n;
      if (next !== pos) {
        track.style.transition = 'none';
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (trackRef.current) trackRef.current.style.transition = '';
          })
        );
      }
      return next;
    });
  };

  // Container width = 3 visible items
  const containerW = ITEM_W + 2 * STEP;
  const translateX = containerW / 2 - ITEM_W / 2 - trackPos * STEP;

  return (
    <div className="album-carousel" style={{ width: containerW }}>
      <div
        ref={trackRef}
        className="album-carousel-track"
        style={{
          width: trackItems.length * STEP,
          transform: `translateX(${translateX}px)`,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {trackItems.map((songIdx, i) => {
          const isCenter = i === trackPos;
          const isLeft = i === trackPos - 1;
          const isRight = i === trackPos + 1;
          const art = albumArts[songIdx];
          const showArt = art && !brokenUrls.has(art);

          let handleClick;
          if (isCenter) handleClick = onOpen;
          else if (isLeft || isRight) handleClick = () => onSelect(songIdx);

          return (
            <div
              key={i}
              className={`carousel-cover ${isCenter ? 'center' : 'side'}`}
              onClick={handleClick}
              style={{ cursor: handleClick ? 'pointer' : 'default' }}
            >
              {showArt
                ? <img
                    src={art}
                    alt={songs[songIdx]?.title}
                    draggable={false}
                    onError={() => handleImgError(art)}
                  />
                : <div className="carousel-placeholder">♪</div>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
