'use client';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SKILLS } from '@/lib/skillsData';
import styles from './CaseBoard.module.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

type FileKey = 'about' | 'skills' | 'projects' | 'services' | 'contact';

export default function CaseBoard() {
  const { tr, lang, toggleLang } = useLanguage();
  const [active, setActive] = useState<FileKey | null>(null);

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
        <div className={styles.corkboard}>
          <svg className={styles.strings} viewBox="0 0 1000 640" preserveAspectRatio="none">
            <path d="M160,270 Q150,180 140,90" />
            <path d="M160,270 Q490,120 746,37" />
            <path d="M160,270 Q440,300 720,345" />
            <path d="M160,270 Q170,380 180,475" />
            <path d="M160,270 Q320,420 480,540" />
          </svg>

          <button className={styles.langBtn} onClick={toggleLang}>{lang === 'pt' ? 'EN' : 'PT'}</button>

          <div className={styles.caseHeader}>
            <span>{lang === 'pt' ? 'CASO Nº' : 'CASE Nº'} 2026-LM</span>
            <span className={styles.openStamp}>{lang === 'pt' ? 'ARQUIVO ABERTO' : 'FILE OPEN'}</span>
          </div>

          <div className={styles.photoPin}>
            <div className={styles.pinDot} />
            <img src={`${BASE}/avatar.jpg`} alt="Luigi Mello" />
            <span className={styles.photoTape} />
            <div className={styles.photoCaption}>
              <b>LUIGI MELLO</b>
              {tr.hero.roles[0]}
            </div>
          </div>

          <button className={`${styles.note} ${styles.noteAbout}`} onClick={() => setActive('about')}>
            <span className={styles.pinDot} />
            {labels.about.title}
          </button>

          <button className={`${styles.note} ${styles.noteSkills}`} onClick={() => setActive('skills')}>
            <span className={styles.pinDot} />
            {labels.skills.title}
          </button>

          <button className={`${styles.note} ${styles.noteProjects}`} onClick={() => setActive('projects')}>
            <span className={styles.pinDot} />
            {labels.projects.title}
            <span className={styles.badge}>05</span>
          </button>

          <button className={`${styles.note} ${styles.noteServices}`} onClick={() => setActive('services')}>
            <span className={styles.pinDot} />
            {labels.services.title}
            <span className={styles.badge}>06</span>
          </button>

          <button className={`${styles.note} ${styles.noteContact}`} onClick={() => setActive('contact')}>
            <span className={styles.pinDot} />
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
