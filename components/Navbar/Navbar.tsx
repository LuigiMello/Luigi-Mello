'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Navbar.module.css';

const navIds = ['home', 'about', 'skills', 'projects', 'services', 'contact'] as const;

export default function Navbar() {
  const { tr, toggleLang, lang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    navIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { id: 'home',     label: tr.nav.home     },
    { id: 'about',    label: tr.nav.about    },
    { id: 'skills',   label: tr.nav.skills   },
    { id: 'projects', label: tr.nav.projects },
    { id: 'services', label: tr.nav.services },
    { id: 'contact',  label: tr.nav.contact  },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.nav}>
        <button className={styles.logo} onClick={() => scrollTo('home')}>
          <span className={styles.logoTag}>&lt;</span>
          LM
          <span className={styles.logoTag}>&nbsp;/&gt;</span>
        </button>

        <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
          {navLinks.map(({ id, label }) => (
            <li key={id}>
              <button
                className={`${styles.navLink} ${active === id ? styles.activeLink : ''}`}
                onClick={() => scrollTo(id)}
              >
                <span className={styles.linkNumber}>
                  {String(navLinks.findIndex((l) => l.id === id) + 1).padStart(2, '0')}.
                </span>
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button className={styles.langBtn} onClick={toggleLang} title="Trocar idioma">
            {lang === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'}
          </button>
          <button
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
    </header>
  );
}
