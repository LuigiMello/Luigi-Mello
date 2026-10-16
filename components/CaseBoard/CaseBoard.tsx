'use client';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SKILLS } from '@/lib/skillsData';
import styles from './CaseBoard.module.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

type FileKey = 'about' | 'skills' | 'projects' | 'services' | 'contact';

const STRING_TARGETS: FileKey[] = ['about', 'skills', 'projects', 'services', 'contact'];

interface Strings {
  w: number;
  h: number;
  paths: string[];
}

export default function CaseBoard() {
  const { tr, lang, toggleLang } = useLanguage();
  const [active, setActive] = useState<FileKey | null>(null);
  const corkRef = useRef<HTMLDivElement>(null);
  const [strings, setStrings] = useState<Strings | null>(null);

  // The red strings are drawn from the polaroid's pin to each note's pin using
  // the pins' real positions, so they stay attached at every container size
  // (notes are positioned in % but sized in px, so fixed coordinates drift).
  useEffect(() => {
    const cork = corkRef.current;
    if (!cork) return;

    const measure = () => {
      const box = cork.getBoundingClientRect();
      // The board lives inside a window that scales in when it opens, so
      // rects are scaled; divide that out to get the board's own px space.
      const scale = box.width / (cork.offsetWidth || box.width) || 1;
      const center = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          // the SVG sits inside the board's border, so measure from the padding box
          x: (r.left + r.width / 2 - box.left) / scale - cork.clientLeft,
          y: (r.top + r.height / 2 - box.top) / scale - cork.clientTop,
        };
      };
      const origin = center(cork.querySelector('[data-anchor="photo"]'));
      if (!origin) return;

      const paths: string[] = [];
      for (const key of STRING_TARGETS) {
        const end = center(cork.querySelector(`[data-anchor="${key}"]`));
        if (!end) continue;
        const dx = end.x - origin.x;
        const dy = end.y - origin.y;
        const len = Math.hypot(dx, dy) || 1;
        // Sag the string a little, perpendicular to the chord, towards the floor.
        let nx = -dy / len;
        let ny = dx / len;
        if (ny < 0) { nx = -nx; ny = -ny; }
        const cx = (origin.x + end.x) / 2 + nx * len * 0.09;
        const cy = (origin.y + end.y) / 2 + ny * len * 0.09;
        paths.push(`M${origin.x.toFixed(1)},${origin.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${end.x.toFixed(1)},${end.y.toFixed(1)}`);
      }
      setStrings({ w: cork.clientWidth, h: cork.clientHeight, paths });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(cork);
    // Pins don't move on their own, but late layout (fonts, photo) can shift them.
    const timers = [400, 1000].map((ms) => window.setTimeout(measure, ms));
    return () => {
      ro.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [lang]);

  const labels: Record<FileKey, { tag: string; title: string }> = {
    about: { tag: '01', title: lang === 'pt' ? 'PERFIL DO SUSPEITO' : 'SUBJECT PROFILE' },
    skills: { tag: '02', title: lang === 'pt' ? 'ARSENAL TÉCNICO' : 'TECHNICAL ARSENAL' },
    projects: { tag: '03', title: lang === 'pt' ? 'CASOS ENCERRADOS' : 'CLOSED CASES' },
    services: { tag: '04', title: lang === 'pt' ? 'MODOS DE OPERAÇÃO' : 'MODES OF OPERATION' },
    contact: { tag: '05', title: lang === 'pt' ? 'LINHA DIRETA' : 'DIRECT LINE' },
  };

  const renderBody = (key: FileKey) => {
    switch (key) {
      case 'about':
        return (
          <div className={styles.typed}>
            <p>{tr.about.p1}</p>
            <p>{tr.about.p2}</p>
            <p>{tr.about.p3}</p>
            <p>{tr.about.englishDesc}</p>
            <div className={styles.statsRow}>
              <div><b>10+</b><span>{tr.about.stats.technologies}</span></div>
              <div><b>10+</b><span>{tr.about.stats.projects}</span></div>
              <div><b>5</b><span>{tr.about.stats.aiTools}</span></div>
            </div>
          </div>
        );
      case 'skills':
        return (
          <div className={styles.typed}>
            {SKILLS.map((group) => (
              <div key={group.cat} className={styles.evidenceRow}>
                <span className={styles.evidenceTag}>{tr.skills.categories[group.cat]}</span>
                <div className={styles.chips}>
                  {group.items.map((s) => (
                    <span key={s} className={styles.chip}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      case 'projects':
        return (
          <div className={styles.typed}>
            {tr.projects.items.map((p, i) => {
              const proj = p as typeof p & { demo?: string };
              const live = Boolean(proj.demo && proj.demo !== '#');
              return (
                <div key={p.name} className={styles.caseCard}>
                  <div className={styles.caseCardHead}>
                    <span className={styles.caseNum}>Nº {String(i + 1).padStart(3, '0')}</span>
                    <span className={styles.stampSolved}>{lang === 'pt' ? 'RESOLVIDO' : 'SOLVED'}</span>
                  </div>
                  <h4>{p.name}</h4>
                  <p>{p.description}</p>
                  <div className={styles.chips}>
                    {p.tags.map((t) => <span key={t} className={styles.chip}>{t}</span>)}
                  </div>
                  <div className={styles.caseLinks}>
                    {p.github !== '#' && (
                      <a href={p.github} target="_blank" rel="noopener noreferrer">{tr.projects.viewCode}</a>
                    )}
                    {live && (
                      <a href={proj.demo} target="_blank" rel="noopener noreferrer">{tr.projects.liveDemo}</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'services':
        return (
          <div className={styles.typed}>
            {tr.services.items.map((s, i) => (
              <div key={s.title} className={styles.caseCard}>
                <div className={styles.caseCardHead}>
                  <span className={styles.caseNum}>{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h4>{s.title}</h4>
                <p>{s.description}</p>
              </div>
            ))}
            <p className={styles.badgeLine}>{tr.services.badge}</p>
          </div>
        );
      case 'contact':
        return (
          <div className={styles.typed}>
            <p>{tr.contact.description}</p>
            <div className={styles.contactGrid}>
              <a href="mailto:luigileitenski@gmail.com" className={styles.contactRow}>
                <span>E-MAIL</span>luigileitenski@gmail.com
              </a>
              <a href="https://www.instagram.com/oluigilucio/" target="_blank" rel="noopener noreferrer" className={styles.contactRow}>
                <span>INSTAGRAM</span>@oluigilucio
              </a>
              <a href="https://youtube.com/@oluigimello" target="_blank" rel="noopener noreferrer" className={styles.contactRow}>
                <span>YOUTUBE</span>@oluigimello
              </a>
              <a href="https://wa.me/5541992096564" target="_blank" rel="noopener noreferrer" className={styles.contactRow}>
                <span>WHATSAPP</span>(41) 99209-6564
              </a>
              <a href="https://www.linkedin.com/in/luigimello/" target="_blank" rel="noopener noreferrer" className={styles.contactRow}>
                <span>LINKEDIN</span>/luigimello
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.board}>
      <div className={styles.boardScroll}>
        <div ref={corkRef} className={styles.corkboard}>
          {strings && (
            <svg
              className={styles.strings}
              width={strings.w}
              height={strings.h}
              viewBox={`0 0 ${strings.w} ${strings.h}`}
              aria-hidden="true"
            >
              {strings.paths.map((d) => <path key={d} d={d} />)}
            </svg>
          )}

          <button className={styles.langBtn} onClick={toggleLang}>{lang === 'pt' ? 'EN' : 'PT'}</button>

          <div className={styles.caseHeader}>
            <span>{lang === 'pt' ? 'CASO Nº' : 'CASE Nº'} 2026-LM</span>
            <span className={styles.openStamp}>{lang === 'pt' ? 'ARQUIVO ABERTO' : 'FILE OPEN'}</span>
          </div>

          <div className={styles.photoPin}>
            <div className={styles.pinDot} data-anchor="photo" />
            <img src={`${BASE}/avatar.jpg`} alt="Luigi Mello" />
            <span className={styles.photoTape} />
            <div className={styles.photoCaption}>
              <b>LUIGI MELLO</b>
              {tr.hero.roles[0]}
            </div>
          </div>

          <button className={`${styles.note} ${styles.noteAbout}`} onClick={() => setActive('about')}>
            <span className={styles.pinDot} data-anchor="about" />
            {labels.about.title}
          </button>

          <button className={`${styles.note} ${styles.noteSkills}`} onClick={() => setActive('skills')}>
            <span className={styles.pinDot} data-anchor="skills" />
            {labels.skills.title}
          </button>

          <button className={`${styles.note} ${styles.noteProjects}`} onClick={() => setActive('projects')}>
            <span className={styles.pinDot} data-anchor="projects" />
            {labels.projects.title}
            <span className={styles.badge}>{String(tr.projects.items.length).padStart(2, '0')}</span>
          </button>

          <button className={`${styles.note} ${styles.noteServices}`} onClick={() => setActive('services')}>
            <span className={styles.pinDot} data-anchor="services" />
            {labels.services.title}
            <span className={styles.badge}>06</span>
          </button>

          <button className={`${styles.note} ${styles.noteContact}`} onClick={() => setActive('contact')}>
            <span className={styles.pinDot} data-anchor="contact" />
            {labels.contact.title}
          </button>
        </div>
      </div>

      {active && (
        <div className={styles.overlay} onClick={() => setActive(null)}>
          <div className={styles.file} onClick={(e) => e.stopPropagation()}>
            <div className={styles.fileHead}>
              <div>
                <span className={styles.fileTag}>{lang === 'pt' ? 'DOSSIÊ' : 'DOSSIER'} #{labels[active].tag}</span>
                <h3>{labels[active].title}</h3>
              </div>
              <button className={styles.closeStamp} onClick={() => setActive(null)}>
                {lang === 'pt' ? 'ENCERRAR' : 'CLOSE'} ✕
              </button>
            </div>
            <div className={styles.fileBody}>{renderBody(active)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
