'use client';
import { useLanguage } from '@/context/LanguageContext';
import { useInView } from '@/hooks/useInView';
import styles from './Contact.module.css';

const socialLinks = [
  { key: 'instagram', icon: 'fab fa-instagram', color: '#e1306c', href: 'https://www.instagram.com/oluigilucio/', labelKey: 'instagramLabel', descKey: 'instagramDesc' },
  { key: 'youtube',   icon: 'fab fa-youtube',   color: '#ff0000', href: 'https://youtube.com/@oluigimello',       labelKey: 'youtubeLabel',   descKey: 'youtubeDesc'   },
  { key: 'whatsapp',  icon: 'fab fa-whatsapp',  color: '#25d366', href: 'https://wa.me/5541992096564',            labelKey: 'whatsappLabel',  descKey: 'whatsappDesc'  },
  { key: 'linkedin',  icon: 'fab fa-linkedin',  color: '#0077b5', href: 'https://www.linkedin.com/in/luigimello/', labelKey: 'linkedinLabel',  descKey: 'linkedinDesc'  },
] as const;

export default function Contact() {
  const { tr } = useLanguage();
  const { ref, inView } = useInView();

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.container}>
        <div className="section-header">
          <h2 className="section-title"><span>{tr.contact.title}</span></h2>
          <p className="section-subtitle">// {tr.contact.subtitle}</p>
        </div>

        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.inner} ${inView ? styles.visible : ''}`}
        >
          <p className={styles.description}>{tr.contact.description}</p>

          <div className={styles.cards}>
            {socialLinks.map(({ key, icon, color, href, labelKey, descKey }, i) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.card}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardIcon} style={{ '--icon-color': color } as React.CSSProperties}>
                    <i className={icon} />
                  </div>
                  <div className={styles.cardText}>
                    <span className={styles.cardLabel}>{tr.contact[labelKey]}</span>
                    <span className={styles.cardDesc}>{tr.contact[descKey]}</span>
                  </div>
                  <span className={styles.cardArrow}>→</span>
                </div>
              </a>
            ))}
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>ou</span>
            <span className={styles.dividerLine} />
          </div>

          <div className={styles.emailBox}>
            <p className={styles.emailLabel}>Email</p>
            <a href="mailto:luigileitenski@gmail.com" className={styles.emailLink}>
              luigileitenski@gmail.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
