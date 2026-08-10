'use client';
import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useInView } from '@/hooks/useInView';
import styles from './Skills.module.css';

/* ── Skill data ─────────────────────────────────────────────────── */
type Cat = 'frontend' | 'backend' | 'tools' | 'environment' | 'productivity' | 'ai';
type SkillItem =
  | { name: string; cat: Cat; icon: string; type: 'devicon' }
  | { name: string; cat: Cat; label: string; color: string; svgPath?: string; type: 'custom' };

const allSkills: SkillItem[] = [
  // Frontend
  { name: 'HTML5',      cat: 'frontend',     icon: 'devicon-html5-plain colored',                    type: 'devicon' },
  { name: 'CSS3',       cat: 'frontend',     icon: 'devicon-css3-plain colored',                     type: 'devicon' },
  { name: 'JavaScript', cat: 'frontend',     icon: 'devicon-javascript-plain colored',               type: 'devicon' },
  { name: 'TypeScript', cat: 'frontend',     icon: 'devicon-typescript-plain colored',               type: 'devicon' },
  { name: 'React',      cat: 'frontend',     icon: 'devicon-react-original colored',                 type: 'devicon' },
  { name: 'Next.js',    cat: 'frontend',     icon: 'devicon-nextjs-plain',                           type: 'devicon' },
  // Backend
  { name: 'Node.js',    cat: 'backend',      icon: 'devicon-nodejs-plain colored',                   type: 'devicon' },
  { name: 'PHP',        cat: 'backend',      icon: 'devicon-php-plain colored',                      type: 'devicon' },
  { name: 'Java',       cat: 'backend',      icon: 'devicon-java-plain colored',                     type: 'devicon' },
  { name: 'TypeScript', cat: 'backend',      icon: 'devicon-typescript-plain colored',               type: 'devicon' },
  // Tools
  { name: 'Git',        cat: 'tools',        icon: 'devicon-git-plain colored',                      type: 'devicon' },
  { name: 'GitHub',     cat: 'tools',        icon: 'devicon-github-original',                        type: 'devicon' },
  { name: 'Docker',     cat: 'tools',        icon: 'devicon-docker-plain colored',                   type: 'devicon' },
  { name: 'NPM',        cat: 'tools',        icon: 'devicon-npm-original-wordmark colored',           type: 'devicon' },
  // Environment
  { name: 'VS Code',    cat: 'environment',  icon: 'devicon-vscode-plain colored',                   type: 'devicon' },
  { name: 'Windows',    cat: 'environment',  icon: 'devicon-windows8-original colored',              type: 'devicon' },
  // Productivity
  { name: 'Notion',     cat: 'productivity', icon: 'devicon-notion-plain',                           type: 'devicon' },
  { name: 'Canva',      cat: 'productivity', icon: 'devicon-canva-original colored',                 type: 'devicon' },
  { name: 'Milanote',   cat: 'productivity', label: 'MN',  color: '#e74c3c',                        type: 'custom'  },
  // AI
  { name: 'ChatGPT',    cat: 'ai',           label: 'GPT', color: '#10a37f',                        type: 'custom'  },
  { name: 'Gemini',     cat: 'ai',           label: 'G',   color: '#4285f4',                        type: 'custom'  },
  { name: 'Claude',     cat: 'ai',           label: 'C',   color: '#d97706',                        type: 'custom'  },
  { name: 'Deepseek',   cat: 'ai',           label: 'DS',  color: '#1864f4',                        type: 'custom'  },
  { name: 'Kimi K3',    cat: 'ai',           label: 'K3',  color: '#7c3aed',                        type: 'custom'  },
];

const filterTabs: { id: 'all' | Cat; icon: string }[] = [
  { id: 'all',          icon: 'fas fa-layer-group'   },
  { id: 'frontend',     icon: 'fas fa-laptop-code'   },
  { id: 'backend',      icon: 'fas fa-server'         },
  { id: 'tools',        icon: 'fas fa-tools'          },
  { id: 'environment',  icon: 'fas fa-desktop'        },
  { id: 'productivity', icon: 'fas fa-tasks'          },
  { id: 'ai',           icon: 'fas fa-brain'          },
];

/* ── AI SVG logos ────────────────────────────────────────────────── */
function AiLogo({ name, color }: { name: string; color: string }) {
  if (name === 'ChatGPT') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M22.28 9.29a5.85 5.85 0 0 0-.51-4.83 6.07 6.07 0 0 0-6.53-2.91A5.85 5.85 0 0 0 10.82 0a6.08 6.08 0 0 0-5.8 4.21 5.86 5.86 0 0 0-3.9 2.84 6.07 6.07 0 0 0 .75 7.12 5.86 5.86 0 0 0 .5 4.84 6.08 6.08 0 0 0 6.54 2.91 5.85 5.85 0 0 0 4.41 1.97 6.08 6.08 0 0 0 5.8-4.22 5.86 5.86 0 0 0 3.91-2.84 6.07 6.07 0 0 0-.75-7.54zM13.18 21.5a4.5 4.5 0 0 1-2.89-1.05l.14-.08 4.8-2.77a.8.8 0 0 0 .4-.69v-6.76l2.03 1.17a.07.07 0 0 1 .04.06v5.6a4.52 4.52 0 0 1-4.52 4.52zm-9.7-4.15a4.5 4.5 0 0 1-.54-3.03l.14.09 4.8 2.77a.79.79 0 0 0 .8 0l5.86-3.38v2.34a.08.08 0 0 1-.03.06L9.6 19.04a4.52 4.52 0 0 1-6.12-1.69zm-1.26-9.9A4.5 4.5 0 0 1 4.57 5.4v5.67a.78.78 0 0 0 .4.68l5.85 3.38-2.03 1.17a.08.08 0 0 1-.07 0L3.8 13.6a4.52 4.52 0 0 1-1.57-6.15zm16.65 3.87-5.86-3.39 2.03-1.17a.08.08 0 0 1 .07 0l4.93 2.84a4.51 4.51 0 0 1-.7 8.14v-5.67a.78.78 0 0 0-.47-.75zm2.02-3.04-.14-.09-4.8-2.77a.8.8 0 0 0-.8 0L9.3 9.81V7.47a.07.07 0 0 1 .03-.06l4.92-2.84a4.52 4.52 0 0 1 6.72 4.68v.03zm-12.7 4.17-2.03-1.17a.08.08 0 0 1-.04-.06V5.62a4.52 4.52 0 0 1 7.42-3.47l-.14.08-4.8 2.77a.79.79 0 0 0-.4.69v.01l-.01 6.75zm1.1-2.37 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3z"/>
    </svg>
  );
  if (name === 'Gemini') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M12 24A14.3 14.3 0 0 1 9.8 12.2 14.3 14.3 0 0 1 12 0a14.3 14.3 0 0 1 2.2 12.2A14.3 14.3 0 0 1 12 24zm0 0a14.3 14.3 0 0 1 11.8-2.2A14.3 14.3 0 0 1 24 12a14.3 14.3 0 0 1-12.2 2.2A14.3 14.3 0 0 1 0 12a14.3 14.3 0 0 1 12 2.2V24z"/>
    </svg>
  );
  if (name === 'Claude') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M4.016 16.07 7.786 5.798h1.56l3.77 10.273H11.53l-.96-2.794H6.9l-.96 2.794H4.016zm3.27-3.978h3.148l-1.56-4.54h-.029l-1.56 4.54zM13.5 16.07V5.798h3.666c2.43 0 3.834 1.334 3.834 3.6 0 2.28-1.404 3.6-3.834 3.6H15.1v3.072H13.5zm1.6-4.569h1.98c1.5 0 2.32-.696 2.32-2.103 0-1.392-.82-2.103-2.32-2.103H15.1v4.206z"/>
    </svg>
  );
  // Deepseek / Kimi — initials
  return (
    <span style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%',
      fontFamily: 'var(--font-mono)', fontWeight: 700,
      fontSize: name === 'Kimi K3' ? '0.58rem' : '0.62rem',
      color: '#fff', letterSpacing: 0,
    }}>
      {name === 'Deepseek' ? 'DS' : 'K3'}
    </span>
  );
}

function SkillPill({ skill }: { skill: SkillItem }) {
  return (
    <div className={styles.pill}>
      <span className={styles.pillIconWrap}>
        {skill.type === 'devicon' ? (
          <i className={`${skill.icon} ${styles.pillDevicon}`} />
        ) : (
          <span className={styles.pillCustom} style={{ background: skill.color }}>
            <AiLogo name={skill.name} color="#fff" />
          </span>
        )}
      </span>
      <span className={styles.pillName}>{skill.name}</span>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────── */
export default function Skills() {
  const { tr } = useLanguage();
  const { ref, inView } = useInView();
  const [active, setActive] = useState<'all' | Cat>('all');

  const filtered = useMemo(
    () => (active === 'all' ? allSkills : allSkills.filter(s => s.cat === active)),
    [active]
  );

  // Pad to ≥10 items for smooth infinite scroll, then double for the loop
  const looped = useMemo(() => {
    let base = [...filtered];
    while (base.length < 10) base = [...base, ...filtered];
    return [...base, ...base];
  }, [filtered]);

  const catSummary = filterTabs.filter(t => t.id !== 'all').map(t => ({
    ...t,
    count: allSkills.filter(s => s.cat === t.id).length,
  }));

  return (
    <section id="skills" className={styles.skills}>
      <div className={styles.container}>
        <div className="section-header">
          <h2 className="section-title"><span>{tr.skills.title}</span></h2>
          <p className="section-subtitle">// {tr.skills.subtitle}</p>
        </div>

        {/* Filter tabs */}
        <div className={styles.filters}>
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.filterBtn} ${active === tab.id ? styles.filterActive : ''}`}
              onClick={() => setActive(tab.id)}
            >
              <i className={tab.icon} />
              <span>{tr.skills.categories[tab.id]}</span>
            </button>
          ))}
        </div>

        {/* Marquee */}
        <div className={styles.marqueeWrapper}>
          <div className={styles.fadeL} />
          <div className={styles.fadeR} />
          <div
            key={active}           /* force re-mount on category change */
            className={styles.track}
            style={{ '--pill-count': String(looped.length / 2) } as React.CSSProperties}
          >
            {looped.map((s, i) => <SkillPill key={`${s.name}-${i}`} skill={s} />)}
          </div>
        </div>

        {/* Category summary grid */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.cats} ${inView ? styles.visible : ''}`}
        >
          {catSummary.map((cat, i) => (
            <button
              key={cat.id}
              className={`${styles.cat} ${active === cat.id ? styles.catActive : ''}`}
              style={{ transitionDelay: `${i * 60}ms` }}
              onClick={() => setActive(prev => prev === cat.id ? 'all' : cat.id)}
            >
              <i className={`${cat.icon} ${styles.catIcon}`} />
              <span className={styles.catLabel}>{tr.skills.categories[cat.id]}</span>
              <span className={styles.catCount}>{cat.count}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
