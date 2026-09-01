'use client';
import { useState } from 'react';
import styles from './SpaceBackground.module.css';

interface Star {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 1.6 + 0.6,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 3,
  }));
}

const SHIPS = [
  { top: 16, delay: 0, duration: 24, scale: 1 },
  { top: 58, delay: 10, duration: 30, scale: 0.65 },
  { top: 36, delay: 20, duration: 26, scale: 0.85 },
];

export default function SpaceBackground() {
  const [stars] = useState(() => generateStars(90));

  return (
    <div className={styles.space} aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className={styles.star}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {SHIPS.map((ship, i) => (
        <svg
          key={i}
          className={styles.ship}
          viewBox="0 0 60 24"
          style={
            {
              top: `${ship.top}%`,
              animationDelay: `${ship.delay}s`,
              animationDuration: `${ship.duration}s`,
              '--s': ship.scale,
            } as React.CSSProperties
          }
        >
          <defs>
            <linearGradient id={`shipGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6f93c4" />
              <stop offset="100%" stopColor="#eaf5ff" />
            </linearGradient>
          </defs>
          <polygon points="0,12 44,4 60,12 44,20" fill={`url(#shipGrad-${i})`} />
          <polygon points="0,12 22,10.5 22,13.5" fill="#00d0ff" opacity="0.75" />
          <circle cx="47" cy="12" r="2.2" fill="#00d0ff" />
        </svg>
      ))}
    </div>
  );
}
