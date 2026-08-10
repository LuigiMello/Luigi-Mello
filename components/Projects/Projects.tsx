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
          <h2 className="section-title">
            {tr.projects.title.split(' ')[0]}{' '}
            <span>{tr.projects.title.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="section-subtitle">// {tr.projects.subtitle}</p>
        </div>

        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.grid} ${inView ? styles.visible : ''}`}
        >
          {tr.projects.items.map((project, i) => (
            <article
              key={`${project.name}-${i}`}
              className={styles.card}
              style={{
                transitionDelay: `${i * 120}ms`,
                '--card-color': (project as { color?: string }).color ?? 'var(--accent)',
              } as React.CSSProperties}
            >
              <div className={styles.cardInner}>
                {/* Image preview */}
                <div className={styles.cardPreview}>
                  {(project as { image?: string }).image ? (
                    <Image
                      src={`${BASE}${(project as { image?: string }).image!}`}
                      alt={project.name}
                      fill
                      className={styles.previewImg}
                      sizes="(max-width: 768px) 100vw, 380px"
                    />
                  ) : (
                    <div className={styles.previewPlaceholder}>
                      <i className="fas fa-code" />
                      <span>{tr.projects.comingSoon}</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <div className={styles.folderIcon}>
                      <i className="fas fa-folder-open" />
                    </div>
                    <div className={styles.cardLinks}>
                      {project.github !== '#' && (
                        <a href={project.github} title="GitHub" target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                          <i className="fab fa-github" />
                        </a>
                      )}
                      {(project as { demo?: string }).demo && (project as { demo?: string }).demo !== '#' && (
                        <a href={(project as { demo?: string }).demo} title="Demo" target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                          <i className="fas fa-external-link-alt" />
                        </a>
                      )}
                    </div>
                  </div>

                  <h3 className={styles.cardTitle}>{project.name}</h3>
                  <p className={styles.cardDesc}>{project.description}</p>

                  <div className={styles.tags}>
                    {project.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
