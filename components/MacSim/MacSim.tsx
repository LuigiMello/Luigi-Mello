'use client';
import { useEffect, useState } from 'react';
import styles from './MacSim.module.css';
import LockScreen from './LockScreen';
import LoginScreen from './LoginScreen';
import Desktop from './Desktop';

type Stage = 'lock' | 'login' | 'desktop';

export default function MacSim({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>('lock');
  // Starts null so server and client render the same thing on first paint —
  // `new Date()` differs between build time (static export) and the
  // visitor's clock, which was throwing React hydration-mismatch errors.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.root}>
      {stage === 'lock' && <LockScreen now={now} onAdvance={() => setStage('login')} />}
      {stage === 'login' && <LoginScreen onLogin={() => setStage('desktop')} />}
      {stage === 'desktop' && (
        <Desktop now={now} onLock={() => setStage('lock')} portfolioContent={children} />
      )}
    </div>
  );
}
