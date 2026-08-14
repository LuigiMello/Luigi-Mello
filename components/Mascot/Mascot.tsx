'use client';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import styles from './Mascot.module.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const MESSAGES: Record<string, string> = {
  about:    'Oi! Esse sou eu! 😄 Aqui você vai me conhecer melhor — minha história, skills e redes sociais!',
  skills:   'Essas são as tecnologias que eu domino! 💻 Frontend, Backend, IA e muito mais! Usa o filtro!',
  projects: 'Esses projetos foram criados por mim! 🚀 Clica em "Ver Projeto" pra ver ao vivo!',
  services: 'Posso te ajudar com tudo isso! ✨ Desenvolvimento web, IA, sistemas — chama!',
  contact:  'Bora conversar? 📩 Manda mensagem ou me segue nas redes — prometo que respondo!',
};

const SECTION_IDS = ['about', 'skills', 'projects', 'services', 'contact'];

function getActiveSection(): string | null {
  const scroll = window.scrollY;
  const vh     = window.innerHeight;
  let best: string | null = null;
  let bestScore = -Infinity;

  for (const id of SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    /* Use offsetTop (layout pos) + scrollY — works with GSAP ScrollSmoother */
    const top    = el.offsetTop - scroll;
    const bottom = top + el.offsetHeight;
    const visible = Math.min(bottom, vh) - Math.max(top, 0);
    if (visible > bestScore) { bestScore = visible; best = id; }
  }

  /* only activate when at least 25% of viewport is the section */
  return bestScore > vh * 0.25 ? best : null;
}

export default function Mascot() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [displayedMsg, setDisplayedMsg]   = useState('');
  const [bubbleKey, setBubbleKey]         = useState(0);
  const [show, setShow]                   = useState(false);
  const typeTimer = useRef<NodeJS.Timeout | null>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    console.log('[Mascot] useEffect mounted');
    /* Poll via rAF — works with ScrollSmoother's transform-based scrolling */
    let frameCount = 0;
    const tick = () => {
      frameCount++;
      if (frameCount % 120 === 0) console.log('[Mascot] tick', frameCount, 'scrollY', window.scrollY);
      const section = getActiveSection();
      const heroEl = document.getElementById('home');
      const heroTop  = heroEl ? heroEl.offsetTop - window.scrollY : -9999;
      const heroBot  = heroEl ? heroTop + heroEl.offsetHeight : -9999;
      const heroVis  = Math.min(heroBot, window.innerHeight) - Math.max(heroTop, 0);

      if (heroVis > window.innerHeight * 0.5) {
        /* Hero is dominant — hide mascot */
        setShow(false);
      } else if (section) {
        setActiveSection(prev => {
          if (prev !== section) setBubbleKey(k => k + 1);
          return section;
        });
        setShow(true);
      } else {
        setShow(false);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* Typewriter when activeSection / bubbleKey changes */
  useEffect(() => {
    if (!activeSection) return;
    const full = MESSAGES[activeSection] ?? '';
    setDisplayedMsg('');
    if (typeTimer.current) clearInterval(typeTimer.current);
    let i = 0;
    typeTimer.current = setInterval(() => {
      i++;
      setDisplayedMsg(full.slice(0, i));
      if (i >= full.length && typeTimer.current) {
        clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    }, 25);
    return () => { if (typeTimer.current) clearInterval(typeTimer.current); };
  }, [activeSection, bubbleKey]);

  return (
    <div className={`${styles.mascot} ${show && activeSection ? styles.show : ''}`}>
      <div className={styles.bubble} key={bubbleKey}>
        <p className={styles.bubbleText}>
          {displayedMsg}
          <span className={styles.cursor}>|</span>
        </p>
        <div className={styles.tail} />
      </div>
      <div className={styles.character}>
        <Image
          src={`${BASE}/mello.jpg`}
          alt="Luigi Mello"
          width={96}
          height={128}
          className={styles.charImg}
          priority
        />
      </div>
    </div>
  );
}
