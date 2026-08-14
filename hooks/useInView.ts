'use client';
import { useEffect, useRef, useState } from 'react';

export function useInView(threshold = 0.15) {
  const ref  = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let trigger: any;

    const init = async () => {
      try {
        const { gsap }          = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        trigger = ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          onEnter: () => setInView(true),
        });
      } catch {
        /* Fallback: IntersectionObserver for static build / no gsap */
        const obs = new IntersectionObserver(
          ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
          { threshold }
        );
        obs.observe(el);
      }
    };

    init();
    return () => { trigger?.kill(); };
  }, [threshold]);

  return { ref, inView };
}
