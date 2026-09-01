'use client';
import { useLanguage } from '@/context/LanguageContext';
import { useInView } from '@/hooks/useInView';
import styles from './Contact.module.css';

const socialLinks = [
  { key: 'instagram', icon: 'fab fa-instagram', href: 'https://www.instagram.com/oluigilucio/', labelKey: 'instagramLabel', descKey: 'instagramDesc' },
  { key: 'youtube',   icon: 'fab fa-youtube',   href: 'https://youtube.com/@oluigimello',       labelKey: 'youtubeLabel',   descKey: 'youtubeDesc'   },
  { key: 'whatsapp',  icon: 'fab fa-whatsapp',  href: 'https://wa.me/5541992096564',            labelKey: 'whatsappLabel',  descKey: 'whatsappDesc'  },
  { key: 'linkedin',  icon: 'fab fa-linkedin',  href: 'https://www.linkedin.com/in/luigimello/', labelKey: 'linkedinLabel',  descKey: 'linkedinDesc'  },
] as const;

export default function Contact() {
  const { tr } = useLanguage();
  const { ref, inView } = useInView();

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.container}>
        <div className="section-header">
          <span className="chapter-num">05</span>
          <h2 className="section-title">{tr.contact.title}</h2>
          <span className="section-subtitle">{tr.contact.subtitle}</span>
        </div>

        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.inner} ${inView ? styles.visible : ''}`}
        >
          <p className={styles.description}>{tr.contact.description}</p>

          <div className={styles.channels}>
            {socialLinks.map(({ key, icon, href, labelKey, descKey }, i) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.channel}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <span className={styles.channelNum}>{String(i + 1).padStart(2, '0')}</span>
                <i className={`${icon} ${styles.channelIcon}`} />
                <span className={styles.channelText}>
                  <strong>{tr.contact[labelKey]}</strong>
                  <span>{tr.contact[descKey]}</span>
                </span>
                <span className={styles.channelArrow}>→</span>
              </a>
            ))}
          </div>

          <div className={styles.warranty}>
            <div className={styles.warrantyText}>
              <span className={styles.warrantyLabel}>{tr.contact.emailCta}</span>
              <a href="mailto:luigileitenski@gmail.com" className={styles.warrantyEmail}>
                luigileitenski@gmail.com
              </a>
            </div>
            <div className={styles.stamp}>
              {tr.contact.warranty.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
