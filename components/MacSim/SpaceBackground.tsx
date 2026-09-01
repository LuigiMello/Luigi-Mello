'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './SpaceBackground.module.css';

const SpaceShips = dynamic(() => import('./SpaceShips'), { ssr: false });

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

      <SpaceShips />
    </div>
  );
}
