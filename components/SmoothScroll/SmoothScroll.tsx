'use client';
import { useEffect, useRef } from 'react';
import styles from './SmoothScroll.module.css';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let smoother: any;

    const init = async () => {
      const { gsap }          = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      const { ScrollSmoother } = await import('gsap/ScrollSmoother');

      gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

      smoother = ScrollSmoother.create({
        wrapper:            wrapperRef.current!,
        content:            contentRef.current!,
        smooth:             1.4,
        effects:            true,
        normalizeScroll:    true,
        ignoreMobileResize: true,
      });
    };

    init();
    return () => { smoother?.kill(); };
  }, []);

  return (
    <div ref={wrapperRef} id="smooth-wrapper" className={styles.wrapper}>
      <div ref={contentRef} id="smooth-content" className={styles.content}>
        {children}
      </div>
    </div>
  );
}
