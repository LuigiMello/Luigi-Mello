'use client';
import { useLanguage } from '@/context/LanguageContext';
import { useInView } from '@/hooks/useInView';
import styles from './Services.module.css';

export default function Services() {
  const { tr } = useLanguage();
  const { ref, inView } = useInView();

  const scrollToContact = () =>
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="services" className={styles.services}>
      <div className={styles.container}>
        <div className="section-header">
          <span className="chapter-num">04</span>
          <h2 className="section-title">{tr.services.title}</h2>
          <span className="section-subtitle">{tr.services.subtitle}</span>
        </div>

        <div className={styles.badgeRow}>
          <span className={styles.badgeDot} />
          <span className={styles.badge}>{tr.services.badge}</span>
        </div>

        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.grid} ${inView ? styles.visible : ''}`}
        >
          {tr.services.items.map((item, i) => (
            <div key={item.title} className={styles.card} style={{ transitionDelay: `${i * 70}ms` }}>
              <div className={styles.cardTop}>
                <span className={styles.modeLabel}>MODO {String(i + 1).padStart(2, '0')}</span>
                <i className={`${item.icon} ${styles.icon}`} />
              </div>

              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.description}</p>

              <div className={styles.tags}>
                {item.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <p className={styles.ctaText}>{tr.contact.description}</p>
          <button className={styles.ctaBtn} onClick={scrollToContact}>
            {tr.services.ctaLabel} →
          </button>
        </div>
      </div>
    </section>
  );
}
