'use client';
import { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

export default function LoadingScreen() {
  const [phase, setPhase] = useState<'enter' | 'exit' | 'done'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('exit'), 2200);
    const t2 = setTimeout(() => setPhase('done'), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'done') return null;

  return (
    <div className={`${styles.overlay} ${phase === 'exit' ? styles.exit : ''}`}>
      <div className={styles.inner}>
        <div className={styles.nameRow}>
          <span className={styles.luigi}>Luigi</span>
          <span className={styles.mello}>Mello</span>
        </div>
        <div className={styles.tagline}>Full-Stack Developer</div>
        <div className={styles.barTrack}>
          <div className={styles.barFill} />
        </div>
      </div>
    </div>
  );
}
