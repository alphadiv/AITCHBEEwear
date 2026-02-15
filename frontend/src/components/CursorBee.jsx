import { useEffect, useState } from 'react';
import './CursorBee.css';

export default function CursorBee() {
  const [pos, setPos] = useState({ x: -50, y: -50 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);

    window.addEventListener('mousemove', handleMove);
    document.body.addEventListener('mouseleave', handleLeave);
    document.body.addEventListener('mouseenter', handleEnter);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.body.removeEventListener('mouseleave', handleLeave);
      document.body.removeEventListener('mouseenter', handleEnter);
    };
  }, [visible]);

  return (
    <div
      className={`cursor-bee ${visible ? 'visible' : ''}`}
      style={{ left: pos.x, top: pos.y }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="cursor-bee-svg">
        <defs>
          <linearGradient id="cursorBeeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD93D" />
            <stop offset="100%" stopColor="#e6c235" />
          </linearGradient>
        </defs>
        <ellipse cx="32" cy="36" rx="14" ry="16" fill="#1a1a1a" />
        <ellipse cx="32" cy="32" rx="10" ry="12" fill="url(#cursorBeeGrad)" />
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
