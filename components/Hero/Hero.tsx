'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Hero.module.css';

const ThreeHero = dynamic(() => import('@/components/ThreeHero/ThreeHero'), { ssr: false });

export default function Hero() {
  const { tr } = useLanguage();
  const [displayText, setDisplayText] = useState('');
  const [roleIndex, setRoleIndex]     = useState(0);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const roles   = tr.hero.roles;
    const current = roles[roleIndex];
    const speed   = isDeleting ? 38 : 85;

    const t = setTimeout(() => {
      if (!isDeleting) {
        const next = current.slice(0, displayText.length + 1);
        setDisplayText(next);
        if (next.length === current.length) setTimeout(() => setIsDeleting(true), 2200);
      } else {
        const next = current.slice(0, displayText.length - 1);
        setDisplayText(next);
        if (next.length === 0) {
          setIsDeleting(false);
          setRoleIndex(i => (i + 1) % roles.length);
        }
      }
    }, speed);

    return () => clearTimeout(t);
  }, [displayText, isDeleting, roleIndex, tr.hero.roles]);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="home" className={styles.hero}>
      {/* Three.js scene — fills entire hero */}
      <div className={styles.threeWrap}>
        <ThreeHero />
      </div>

      {/* Glows */}
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      {/* Badge — small rectangle at top */}
      <div className={`${styles.heroBadge} ${mounted ? styles.heroBadgeVisible : ''}`}>
        <span className={styles.badgeDot} />
        {tr.hero.greeting}
      </div>

      {/* Main content — sits below 3D text area */}
      <div className={`${styles.content} ${mounted ? styles.visible : ''}`}>
        {/* Spacer: 3D "Luigi Mello" occupies this vertical space */}
        <div className={styles.nameSpacer} aria-hidden="true" />

        <div className={styles.roleRow}>
          <span className={styles.roleSlash}>&#47;&#47;&nbsp;</span>
          <span className={styles.roleText}>{displayText}</span>
          <span className={styles.cursor}>_</span>
        </div>

        <p className={styles.description}>{tr.hero.description}</p>

        <div className={styles.ctas}>
          <button className={styles.btnPrimary} onClick={() => scrollTo('projects')}>
            {tr.hero.ctaProjects}
            <span className={styles.btnIcon}>↗</span>
          </button>
          <button className={styles.btnGhost} onClick={() => scrollTo('contact')}>
            {tr.hero.ctaContact}
          </button>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statNum}>10<span className={styles.statPlus}>+</span></span>
            <span className={styles.statLbl}>{tr.about.stats.technologies}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>3<span className={styles.statPlus}>+</span></span>
            <span className={styles.statLbl}>{tr.about.stats.projects}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>5</span>
            <span className={styles.statLbl}>{tr.about.stats.aiTools}</span>
          </div>
        </div>
      </div>

      <button className={styles.scrollBtn} onClick={() => scrollTo('about')}>
        <span className={styles.scrollLine} />
        <span className={styles.scrollText}>scroll</span>
      </button>
    </section>
  );
}
