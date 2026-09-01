'use client';
import { useEffect, useRef } from 'react';
import styles from './SpaceShips.module.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const NAVE_ASPECT = 612 / 416;
const BASE_HEIGHT = 46;

interface ShipConfig {
  topPct: number;
  delay: number;
  duration: number;
  scale: number;
}

const SHIPS: ShipConfig[] = [
  { topPct: 16, delay: 0, duration: 24, scale: 1 },
  { topPct: 58, delay: 10, duration: 30, scale: 0.65 },
  { topPct: 36, delay: 20, duration: 26, scale: 0.85 },
];

export default function SpaceShips() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const mount = mountRef.current!;
    let renderer: import('three').WebGLRenderer | null = null;

    const run = async () => {
      const THREE = await import('three');
      const gsapModule = await import('gsap');
      const gsap = gsapModule.gsap;
      if (!active) return;

      const W = mount.clientWidth || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(0, W, H, 0, -100, 100);
      camera.position.z = 10;

      const texture = await new Promise<import('three').Texture>((resolve, reject) => {
        new THREE.TextureLoader().load(`${BASE}/nave.png`, resolve, undefined, reject);
      });
      if (!active) {
        try {
          renderer.dispose();
          if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        } catch {}
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

      const ships = SHIPS.map((cfg) => {
        const sprite = new THREE.Sprite(material);
        const height = BASE_HEIGHT * cfg.scale;
        sprite.scale.set(height * NAVE_ASPECT, height, 1);
        sprite.position.set(-150, H * (1 - cfg.topPct / 100), 0);
        scene.add(sprite);
        return { sprite, cfg };
      });

      const flyTweens = ships.map(({ sprite, cfg }) => {
        const endX = mount.clientWidth + 150;
        return gsap.to(sprite.position, {
          x: endX,
          duration: cfg.duration,
          delay: cfg.delay,
          repeat: -1,
          ease: 'none',
        });
      });

      const bobTweens = ships.map(({ sprite }, i) =>
        gsap.to(sprite.position, {
          y: '+=8',
          duration: 2 + i * 0.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      );

      const tick = () => {
        if (!active || !renderer) return;
        renderer.render(scene, camera);
      };
      tick();
      gsap.ticker.add(tick);

      const onResize = () => {
        if (!renderer) return;
        const nw = mount.clientWidth;
        const nh = mount.clientHeight;
        camera.right = nw;
        camera.top = nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', onResize);

      (mount as any).__ships_teardown = () => {
        active = false;
        window.removeEventListener('resize', onResize);
        gsap.ticker.remove(tick);
        [...flyTweens, ...bobTweens].forEach((t) => t.kill());
        ships.forEach(({ sprite }) => scene.remove(sprite));
        texture.dispose();
        material.dispose();
        try {
          renderer!.dispose();
        } catch {}
        try {
          if (renderer && mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        } catch {}
      };
    };

    run().catch(console.error);

    return () => {
      active = false;
      try {
        const fn = (mount as any).__ships_teardown;
        if (typeof fn === 'function') {
          fn();
          delete (mount as any).__ships_teardown;
        }
      } catch {}
    };
  }, []);

  return <div ref={mountRef} className={styles.mount} />;
}
