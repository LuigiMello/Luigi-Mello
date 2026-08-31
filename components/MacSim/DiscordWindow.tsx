'use client';
import { useEffect, useState } from 'react';
import styles from './DiscordWindow.module.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const AVATAR = `${BASE}/mello.jpg`;

const messages = [
  'Progresso não precisa ser barulho para ser real.',
  'Refatorando a vida um commit de cada vez.',
  'Café, código e um bug misterioso.',
  'Buildando coisas que dão orgulho.',
];

export default function DiscordWindow({ onClose }: { onClose: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 300);
    }, 3600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <span className={styles.titleText}>Discord</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.banner}>
            <div className={styles.bannerGlow1} />
            <div className={styles.bannerGlow2} />

            <div className={`${styles.bubble} ${visible ? styles.bubbleShow : ''}`}>
              {messages[msgIndex]}
            </div>
          </div>

          <div className={styles.profileRow}>
            <div className={styles.avatarWrap}>
              <img src={AVATAR} alt="Luigi Mello" className={styles.avatar} />
              <span className={styles.onlineDot} />
            </div>
          </div>

          <div className={styles.identity}>
            <span className={styles.displayName}>Luigi Mello</span>
            <span className={styles.handle}>.luigimello</span>
            <div className={styles.badges}>
              <span className={styles.badge}>⭐</span>
              <span className={styles.badge}>💠</span>
              <span className={styles.badge}>🚀</span>
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>Coleção</span>
            <div className={styles.swatches}>
              <span className={styles.swatch} />
              <span className={styles.swatch} />
              <span className={styles.swatch} />
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.actionRow}>
              <span>✏️&nbsp; Editar perfil</span>
            </button>
            <button className={styles.actionRow}>
              <span><span className={styles.dotGreen} />&nbsp; Disponível</span>
              <span className={styles.chevron}>›</span>
            </button>
            <button className={styles.actionRow}>
              <span>👤&nbsp; Mudar de conta</span>
              <span className={styles.chevron}>›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
