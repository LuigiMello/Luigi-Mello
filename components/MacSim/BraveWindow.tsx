'use client';
import { useEffect, useState } from 'react';
import styles from './BraveWindow.module.css';
import { ScrollContainerProvider } from '@/context/ScrollContainerContext';

export default function BraveWindow({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);

  // The Navbar/Mascot inside `children` are `position: fixed`, so they need a
  // transformed, non-scrolling ancestor as their containing block (this frame) —
  // the actual native scroll happens one level deeper, in SmoothScroll's
  // embedded wrapper, which is what ScrollTrigger needs as its `scroller`.
  useEffect(() => {
    setScrollEl(document.getElementById('embedded-scroll'));
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <div className={styles.traffic}>
            <button className={`${styles.dot} ${styles.red}`} onClick={onClose} aria-label="Fechar" />
            <span className={`${styles.dot} ${styles.yellow}`} />
            <span className={`${styles.dot} ${styles.green}`} />
          </div>
          <div className={styles.tab}>
            <span className={styles.tabDot} />
            <span className={styles.tabTitle}>Luigi Mello — Portfólio</span>
          </div>
        </div>

        <div className={styles.addressBar}>
          <span className={styles.navArrow}>‹</span>
          <span className={`${styles.navArrow} ${styles.navArrowDim}`}>›</span>
          <span className={styles.navArrow}>⟳</span>
          <div className={styles.urlBox}>
            <span className={styles.lockIcon}>🔒</span>
            luigimello.dev
          </div>
        </div>

        <div className={styles.viewport}>
          <ScrollContainerProvider value={scrollEl}>{children}</ScrollContainerProvider>
        </div>
      </div>
    </div>
  );
}
