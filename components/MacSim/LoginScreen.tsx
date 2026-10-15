'use client';
import { useState } from 'react';
import styles from './LoginScreen.module.css';
import { EyeIcon } from './icons';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const AVATAR = `${BASE}/avatar.jpg`;
const DOT_COUNT = 6;

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [dots, setDots] = useState(0);
  const [status, setStatus] = useState<'idle' | 'filling' | 'checking'>('idle');

  const startFill = () => {
    if (status !== 'idle') return;
    setStatus('filling');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDots(i);
      if (i >= DOT_COUNT) {
        clearInterval(id);
        setStatus('checking');
        setTimeout(onLogin, 550);
      }
    }, 110);
  };

  return (
    <div className={styles.login}>
      <div className={styles.card}>
        <div className={styles.avatarRing}>
          <img src={AVATAR} alt="Luigi Mello" className={styles.avatar} />
        </div>
        <span className={styles.name}>Luigi Mello</span>

        <button type="button" className={styles.field} onClick={startFill} aria-label="Entrar">
          <div className={styles.dots}>
            {dots === 0 && <span className={styles.placeholder}>Senha</span>}
            {Array.from({ length: dots }).map((_, i) => (
              <span key={i} className={styles.dot} />
            ))}
          </div>
          <span className={styles.eyeBtn}>
            <EyeIcon open={false} />
          </span>
        </button>

        <span className={`${styles.tip} ${status === 'checking' ? styles.tipChecking : ''}`}>
          {status === 'checking' ? 'Entrando…' : 'clique para entrar e acessar o portfólio'}
        </span>
      </div>
    </div>
  );
}
