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
  pageLabel,
  pageOf,
  spreadLabel,
  spreadOfPage,
  spreadProject,
  translations,
  type Lang,
} from './content';
import type { DrawContext } from './pages';
import type { DeskExperience, DeskState, Insets } from './scene';
import PageReader from './PageReader';
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

/**
 * desktop: the whole spread with a small dock underneath.
 * bottom:  phones/tablets held upright — one page at a time, reading panel below.
 * side:    phones/tablets held sideways, short windows — reading panel on the right.
 */
type Mode = 'desktop' | 'bottom' | 'side';

function modeFor(w: number, h: number): Mode {
  if (w >= 1180 && h >= 600) return 'desktop';
  return w > h && w >= 640 ? 'side' : 'bottom';
}

const CONTACT_PAGE = pageOf('contact');
const GRID_PAGE = pageOf('grid');
const CONTACT_SPREAD = spreadOfPage(CONTACT_PAGE);
const LAST_PAGE = MAX_SPREAD * 2;
const nn = (n: number) => String(n).padStart(2, '0');

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function DeskPortfolio() {
  const { lang, toggleLang } = useLanguage();
  const mountRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const sheetBodyRef = useRef<HTMLDivElement>(null);
  const expRef = useRef<DeskExperience | null>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const langRef = useRef(lang);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [state, setState] = useState<DeskState>({ open: false, spread: 0, focus: 'left', page: -1 });
  const [touch, setTouch] = useState(false);
  const [mode, setMode] = useState<Mode>('desktop');
  const [expanded, setExpanded] = useState(true);

  langRef.current = lang;
  const ui = UI[lang];
  const compact = mode !== 'desktop';
  const { open, spread } = state;

  useEffect(() => {
    setTouch(matchMedia('(pointer: coarse)').matches);
    setExpanded(window.innerWidth < 700);
    const update = () => setMode(modeFor(window.innerWidth, window.innerHeight));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
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

  /* Tell the 3D scene which part of the screen the interface covers, so the
     magazine is framed in the space that's left. */
  const measure = useCallback(() => {
    const exp = expRef.current;
    if (!exp) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 60;
    let insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
    if (mode === 'desktop') {
      if (open) insets = { top: 72, right: 0, bottom: 104, left: 0 };
    } else if (!open) {
      const hero = heroRef.current?.getBoundingClientRect();
      insets =
        mode === 'side'
          ? { top: headerBottom, right: 0, bottom: 12, left: hero ? Math.min(hero.right + 16, w * 0.5) : w * 0.45 }
          : { top: hero ? hero.bottom + 10 : h * 0.32, right: 0, bottom: 24, left: 0 };
    } else {
      const sheet = sheetRef.current?.getBoundingClientRect();
      insets =
        mode === 'side'
          ? { top: headerBottom, right: sheet ? w - sheet.left + 8 : w * 0.44, bottom: 10, left: 0 }
          : { top: headerBottom + 4, right: 0, bottom: sheet ? h - sheet.top + 10 : h * 0.5, left: 0 };
    }
    exp.setLayout({ compact: mode !== 'desktop', insets });
  }, [mode, open]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    [sheetRef.current, heroRef.current, headerRef.current].forEach((el) => el && ro.observe(el));
    window.addEventListener('resize', measure);
    // the panel animates its height; keep re-measuring while it settles
    const timers = [120, 300, 520, 800].map((ms) => window.setTimeout(measure, ms));
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [measure, ready, expanded, state.page]);

  useEffect(() => {
    sheetBodyRef.current?.scrollTo({ top: 0 });
  }, [state.page]);

  const goTo = useCallback((s: number) => expRef.current?.goTo(s), []);
  const goPage = useCallback((p: number) => expRef.current?.goToPage(p), []);
  const prev = useCallback(() => expRef.current?.prev(), []);
  const next = useCallback(() => expRef.current?.next(), []);

  const projects = getProjects(lang);
  const projectIndex = spreadProject(spread);
  const project = projectIndex >= 0 ? projects[projectIndex] : null;
  const live = project && project.demo && project.demo !== '#';
  const code = project && project.github && project.github !== '#';
  const atEnd = compact ? spread >= MAX_SPREAD && state.focus === 'right' : spread >= MAX_SPREAD;
  const label = compact ? (state.page > 0 ? pageLabel(state.page, lang) : '') : spread > 0 ? spreadLabel(spread, lang) : '';
  const pages = compact
    ? `${ui.pageWord} ${nn(Math.max(state.page, 1))} / ${nn(LAST_PAGE)}`
    : `${nn(spread * 2 - 1)}–${nn(spread * 2)} / ${nn(LAST_PAGE)}`;
  const tab = open ? 0 : -1;
  const sheetOpen = mode === 'side' || expanded;

  return (
    <main
      className={`${styles.root} ${ready ? styles.ready : ''} ${open ? styles.isOpen : ''} ${compact ? styles.compact : ''}`}
    >
      <div ref={mountRef} className={styles.stage} aria-hidden="true" />

      <header ref={headerRef} className={styles.top}>
        <button className={styles.brand} onClick={() => goTo(0)} aria-label="luigi mello">
          <span className={styles.mark} />
          {ui.brand}
        </button>
        <div className={styles.topRight}>
          <button className={styles.lang} onClick={toggleLang} aria-label="Language">
            <span className={lang === 'pt' ? styles.on : ''}>PT</span>
            <span className={lang === 'en' ? styles.on : ''}>EN</span>
          </button>
          <button className={styles.cta} onClick={() => goPage(CONTACT_PAGE)}>
            {ui.getInTouch}
          </button>
        </div>
      </header>

      <section ref={heroRef} className={styles.hero}>
        <h1>
          {ui.heroTitle[0]}
          <br />
          {ui.heroTitle[1]}
        </h1>
        <p>{touch ? ui.heroSubTouch : ui.heroSub}</p>
      </section>

      {!compact && (
        <nav className={styles.dock} aria-label="Magazine" aria-hidden={!open} data-no-flip>
          <button className={styles.arrow} onClick={prev} aria-label={ui.prev} tabIndex={tab}>
            <ChevronLeft />
          </button>
          <div className={styles.info}>
            <span className={styles.pages}>{pages}</span>
            <span className={styles.label}>{label}</span>
          </div>
          {project && (
            <div className={styles.links}>
              <button className={styles.ghost} onClick={() => goPage(GRID_PAGE)} tabIndex={tab}>
                {ui.allProjects}
              </button>
              {live && (
                <a href={project.demo} target="_blank" rel="noopener noreferrer" tabIndex={tab}>
                  {ui.visit} ↗
                </a>
              )}
              {code && (
                <a href={project.github} target="_blank" rel="noopener noreferrer" tabIndex={tab}>
                  {ui.code} ↗
                </a>
              )}
            </div>
          )}
          {spread === CONTACT_SPREAD && (
            <div className={styles.links}>
              {CHANNELS.slice(0, 4).map((c) => (
                <a key={c.key} href={c.href} target={c.key === 'email' ? undefined : '_blank'} rel="noopener noreferrer" tabIndex={tab}>
                  {c.label}
                </a>
              ))}
            </div>
          )}
          <button className={styles.arrow} onClick={next} disabled={atEnd} aria-label={ui.next} tabIndex={tab}>
            <ChevronRight />
          </button>
          <span className={styles.sep} />
          <button className={styles.close} onClick={() => goTo(0)} tabIndex={tab}>
            {ui.close} ✕
          </button>
        </nav>
      )}

      {compact && (
        <section
          ref={sheetRef}
          data-no-flip
          aria-hidden={!open}
          className={`${styles.sheet} ${mode === 'side' ? styles.sheetSide : styles.sheetBottom} ${sheetOpen ? styles.sheetExpanded : ''}`}
        >
          <div className={styles.sheetBar}>
            <button className={styles.arrow} onClick={prev} aria-label={ui.prev} tabIndex={tab}>
              <ChevronLeft />
            </button>
            <button
              className={styles.sheetInfo}
              onClick={() => mode === 'bottom' && setExpanded((e) => !e)}
              tabIndex={tab}
            >
              <span className={styles.pages}>{pages}</span>
              <span className={styles.label}>{label}</span>
            </button>
            <button className={styles.arrow} onClick={next} disabled={atEnd} aria-label={ui.next} tabIndex={tab}>
              <ChevronRight />
            </button>
            {mode === 'bottom' && (
              <button className={styles.toggle} onClick={() => setExpanded((e) => !e)} tabIndex={tab}>
                {expanded ? `${ui.hideText} ▾` : `${ui.readText} ▴`}
              </button>
            )}
            <button className={styles.closeIcon} onClick={() => goTo(0)} aria-label={ui.close} tabIndex={tab}>
              ✕
            </button>
          </div>
          <div ref={sheetBodyRef} className={styles.sheetBody}>
            {state.page > 0 && <PageReader page={state.page} lang={lang} onGo={goPage} />}
          </div>
        </section>
      )}

      {!compact && <p className={styles.keys}>{ui.keys}</p>}

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
              <a href={c.href}>
                {c.label}: {c.handle}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
