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
        <div className="section-header">
          <span className="chapter-num">01</span>
          <h2 className="section-title">{tr.about.title}</h2>
          <span className="section-subtitle">{tr.about.subtitle}</span>
        </div>

        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.grid} ${inView ? styles.visible : ''}`}
        >
          {/* Photo + spec table */}
          <div className={styles.imageCol}>
            <div className={styles.avatarFrame}>
              <div className={styles.avatar}>
                <Image
                  src={AVATAR}
                  alt="Luigi Mello"
                  fill
                  className={styles.avatarPhoto}
                  sizes="260px"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <span className={styles.avatarCaption}>FIG. 02 — UNIDADE PRINCIPAL</span>
            </div>

            <dl className={styles.specTable}>
              {stats.map(({ value, key }) => (
                <div key={key} className={styles.specRow}>
                  <dt>{tr.about.stats[key as keyof typeof tr.about.stats]}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Text */}
          <div className={styles.textCol}>
            <p className={styles.paragraph}>{tr.about.p1}</p>
            <p className={styles.paragraph}>{tr.about.p2}</p>
            <p className={styles.paragraph}>{tr.about.p3}</p>

            <div className={styles.note}>
              <span className={styles.noteLabel}>NOTA —</span>
              <div>
                <strong>{tr.about.englishBadge.replace('🇺🇸 ', '')}</strong>
                <p>{tr.about.englishDesc}</p>
              </div>
            </div>

            <div className={styles.channels}>
              <a href="https://www.instagram.com/oluigilucio/" target="_blank" rel="noopener noreferrer" className={styles.channel}>
                <i className="fab fa-instagram" /> Instagram
              </a>
              <a href="https://youtube.com/@oluigimello" target="_blank" rel="noopener noreferrer" className={styles.channel}>
                <i className="fab fa-youtube" /> YouTube
              </a>
              <a href="https://wa.me/5541992096564" target="_blank" rel="noopener noreferrer" className={styles.channel}>
                <i className="fab fa-whatsapp" /> WhatsApp
              </a>
              <a href="https://www.linkedin.com/in/luigimello/" target="_blank" rel="noopener noreferrer" className={styles.channel}>
                <i className="fab fa-linkedin" /> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
