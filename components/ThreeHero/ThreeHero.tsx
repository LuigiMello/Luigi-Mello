'use client';
import { useEffect, useRef } from 'react';
import styles from './ThreeHero.module.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function ThreeHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let animId = 0;
    let rdr: import('three').WebGLRenderer | null = null;
    const mount = mountRef.current!;

    const run = async () => {
      const THREE        = await import('three');
      const { FontLoader }   = await import('three/examples/jsm/loaders/FontLoader.js');
      const { TextGeometry } = await import('three/examples/jsm/geometries/TextGeometry.js');

      if (!active) return;

      /* ── Renderer ── */
      const W = mount.clientWidth  || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      rdr = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rdr.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rdr.setSize(W, H);
      mount.appendChild(rdr.domElement);

      /* ── Scene / Camera ── */
      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 200);
      camera.position.set(0, 0, 9);

      /* ── Lights ── */
      scene.add(new THREE.AmbientLight(0xffffff, 1.8));
      const pl1 = new THREE.PointLight(0x00d0ff, 160, 40);
      pl1.position.set(-4, 6, 8); scene.add(pl1);
      const pl2 = new THREE.PointLight(0x7b2ff7, 60, 30);
      pl2.position.set(5, -2, 5); scene.add(pl2);
      const pl3 = new THREE.PointLight(0xffffff, 40, 20);
      pl3.position.set(0, 0, 10); scene.add(pl3);

      /* ── Particles (stars) ── */
      const CNT  = 3800;
      const pPos = new Float32Array(CNT * 3);
      const pCol = new Float32Array(CNT * 3);
      for (let i = 0; i < CNT; i++) {
        const t = Math.random() * Math.PI * 2;
        const p = Math.acos(2 * Math.random() - 1);
        const r = 8 + Math.random() * 14;
        pPos[i*3]   = r * Math.sin(p) * Math.cos(t);
        pPos[i*3+1] = r * Math.sin(p) * Math.sin(t);
        pPos[i*3+2] = r * Math.cos(p);
        const bright = 0.5 + Math.random() * 0.5;
        pCol[i*3] = bright * 0.3; pCol[i*3+1] = bright * 0.7; pCol[i*3+2] = bright;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
      const stars = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.055, vertexColors: true, transparent: true, opacity: 0.75, sizeAttenuation: true,
      }));
      scene.add(stars);

      /* ── Font ── */
      const font: any = await new Promise((ok, fail) =>
        new FontLoader().load(`${BASE}/fonts/helvetiker_bold.typeface.json`, ok, undefined, fail)
      );
      if (!active) {
        rdr!.dispose();
        if (mount.contains(rdr!.domElement)) mount.removeChild(rdr!.domElement);
        return;
      }

      const makeMesh = (text: string, size: number, mat: import('three').Material) => {
        const geo = new TextGeometry(text, {
          font, size,
          depth:         size * 0.18,
          curveSegments: 16,
          bevelEnabled:  false,       /* sem bevel = sem quadriculado */
        });
        geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        geo.translate(-(bb.max.x + bb.min.x) / 2, 0, 0);
        return new THREE.Mesh(geo, mat);
      };

      /* "Luigi" — glossy cyan */
      const luigi = makeMesh('Luigi', 1.1, new THREE.MeshPhongMaterial({
        color:    new THREE.Color(0x00c8f0),
        emissive: new THREE.Color(0x004466),
        specular: new THREE.Color(0xffffff),
        shininess: 220,
      }));
      luigi.position.set(0, 1.55, 0);   /* mais alto */

      /* "Mello" — polished white-silver */
      const mello = makeMesh('Mello', 1.1, new THREE.MeshPhongMaterial({
        color:    new THREE.Color(0xeef6ff),
        emissive: new THREE.Color(0x0d1f35),
        specular: new THREE.Color(0xffffff),
        shininess: 260,
      }));
      mello.position.set(0, 0.05, 0);   /* mais alto também */

      const grp = new THREE.Group();
      grp.add(luigi, mello);
      scene.add(grp);

      /* ── Mouse parallax ── */
      let mx = 0, my = 0;
      const onMouse = (e: MouseEvent) => {
        mx = (e.clientX / window.innerWidth  - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('mousemove', onMouse);

      /* ── Resize ── */
      const onResize = () => {
        const nw = mount.clientWidth, nh = mount.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        rdr!.setSize(nw, nh);
      };
      window.addEventListener('resize', onResize);

      /* ── Render loop — all animation via manual math ── */
      let tick  = 0;
      let enter = 0;
      const loop = () => {
        if (!active) return;
        animId = requestAnimationFrame(loop);
        tick  += 0.007;
        enter  = Math.min(1, enter + 0.009);
        const ease = 1 - Math.pow(1 - enter, 3);

        /* entrance from y=-3.3 → y=0.5 (text sits in upper half of canvas) */
        const baseY  = -3.3 + 3.8 * ease;
        const floatY = enter >= 1 ? Math.sin(tick * 0.5) * 0.12 : 0;
        grp.position.y = baseY + floatY;
        grp.rotation.y = -0.35 * (1 - ease) + Math.sin(tick * 0.28) * 0.05 * ease;

        /* slow star drift */
        stars.rotation.y = tick * 0.018;

        camera.position.x += (mx * 0.55 - camera.position.x) * 0.04;
        camera.position.y += (-my * 0.38 - camera.position.y) * 0.04;
        camera.lookAt(0, 0.25, 0);
        rdr!.render(scene, camera);
      };
      loop();

      (mount as any).__three_teardown = () => {
        active = false;
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animId);
        try { rdr!.dispose(); } catch (_) {}
        try { if (rdr && mount && mount.contains(rdr.domElement)) mount.removeChild(rdr.domElement); } catch (_) {}
      };
    };

    run().catch(console.error);

    return () => {
      active = false;
      cancelAnimationFrame(animId);
      try {
        const fn = (mount as any).__three_teardown;
        if (typeof fn === 'function') { fn(); delete (mount as any).__three_teardown; }
        else if (rdr) {
          rdr.dispose();
          if (mount && mount.contains(rdr.domElement)) mount.removeChild(rdr.domElement);
        }
      } catch (_) {}
    };
  }, []);

  return <div ref={mountRef} className={styles.mount} />;
}
