'use client';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useInView } from '@/hooks/useInView';
import styles from './About.module.css';

const stats = [
  { value: '10+', key: 'technologies' },
  { value: '10+',  key: 'projects'     },
  { value: '5',   key: 'aiTools'      },
];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const AVATAR = `${BASE}/avatar.jpg`;

export default function About() {
  const { tr } = useLanguage();
  const { ref, inView } = useInView();

  return (
    <section id="about" className={styles.about}>
      <div className={styles.container}>
        <div className={`section-header ${styles.header}`}>
          <h2 className="section-title">
            {tr.about.title.split(' ')[0]}{' '}
            <span>{tr.about.title.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="section-subtitle">// {tr.about.subtitle}</p>
        </div>

        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.grid} ${inView ? styles.visible : ''}`}
        >
          {/* Avatar */}
          <div className={styles.imageCol}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>
                <div className={styles.avatarBg} />
                <Image
                  src={AVATAR}
                  alt="Luigi Mello"
                  fill
                  className={styles.avatarPhoto}
                  sizes="200px"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <span className={styles.avatarInitials} aria-hidden="true">LM</span>
              </div>
              <div className={styles.avatarRing} />
              <div className={styles.avatarCorner} />
              <div className={styles.avatarCorner} />
              <div className={styles.avatarCorner} />
              <div className={styles.avatarCorner} />
            </div>

            <div className={styles.statsRow}>
              {stats.map(({ value, key }) => (
                <div key={key} className={styles.statCard}>
                  <span className={styles.statValue}>{value}</span>
                  <span className={styles.statLabel}>
                    {tr.about.stats[key as keyof typeof tr.about.stats]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Text */}
          <div className={styles.textCol}>
            <p className={styles.paragraph}>{tr.about.p1}</p>
            <p className={styles.paragraph}>{tr.about.p2}</p>
            <p className={styles.paragraph}>{tr.about.p3}</p>

            <div className={styles.englishBadge}>
              <div className={styles.badgeHeader}>
                <i className="fas fa-globe-americas" style={{ color: 'var(--accent)', fontSize: '1.1rem' }} />
                <span className={styles.badgeTitle}>
                  {tr.about.englishBadge.replace('🇺🇸 ', '')}
                </span>
              </div>
              <p className={styles.badgeDesc}>{tr.about.englishDesc}</p>
            </div>

            <div className={styles.socialBar}>
              <a href="https://www.instagram.com/oluigilucio/" target="_blank" rel="noopener noreferrer" className={styles.socialChip}>
                <i className="fab fa-instagram" /> Instagram
              </a>
              <a href="https://youtube.com/@oluigimello" target="_blank" rel="noopener noreferrer" className={styles.socialChip}>
                <i className="fab fa-youtube" /> YouTube
              </a>
              <a href="https://wa.me/5541992096564" target="_blank" rel="noopener noreferrer" className={styles.socialChip}>
                <i className="fab fa-whatsapp" /> WhatsApp
              </a>
              <a href="https://www.linkedin.com/in/luigimello/" target="_blank" rel="noopener noreferrer" className={styles.socialChip}>
                <i className="fab fa-linkedin" /> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
