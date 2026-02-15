import { useEffect, useRef, useState } from 'react';
import './FlyingBee.css';

const BEE_SIZE = 40;

export default function FlyingBee({ targetPosition }) {
  const beeRef = useRef(null);
  const [position, setPosition] = useState(() => {
    if (typeof window === 'undefined') return { x: '100px', y: '100px' };
    return {
      x: `${Math.random() * (window.innerWidth - BEE_SIZE)}px`,
      y: `${Math.random() * (window.innerHeight - BEE_SIZE)}px`,
    };
  });
  const isTouchTarget = useRef(false);

  useEffect(() => {
    const bee = beeRef.current;
    if (!bee) return;

    const moveToRandom = () => {
      if (isTouchTarget.current) return;
      const x = Math.random() * (window.innerWidth - BEE_SIZE);
      const y = Math.random() * (window.innerHeight - BEE_SIZE);
      setPosition({ x: `${x}px`, y: `${y}px` });
      bee.style.transition = `left 3s ease-in-out, top 3s ease-in-out`;
    };

    moveToRandom();
    const interval = setInterval(moveToRandom, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const bee = beeRef.current;
    if (!bee || !targetPosition) return;

    const { x, y } = targetPosition;
    const half = BEE_SIZE / 2;
    const posX = Math.max(half, Math.min(window.innerWidth - half, x));
    const posY = Math.max(half, Math.min(window.innerHeight - half, y));

    isTouchTarget.current = true;
    bee.style.transition = `left 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    setPosition({ x: `${posX}px`, y: `${posY}px` });

    const t = setTimeout(() => {
      isTouchTarget.current = false;
    }, 1000);
    return () => clearTimeout(t);
  }, [targetPosition]);

  return (
    <div
      className="flying-bee"
      ref={beeRef}
      style={{ left: position.x, top: position.y }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="flying-bee-svg">
        <defs>
          <linearGradient id="beeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD93D" />
            <stop offset="100%" stopColor="#e6c235" />
          </linearGradient>
        </defs>
        <ellipse cx="32" cy="36" rx="14" ry="16" fill="#1a1a1a" />
        <ellipse cx="32" cy="32" rx="10" ry="12" fill="url(#beeGrad)" />
        <path d="M18 20 Q20 14 28 12 Q32 10 36 12 Q44 14 46 20" stroke="#1a1a1a" strokeWidth="2" fill="none" className="wing wing-left" />
        <path d="M18 44 Q20 50 28 52 Q32 54 36 52 Q44 50 46 44" stroke="#1a1a1a" strokeWidth="2" fill="none" className="wing wing-right" />
        <line x1="22" y1="32" x2="26" y2="32" stroke="#1a1a1a" strokeWidth="1.5" />
        <line x1="38" y1="32" x2="42" y2="32" stroke="#1a1a1a" strokeWidth="1.5" />
        <circle cx="30" cy="28" r="2" fill="#1a1a1a" />
        <circle cx="34" cy="28" r="2" fill="#1a1a1a" />
      </svg>
    </div>
  );
}
