'use client';
import styles from './LockScreen.module.css';

function capitalize(s: string) {
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function LockScreen({
  now,
  onAdvance,
}: {
  now: Date | null;
  onAdvance: () => void;
}) {
  const time = now ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  const date = now
    ? capitalize(now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))
    : '';

  return (
    <button className={styles.lock} onClick={onAdvance} aria-label="Entrar">
      <div className={styles.glow} />
      <div className={styles.center}>
        <span className={styles.time}>{time}</span>
        <span className={styles.date}>{date}</span>
      </div>
      <span className={styles.hint}>clique para entrar e acessar o portfólio</span>
    </button>
  );
}
