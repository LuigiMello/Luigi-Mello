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
    <section id="home" className={`${styles.hero} ${mounted ? styles.ready : ''}`}>
      <div className={styles.plate}>
        <span>MODELO — LM&#8209;01</span>
        <span>REV. 2026</span>
      </div>

      <div className={styles.threeWrap}>
        <ThreeHero />
      </div>

      <div className={styles.content}>
        <div className={styles.nameSpacer} aria-hidden="true" />

        <div className={styles.roleRow}>
          <span className={styles.roleBracket}>[</span>
          <span className={styles.roleText}>{displayText}</span>
          <span className={styles.cursor}>_</span>
          <span className={styles.roleBracket}>]</span>
        </div>

        <p className={styles.description}>{tr.hero.description}</p>

        <div className={styles.ctas}>
          <button className={styles.btnPrimary} onClick={() => scrollTo('projects')}>
            {tr.hero.ctaProjects}
          </button>
          <button className={styles.btnGhost} onClick={() => scrollTo('contact')}>
            {tr.hero.ctaContact}
          </button>
        </div>

        <div className={styles.specRow}>
          <div className={styles.spec}>
            <span className={styles.specVal}>10+</span>
            <span className={styles.specLbl}>{tr.about.stats.technologies}</span>
          </div>
          <div className={styles.spec}>
            <span className={styles.specVal}>3+</span>
            <span className={styles.specLbl}>{tr.about.stats.projects}</span>
          </div>
          <div className={styles.spec}>
            <span className={styles.specVal}>5</span>
            <span className={styles.specLbl}>{tr.about.stats.aiTools}</span>
          </div>
        </div>
      </div>

      <button className={styles.scrollBtn} onClick={() => scrollTo('about')}>
        <span className={styles.scrollLine} />
        <span className={styles.scrollText}>fig. 01 — role para continuar</span>
      </button>
    </section>
  );
}
