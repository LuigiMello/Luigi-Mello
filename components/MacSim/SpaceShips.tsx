'use client';
import { useEffect, useRef } from 'react';
import styles from './SpaceShips.module.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const NAVE_ASPECT = 612 / 416;
const BASE_HEIGHT = 46;
/* nave.png's rocket points ~34° up-right; rotate it level (nose -> +X) */
const NAVE_ANGLE_CORRECTION = -0.595;

type Direction = 'ltr' | 'rtl';

interface ShipConfig {
  topPct: number;
  delay: number;
  duration: number;
  scale: number;
  direction: Direction;
}

const SHIPS: ShipConfig[] = [
  // left -> right (nose points right, matching travel direction)
  { topPct: 14, delay: 0, duration: 24, scale: 1, direction: 'ltr' },
  { topPct: 58, delay: 10, duration: 30, scale: 0.65, direction: 'ltr' },
  { topPct: 36, delay: 20, duration: 26, scale: 0.85, direction: 'ltr' },
  // right -> left (texture mirrored, nose points left, matching travel direction)
  { topPct: 26, delay: 5, duration: 27, scale: 0.75, direction: 'rtl' },
  { topPct: 70, delay: 15, duration: 32, scale: 0.6, direction: 'rtl' },
  { topPct: 47, delay: 24, duration: 22, scale: 0.9, direction: 'rtl' },
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

      const textureLtr = await new Promise<import('three').Texture>((resolve, reject) => {
        new THREE.TextureLoader().load(`${BASE}/nave.png`, resolve, undefined, reject);
      });
      if (!active) {
        try {
          renderer.dispose();
          if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        } catch {}
        return;
      }
      textureLtr.colorSpace = THREE.SRGBColorSpace;

      // Mirrored clone for right-to-left ships (flips via UV, not geometry,
      // so it stays correct regardless of the non-uniform sprite scale/rotation).
      const textureRtl = textureLtr.clone();
      textureRtl.wrapS = THREE.RepeatWrapping;
      textureRtl.repeat.x = -1;
      textureRtl.needsUpdate = true;

      const materialLtr = new THREE.SpriteMaterial({
        map: textureLtr,
        transparent: true,
        rotation: NAVE_ANGLE_CORRECTION,
      });
      const materialRtl = new THREE.SpriteMaterial({
        map: textureRtl,
        transparent: true,
        // Flipping the texture's U axis also flips the sense of `rotation`
        // (rotation is applied to the quad after the UV flip), so the mirrored
        // sprite needs the opposite sign to end up level and nose-first too.
        rotation: -NAVE_ANGLE_CORRECTION,
      });

      const ships = SHIPS.map((cfg) => {
        const ltr = cfg.direction === 'ltr';
        const sprite = new THREE.Sprite(ltr ? materialLtr : materialRtl);
        const height = BASE_HEIGHT * cfg.scale;
        sprite.scale.set(height * NAVE_ASPECT, height, 1);
        const startX = ltr ? -150 : mount.clientWidth + 150;
        sprite.position.set(startX, H * (1 - cfg.topPct / 100), 0);
        scene.add(sprite);
        return { sprite, cfg };
      });

      const flyTweens = ships.map(({ sprite, cfg }) => {
        const ltr = cfg.direction === 'ltr';
        const endX = ltr ? mount.clientWidth + 150 : -150;
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
        textureLtr.dispose();
        textureRtl.dispose();
        materialLtr.dispose();
        materialRtl.dispose();
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
