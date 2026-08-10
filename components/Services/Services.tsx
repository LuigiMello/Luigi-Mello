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
      <div className={styles.bgText}>SERVICES</div>

      <div className={styles.container}>
        <div className="section-header">
          <h2 className="section-title">
            <span>{tr.services.title}</span>
          </h2>
          <p className="section-subtitle">// {tr.services.subtitle}</p>
        </div>

        <div className={styles.badgeRow}>
          <span className={styles.badge}>
            <span className={styles.badgePulse} />
            {tr.services.badge}
          </span>
        </div>

        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.grid} ${inView ? styles.visible : ''}`}
        >
          {tr.services.items.map((item, i) => (
            <div
              key={item.title}
              className={styles.card}
              style={
                {
                  '--card-color': item.color,
                  transitionDelay: `${i * 80}ms`,
                } as React.CSSProperties
              }
            >
              <div className={styles.cardTop}>
                <div className={styles.iconWrap}>
                  <i className={item.icon} />
                </div>
                <span className={styles.cardNumber}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.description}</p>

              <div className={styles.tags}>
                {item.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>

              <div className={styles.cardGlow} />
              <div className={styles.cardLine} />
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <p className={styles.ctaText}>
            {tr.services.badge} —{' '}
            <span className={styles.ctaHighlight}>
              {tr.contact.description}
            </span>
          </p>
          <button className={styles.ctaBtn} onClick={scrollToContact}>
            {tr.services.ctaLabel}
            <span className={styles.ctaArrow}>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
