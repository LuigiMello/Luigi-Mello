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
          <div className={styles.mark}>
            <span className={styles.logo}>LM<span className={styles.tag}>-01</span></span>
            <span className={styles.edition}>EDIÇÃO {year} · REV. A</span>
          </div>
          <div className={styles.socials}>
            <a href="https://www.instagram.com/oluigilucio/" target="_blank" rel="noopener noreferrer" className={styles.social} aria-label="Instagram">
              <i className="fab fa-instagram" />
            </a>
            <a href="https://youtube.com/@oluigimello" target="_blank" rel="noopener noreferrer" className={styles.social} aria-label="YouTube">
              <i className="fab fa-youtube" />
            </a>
            <a href="https://wa.me/5541992096564" target="_blank" rel="noopener noreferrer" className={styles.social} aria-label="WhatsApp">
              <i className="fab fa-whatsapp" />
            </a>
            <a href="https://github.com/LuigiMello" target="_blank" rel="noopener noreferrer" className={styles.social} aria-label="GitHub">
              <i className="fab fa-github" />
            </a>
          </div>
        </div>
        <div className={styles.divider} />
        <p className={styles.colophon}>
          {tr.footer.made} <span className={styles.name}>Luigi Mello</span>
          {' · '}© {year} · {tr.footer.rights}
        </p>
      </div>
    </footer>
  );
}
