'use client';
import { useEffect, useRef } from 'react';
import styles from './SmoothScroll.module.css';

export default function SmoothScroll({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
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
  }, [disabled]);

  // Embedded contexts (e.g. inside the Brave window mock) scroll their own
  // bounded container natively — ScrollSmoother assumes real page/document
  // scroll, which doesn't exist inside a fixed-size boxed window.
  if (disabled) {
    return (
      <div id="embedded-scroll" className={styles.plain}>
        {children}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} id="smooth-wrapper" className={styles.wrapper}>
      <div ref={contentRef} id="smooth-content" className={styles.content}>
        {children}
      </div>
    </div>
  );
}
