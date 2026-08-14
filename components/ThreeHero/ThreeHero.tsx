'use client';
import { useEffect, useRef } from 'react';
import styles from './ThreeHero.module.css';

export default function ThreeHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let animId: number;
    let disposed = false;

    const init = async () => {
      const THREE = await import('three');

      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;

      /* ── Renderer ── */
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      /* ── Scene / Camera ── */
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200);
      camera.position.set(0, 0, 7);

      /* ── Particles ── */
      const COUNT = 5000;
      const pos = new Float32Array(COUNT * 3);
      const col = new Float32Array(COUNT * 3);

      for (let i = 0; i < COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const r     = 5 + Math.random() * 10;
        pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
        const mix = Math.random();
        col[i * 3]     = 0.0;
        col[i * 3 + 1] = mix * 0.82;
        col[i * 3 + 2] = 1.0;
      }

      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      pGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
      const pMat = new THREE.PointsMaterial({
        size: 0.055,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
      });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      /* ── Torus Knot ── */
      const knotGeo = new THREE.TorusKnotGeometry(1.3, 0.38, 220, 24);
      const knotMat = new THREE.MeshBasicMaterial({
        color: 0x00d0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      });
      const knot = new THREE.Mesh(knotGeo, knotMat);
      scene.add(knot);

      /* ── Outer icosahedron ── */
      const icoGeo = new THREE.IcosahedronGeometry(2.2, 1);
      const icoMat = new THREE.MeshBasicMaterial({
        color: 0x7b2ff7,
        wireframe: true,
        transparent: true,
        opacity: 0.08,
      });
      const ico = new THREE.Mesh(icoGeo, icoMat);
      scene.add(ico);

      /* ── Glowing rings ── */
      const mkRing = (r: number, tube: number, color: number, opacity: number) => {
        const m = new THREE.Mesh(
          new THREE.TorusGeometry(r, tube, 16, 200),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
        );
        return m;
      };
      const ring1 = mkRing(2.4, 0.018, 0x00d0ff, 0.45);
      ring1.rotation.x = Math.PI / 2;
      scene.add(ring1);

      const ring2 = mkRing(1.9, 0.012, 0x7b2ff7, 0.30);
      ring2.rotation.x = Math.PI / 3;
      ring2.rotation.y = Math.PI / 5;
      scene.add(ring2);

      const ring3 = mkRing(3.0, 0.008, 0x00d0ff, 0.20);
      ring3.rotation.x = -Math.PI / 4;
      scene.add(ring3);

      /* ── Mouse parallax ── */
      let mx = 0, my = 0;
      const onMouse = (e: MouseEvent) => {
        mx = (e.clientX / window.innerWidth  - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('mousemove', onMouse);

      /* ── Resize ── */
      const onResize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      /* ── Animate ── */
      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed) return;
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        knot.rotation.x = t * 0.13;
        knot.rotation.y = t * 0.19;
        ico.rotation.x  = t * 0.05;
        ico.rotation.y  = t * 0.07;
        ring1.rotation.z = t * 0.12;
        ring2.rotation.z = -t * 0.09;
        ring3.rotation.z = t * 0.06;
        particles.rotation.y = t * 0.035;

        camera.position.x += (mx * 0.9 - camera.position.x) * 0.04;
        camera.position.y += (-my * 0.7 - camera.position.y) * 0.04;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        disposed = true;
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animId);
        renderer.dispose();
        pGeo.dispose(); knotGeo.dispose(); icoGeo.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      };
    };

    let cleanup: (() => void) | undefined;
    init().then(fn => { cleanup = fn; });
    return () => { disposed = true; cancelAnimationFrame(animId); cleanup?.(); };
  }, []);

  return <div ref={mountRef} className={styles.mount} />;
}
