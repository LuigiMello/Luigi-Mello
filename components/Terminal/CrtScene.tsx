'use client';
import { useEffect, useRef } from 'react';
import styles from './CrtScene.module.css';

/** Small rotating wireframe — the demoscene flourish every terminal boot needs. */
export default function CrtScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let animId = 0;
    let rdr: import('three').WebGLRenderer | null = null;
    const mount = mountRef.current!;

    const run = async () => {
      const THREE = await import('three');
      if (!active) return;

      const W = mount.clientWidth || 96;
      const H = mount.clientHeight || 96;

      rdr = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rdr.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rdr.setSize(W, H);
      mount.appendChild(rdr.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 20);
      camera.position.set(0, 0, 4.2);

      const geo = new THREE.IcosahedronGeometry(1.3, 0);
      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x33ff66, transparent: true, opacity: 0.85 })
      );
      scene.add(wire);

      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.22, 0),
        new THREE.MeshBasicMaterial({ color: 0x33ff66 })
      );
      scene.add(core);

      const onResize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        rdr!.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      let t = 0;
      const loop = () => {
        if (!active) return;
        animId = requestAnimationFrame(loop);
        t += 0.01;
        wire.rotation.x = t * 0.6;
        wire.rotation.y = t * 0.9;
        core.rotation.copy(wire.rotation);
        rdr!.render(scene, camera);
      };
      loop();

      (mount as any).__teardown = () => {
        active = false;
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animId);
        try { rdr!.dispose(); } catch (_) {}
        try { if (rdr && mount.contains(rdr.domElement)) mount.removeChild(rdr.domElement); } catch (_) {}
      };
    };

    run().catch(console.error);

    return () => {
      active = false;
      cancelAnimationFrame(animId);
      try {
        const fn = (mount as any).__teardown;
        if (typeof fn === 'function') { fn(); delete (mount as any).__teardown; }
        else if (rdr) {
          rdr.dispose();
          if (mount.contains(rdr.domElement)) mount.removeChild(rdr.domElement);
        }
      } catch (_) {}
    };
  }, []);

  return <div ref={mountRef} className={styles.mount} />;
}
