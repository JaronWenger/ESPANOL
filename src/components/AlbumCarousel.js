import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import './AlbumCarousel.css';

const CLONE = 2;
const ITEM_W = 48;
const GAP = 10;
const STEP = ITEM_W + GAP;
const TRANSITION = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';

export default function AlbumCarousel({ songs, albumArts, currentIdx, onOpen, onSelect }) {
  const n = songs.length;
  const trackRef = useRef(null);
  const [trackPos, setTrackPos] = useState(currentIdx + CLONE);
  const trackPosRef = useRef(trackPos);
  trackPosRef.current = trackPos; // always current, safe to read in event handlers

  const prevIdxRef = useRef(currentIdx);
  const suppressRef = useRef(false); // when true, next trackPos render snaps without animation
  const [brokenUrls, setBrokenUrls] = useState(new Set());
  const touchStartXRef = useRef(null);
  const SWIPE_THRESHOLD = 40;

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
      suppressRef.current = true;
      setTrackPos(currentIdx + CLONE);
    }
  }, [currentIdx, n]);

  // Runs after React mutates the DOM but before the browser paints.
  // When suppressRef is set, disable the transition for this frame only so
  // the clone→real snap is invisible, then restore it in the next rAF.
  useLayoutEffect(() => {
    if (!suppressRef.current || !trackRef.current) return;
    suppressRef.current = false;
    trackRef.current.style.transition = 'none';
    trackRef.current.classList.add('snapping');
    requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = TRANSITION;
        trackRef.current.classList.remove('snapping');
      }
    });
  }, [trackPos]);

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return;
    const pos = trackPosRef.current;
    if (pos >= CLONE && pos < CLONE + n) return; // real position, nothing to do
    suppressRef.current = true;
    setTrackPos(pos < CLONE ? pos + n : pos - n);
  };

  // Container width = 3 visible items
  const containerW = ITEM_W + 2 * STEP;
  const translateX = containerW / 2 - ITEM_W / 2 - trackPos * STEP;

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    const pos = trackPosRef.current;
    const adjacentSongIdx = trackItems[dx < 0 ? pos + 1 : pos - 1];
    if (adjacentSongIdx !== undefined) onSelect(adjacentSongIdx);
  };

  return (
    <div
      className="album-carousel"
      style={{ width: containerW }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
