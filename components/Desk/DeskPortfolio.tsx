'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  BASE,
  CHANNELS,
  IMAGE_URLS,
  MAX_SPREAD,
  UI,
  getProjects,
  pageOf,
  spreadLabel,
  spreadOfPage,
  spreadProject,
  translations,
  type Lang,
} from './content';
import type { DrawContext } from './pages';
import type { DeskExperience, DeskState } from './scene';
import styles from './DeskPortfolio.module.css';

const FONT_FACES = [
  '300 40px "Inter Tight"',
  '400 40px "Inter Tight"',
  '500 40px "Inter Tight"',
  '600 40px "Inter Tight"',
  '700 40px "Inter Tight"',
  '800 40px "Inter Tight"',
  'italic 400 40px "Instrument Serif"',
  '400 40px "Instrument Serif"',
  '400 20px "JetBrains Mono"',
  '500 20px "JetBrains Mono"',
];

function loadImage(url: string) {
  return new Promise<[string, HTMLImageElement | undefined]>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve([url, img]);
    img.onerror = () => resolve([url, undefined]);
    img.src = `${BASE}${url}`;
  });
}

function makeDraw(lang: Lang, images: Map<string, HTMLImageElement>): DrawContext {
  return { lang, ui: UI[lang], projects: getProjects(lang), img: (u) => images.get(u) };
}

const CONTACT_SPREAD = spreadOfPage(pageOf('contact'));
const GRID_SPREAD = spreadOfPage(pageOf('grid'));

export default function DeskPortfolio() {
  const { lang, toggleLang } = useLanguage();
  const mountRef = useRef<HTMLDivElement>(null);
  const expRef = useRef<DeskExperience | null>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const langRef = useRef(lang);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [state, setState] = useState<DeskState>({ open: false, spread: 0 });
  const [touch, setTouch] = useState(false);

  langRef.current = lang;
  const ui = UI[lang];

  useEffect(() => {
    setTouch(matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const total = FONT_FACES.length + IMAGE_URLS.length;
      let done = 0;
      const tick = () => {
        done++;
        if (!cancelled) setProgress(done / total);
      };
      await Promise.all(FONT_FACES.map((f) => document.fonts.load(f).catch(() => undefined).then(tick)));
      const entries = await Promise.all(IMAGE_URLS.map((u) => loadImage(u).then((r) => (tick(), r))));
      if (cancelled || !mountRef.current) return;
      const images = new Map<string, HTMLImageElement>();
      for (const [u, img] of entries) if (img) images.set(u, img);
      imagesRef.current = images;
      try {
        const { DeskExperience } = await import('./scene');
        if (cancelled || !mountRef.current) return;
        expRef.current = new DeskExperience(mountRef.current, makeDraw(langRef.current, images), setState);
        setReady(true);
      } catch (err) {
        console.error(err);
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      expRef.current?.dispose();
      expRef.current = null;
    };
  }, []);

  useEffect(() => {
    expRef.current?.setLang(makeDraw(lang, imagesRef.current));
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);

  const go = useCallback((s: number) => expRef.current?.goTo(s), []);

  const { open, spread } = state;
  const projects = getProjects(lang);
  const projectIndex = spreadProject(spread);
  const project = projectIndex >= 0 ? projects[projectIndex] : null;
  const label = spread > 0 ? spreadLabel(spread, lang) : '';
  const pages = `${String(spread * 2 - 1).padStart(2, '0')}–${String(spread * 2).padStart(2, '0')}`;
  const live = project && project.demo && project.demo !== '#';
  const code = project && project.github && project.github !== '#';

  return (
    <main className={`${styles.root} ${ready ? styles.ready : ''} ${open ? styles.isOpen : ''}`}>
      <div ref={mountRef} className={styles.stage} aria-hidden="true" />

      <header className={styles.top}>
        <button className={styles.brand} onClick={() => go(0)} aria-label="luigi mello">
          <span className={styles.mark} />
          {ui.brand}
        </button>
        <div className={styles.topRight}>
          <button className={styles.lang} onClick={toggleLang} aria-label="Language">
            <span className={lang === 'pt' ? styles.on : ''}>PT</span>
            <span className={lang === 'en' ? styles.on : ''}>EN</span>
          </button>
          <button className={styles.cta} onClick={() => go(CONTACT_SPREAD)}>
            {ui.getInTouch}
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <h1>
          {ui.heroTitle[0]}
          <br />
          {ui.heroTitle[1]}
        </h1>
        <p>{touch ? ui.heroSubTouch : ui.heroSub}</p>
      </section>

      <nav className={styles.dock} aria-label="Magazine" aria-hidden={!open}>
        <button className={styles.arrow} onClick={() => go(spread - 1)} aria-label={ui.prev} tabIndex={open ? 0 : -1}>
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className={styles.info}>
          <span className={styles.pages}>{pages} / {String(MAX_SPREAD * 2).padStart(2, '0')}</span>
          <span className={styles.label}>{label}</span>
        </div>
        {project && (
          <div className={styles.links}>
            <button className={styles.ghost} onClick={() => go(GRID_SPREAD)} tabIndex={open ? 0 : -1}>
              {ui.allProjects}
            </button>
            {live && (
              <a href={project!.demo} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
                {ui.visit} ↗
              </a>
            )}
            {code && (
              <a href={project!.github} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
                {ui.code} ↗
              </a>
            )}
          </div>
        )}
        {spread === CONTACT_SPREAD && (
          <div className={styles.links}>
            {CHANNELS.slice(0, 4).map((c) => (
              <a key={c.key} href={c.href} target={c.key === 'email' ? undefined : '_blank'} rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
                {c.label}
              </a>
            ))}
          </div>
        )}
        <button className={styles.arrow} onClick={() => go(spread + 1)} disabled={spread >= MAX_SPREAD} aria-label={ui.next} tabIndex={open ? 0 : -1}>
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span className={styles.sep} />
        <button className={styles.close} onClick={() => go(0)} tabIndex={open ? 0 : -1}>
          {ui.close} ✕
        </button>
      </nav>

      <p className={styles.keys}>{ui.keys}</p>

      <div className={styles.loader} aria-hidden={ready}>
        <span className={styles.mark} />
        <span className={styles.loaderText}>{failed ? 'WebGL indisponível neste navegador.' : `${ui.loading}…`}</span>
        <span className={styles.bar}>
          <span style={{ transform: `scaleX(${progress})` }} />
        </span>
      </div>

      {/* plain-text copy of the magazine for search engines and screen readers */}
      <div className={styles.srOnly}>
        <h2>Luigi Mello, {translations[lang].hero.roles[0]}</h2>
        <p>{translations[lang].about.p1}</p>
        <ul>
          {projects.map((p) => (
            <li key={p.name}>
              <a href={p.demo !== '#' ? p.demo : p.github}>{p.name}</a>: {p.description}
            </li>
          ))}
        </ul>
        <ul>
          {CHANNELS.map((c) => (
            <li key={c.key}>
              <a href={c.href}>{c.label}: {c.handle}</a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
