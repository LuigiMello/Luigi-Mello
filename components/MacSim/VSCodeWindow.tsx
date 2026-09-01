'use client';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SKILLS } from '@/lib/skillsData';
import { highlight } from './CodeHighlight';
import styles from './VSCodeWindow.module.css';

type FileId = 'about' | 'skills' | 'projects' | 'services' | 'contact';

export default function VSCodeWindow({ onClose }: { onClose: () => void }) {
  const { tr, lang } = useLanguage();
  const [active, setActive] = useState<FileId>('about');
  const [openTabs, setOpenTabs] = useState<FileId[]>(['about']);

  const openFile = (id: FileId) => {
    setActive(id);
    setOpenTabs((tabs) => (tabs.includes(id) ? tabs : [...tabs, id]));
  };

  const closeTab = (id: FileId, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTabs((tabs) => {
      const next = tabs.filter((t) => t !== id);
      if (active === id && next.length) setActive(next[next.length - 1]);
      return next.length ? next : [id];
    });
  };

  const files: { id: FileId; name: string; lines: string[] }[] = [
    {
      id: 'about',
      name: 'about.ts',
      lines: [
        `// ${lang === 'pt' ? 'quem é Luigi Mello' : 'who Luigi Mello is'}`,
        `export const about = {`,
        `  name: '${tr.hero.name}',`,
        `  role: '${tr.hero.roles[0]}',`,
        `  english: true,`,
        `  bio: [`,
        `    '${tr.about.p1}',`,
        `    '${tr.about.p2}',`,
        `  ],`,
        `  stats: { technologies: '10+', projects: '10+', aiTools: '5' },`,
        `};`,
      ],
    },
    {
      id: 'skills',
      name: 'skills.ts',
      lines: [
        `// ${lang === 'pt' ? 'arsenal técnico' : 'technical arsenal'}`,
        `export const skills = {`,
        ...SKILLS.map((g) => `  ${g.cat}: [${g.items.map((i) => `'${i}'`).join(', ')}],`),
        `};`,
      ],
    },
    {
      id: 'projects',
      name: 'projects.ts',
      lines: [
        `// ${lang === 'pt' ? '5 entregas reais' : '5 real deliveries'}`,
        `export const projects = [`,
        ...tr.projects.items.flatMap((p) => {
          const proj = p as typeof p & { demo?: string };
          const link = proj.demo && proj.demo !== '#' ? proj.demo : p.github;
          return [
            `  {`,
            `    name: '${p.name}',`,
            `    tags: [${p.tags.map((t) => `'${t}'`).join(', ')}],`,
            `    link: '${link}',`,
            `  },`,
          ];
        }),
        `];`,
      ],
    },
    {
      id: 'services',
      name: 'services.ts',
      lines: [
        `// ${lang === 'pt' ? 'como posso ajudar' : 'how I can help'}`,
        `export const services = [`,
        ...tr.services.items.map((s) => `  '${s.title}',`),
        `];`,
        ``,
        `export const availability = '${tr.services.badge}';`,
      ],
    },
    {
      id: 'contact',
      name: 'contact.ts',
      lines: [
        `// ${lang === 'pt' ? 'linha direta' : 'direct line'}`,
        `export const contact = {`,
        `  email: 'luigileitenski@gmail.com',`,
        `  instagram: '@oluigilucio',`,
        `  youtube: '@oluigimello',`,
        `  whatsapp: '+55 41 99209-6564',`,
        `  linkedin: '/luigimello',`,
        `};`,
      ],
    },
  ];

  const file = files.find((f) => f.id === active)!;

  return (
    <div className={styles.overlay}>
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <div className={styles.traffic}>
            <button className={`${styles.dot} ${styles.red}`} onClick={onClose} aria-label="Fechar" />
            <span className={`${styles.dot} ${styles.yellow}`} />
            <span className={`${styles.dot} ${styles.green}`} />
          </div>
          <span className={styles.title}>portfolio-luigi — Visual Studio Code</span>
        </div>

        <div className={styles.body}>
          <aside className={styles.explorer}>
            <div className={styles.explorerHead}>
              {lang === 'pt' ? 'EXPLORADOR' : 'EXPLORER'}
            </div>
            <div className={styles.explorerRoot}>PORTFOLIO-LUIGI</div>
            {files.map((f) => (
              <button
                key={f.id}
                className={`${styles.fileItem} ${active === f.id ? styles.fileItemActive : ''}`}
                onClick={() => openFile(f.id)}
              >
                <span className={styles.fileDot} />
                {f.name}
              </button>
            ))}
          </aside>

          <div className={styles.editorArea}>
            <div className={styles.tabs}>
              {openTabs.map((id) => {
                const f = files.find((x) => x.id === id)!;
                return (
                  <button
                    key={id}
                    className={`${styles.tab} ${active === id ? styles.tabActive : ''}`}
                    onClick={() => setActive(id)}
                  >
                    {f.name}
                    <span className={styles.tabClose} onClick={(e) => closeTab(id, e)}>✕</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.editor}>
              <div className={styles.gutter}>
                {file.lines.map((_, i) => <span key={i}>{i + 1}</span>)}
              </div>
              <pre className={styles.code}>
                {file.lines.map((line, i) => (
                  <div key={i} className={styles.codeLine}>{highlight(line, i)}</div>
                ))}
              </pre>
            </div>
          </div>
        </div>

        <div className={styles.statusBar}>
          <span>⎇ main</span>
          <span>{file.name}</span>
          <span className={styles.statusRight}>TypeScript · UTF-8 · Prettier</span>
        </div>
      </div>
    </div>
  );
}
