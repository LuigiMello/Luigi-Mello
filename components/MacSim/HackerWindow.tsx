'use client';
import styles from './HackerWindow.module.css';

export default function HackerWindow({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <div className={styles.traffic}>
            <button className={`${styles.dot} ${styles.red}`} onClick={onClose} aria-label="Fechar" />
            <span className={`${styles.dot} ${styles.yellow}`} />
            <span className={`${styles.dot} ${styles.green}`} />
          </div>
          <span className={styles.title}>root@ghost:~# ./access_granted.sh</span>
        </div>
        <div className={styles.viewport}>{children}</div>
      </div>
    </div>
  );
}
