'use client';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Footer.module.css';

export default function Footer() {
  const { tr } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <span className={styles.logo}>
            <span className={styles.tag}>&lt;</span>
            LM
            <span className={styles.tag}>&nbsp;/&gt;</span>
          </span>
          <div className={styles.socials}>
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.social}
              aria-label="Instagram"
            >
              <i className="fab fa-instagram" />
            </a>
            <a
              href="https://youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.social}
              aria-label="YouTube"
            >
              <i className="fab fa-youtube" />
            </a>
            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.social}
              aria-label="WhatsApp"
            >
              <i className="fab fa-whatsapp" />
            </a>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.social}
              aria-label="GitHub"
            >
              <i className="fab fa-github" />
            </a>
          </div>
        </div>
        <div className={styles.divider} />
        <p className={styles.copy}>
          {tr.footer.made}{' '}
          <span className={styles.name}>Luigi Mello</span>
          {' · '}
          <span className={styles.accent}>© {year}</span>
          {' · '}
          {tr.footer.rights}
        </p>
      </div>
    </footer>
  );
}
