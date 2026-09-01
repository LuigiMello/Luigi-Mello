'use client';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useInView } from '@/hooks/useInView';
import styles from './Projects.module.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function Projects() {
  const { tr } = useLanguage();
  const { ref, inView } = useInView();

  return (
    <section id="projects" className={styles.projects}>
      <div className={styles.container}>
        <div className="section-header">
          <span className="chapter-num">03</span>
          <h2 className="section-title">{tr.projects.title}</h2>
          <span className="section-subtitle">{tr.projects.subtitle}</span>
        </div>

        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.grid} ${inView ? styles.visible : ''}`}
        >
          {tr.projects.items.map((project, i) => {
            const p = project as typeof project & { image?: string; demo?: string };
            const live = Boolean(p.demo && p.demo !== '#');
            return (
              <article
                key={`${p.name}-${i}`}
                className={styles.card}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={styles.reportHead}>
                  <span className={styles.reportNum}>REG. {String(i + 1).padStart(2, '0')}</span>
                  <span className={`${styles.status} ${live ? styles.statusLive : styles.statusProto}`}>
                    {live ? 'EM PRODUÇÃO' : 'PROTÓTIPO'}
                  </span>
                </div>

                <div className={styles.cardPreview}>
                  {p.image ? (
                    <Image
                      src={`${BASE}${p.image}`}
                      alt={p.name}
                      fill
                      className={styles.previewImg}
                      sizes="(max-width: 768px) 100vw, 360px"
                    />
                  ) : (
                    <div className={styles.previewPlaceholder}>
                      <span>{tr.projects.comingSoon}</span>
                    </div>
                  )}
                </div>

                <h3 className={styles.cardTitle}>{p.name}</h3>
                <p className={styles.cardDesc}>{p.description}</p>

                <div className={styles.tags}>
                  {p.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>

                <div className={styles.cardLinks}>
                  {p.github !== '#' && (
                    <a href={p.github} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                      → {tr.projects.viewCode}
                    </a>
                  )}
                  {live && (
                    <a href={p.demo} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                      → {tr.projects.liveDemo}
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
