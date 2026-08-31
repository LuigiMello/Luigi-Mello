'use client';
import { useEffect, useState } from 'react';
import styles from './MacSim.module.css';
import LockScreen from './LockScreen';
import LoginScreen from './LoginScreen';
import Desktop from './Desktop';

type Stage = 'lock' | 'login' | 'desktop';

export default function MacSim({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>('lock');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
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
