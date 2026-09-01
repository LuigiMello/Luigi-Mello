'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useScrollContainer } from '@/context/ScrollContainerContext';
import styles from './Navbar.module.css';

const navIds = ['home', 'about', 'skills', 'projects', 'services', 'contact'] as const;

export default function Navbar() {
  const { tr, toggleLang, lang } = useLanguage();
  const scroller = useScrollContainer();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('home');

  // The embedded Brave window scrolls its own bounded element, not `window` —
  // without this, the navbar never learns it's scrolled and stays see-through
  // over content instead of picking up its solid backdrop.
  useEffect(() => {
    const target: HTMLElement | Window = scroller ?? window;
    const getY = () => (scroller ? scroller.scrollTop : window.scrollY);
    const onScroll = () => setScrolled(getY() > 20);
    onScroll();
    target.addEventListener('scroll', onScroll);
    return () => target.removeEventListener('scroll', onScroll);
  }, [scroller]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { root: scroller ?? null, rootMargin: '-40% 0px -55% 0px' }
    );
    navIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [scroller]);

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
          LM<span className={styles.logoTag}>-01</span>
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
