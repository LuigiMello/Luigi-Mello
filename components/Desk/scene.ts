import * as THREE from 'three';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Book, COVER_H, COVER_W, PAGE_H, PAGE_W } from './book';
import { MAX_SPREAD, PAGES } from './content';
import { ART_H, ART_W, hotspotAt, renderPage, type DrawContext, type Hotspot } from './pages';
import { createCards, createCoffee, createDesk, createPencil, createPlant } from './props';
import { makeCanvas } from './textures';

gsap.registerPlugin(Observer);

export interface DeskState {
  open: boolean;
  spread: number;
}

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main(){
      vec2 d = vUv - 0.5;
      float ca = dot(d, d) * 0.004;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + d * ca).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - d * ca).b;
      float v = smoothstep(0.92, 0.22, length(d * vec2(1.0, 1.1)));
      col *= mix(0.42, 1.0, v);
      float g = hash(floor(vUv * uRes) + fract(uTime * 13.17) * 517.0) - 0.5;
      col += g * 0.04 * (1.0 - dot(col, vec3(0.3333)) * 0.6);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

const lerp = THREE.MathUtils.lerp;
const DEG = Math.PI / 180;

export class DeskExperience {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private finish: ShaderPass;
  private bloom: UnrealBloomPass;
  private book: Book;
  private spot: THREE.SpotLight;
  private steamMat: THREE.ShaderMaterial;
  private steam: THREE.Mesh;
  private canvases: HTMLCanvasElement[] = [];
  private textures: THREE.CanvasTexture[] = [];
  private masks = new Map<number, { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture }>();
  private raf = 0;
  private spread = 0;
  private pose = { open: 0 };
  private pointer = new THREE.Vector2(0, 0);
  private parallax = new THREE.Vector2(0, 0);
  private ray = new THREE.Raycaster();
  private deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.04);
  private hover: 'book' | 'left' | 'right' | null = null;
  private down: { x: number; y: number; t: number } | null = null;
  private disposed = false;
  private mobile: boolean;
  private lightLevel = { v: 0 };

  constructor(
    private container: HTMLElement,
    private draw: DrawContext,
    private onChange: (s: DeskState) => void,
  ) {
    this.mobile = Math.min(window.innerWidth, window.innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
    const w = container.clientWidth;
    const h = container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 1.75));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';

    this.scene.background = new THREE.Color(0x020203);
    this.camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 80);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    /* lighting: one cool key spot over the reader's shoulder, the rest falls into darkness */
    this.spot = new THREE.SpotLight(0xf1f3ff, 0, 30, 0.52, 0.9, 2);
    this.spot.position.set(0.25, 7.2, 1.1);
    this.spot.target.position.set(0.0, 0, 1.0);
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(this.mobile ? 1024 : 2048, this.mobile ? 1024 : 2048);
    this.spot.shadow.bias = -0.00015;
    this.spot.shadow.normalBias = 0.012;
    this.spot.shadow.radius = 5;
    this.spot.shadow.camera.near = 5;
    this.spot.shadow.camera.far = 9;
    this.scene.add(this.spot, this.spot.target);

    const fill = new THREE.SpotLight(0xdfe4f5, 0, 30, 0.75, 1, 2);
    fill.position.set(-0.5, 9, -2.5);
    fill.target.position.set(0.2, 0, -0.4);
    this.scene.add(fill, fill.target);
    const hemi = new THREE.HemisphereLight(0xc4c9d8, 0x000000, 0);
    this.scene.add(hemi);
    // "lights on" when the scene first appears
    gsap.to(this.lightLevel, {
      v: 1,
      duration: 2.2,
      ease: 'power2.inOut',
      delay: 0.15,
      onUpdate: () => {
        this.spot.intensity = 175 * this.lightLevel.v;
        fill.intensity = 5 * this.lightLevel.v;
        hemi.intensity = 0.03 * this.lightLevel.v;
      },
    });

    /* the desk and everything on it */
    this.scene.add(createDesk());

    const plant = createPlant();
    plant.position.set(-2.7, 0, 0.2);
    plant.rotation.y = 0.6;
    this.scene.add(plant);

    const pencil = createPencil(env);
    pencil.position.set(-2.15, 0, 1.25);
    pencil.rotation.y = 0.95;
    this.scene.add(pencil);

    const coffee = createCoffee(env);
    coffee.group.position.set(2.5, 0, -0.75);
    this.scene.add(coffee.group);
    this.steam = coffee.steam;
    this.steamMat = coffee.steamMat;

    const cards = createCards();
    cards.position.set(2.6, 0, 1.12);
    cards.rotation.y = -0.22;
    this.scene.add(cards);

    /* the magazine */
    const aniso = Math.min(16, this.renderer.capabilities.getMaxAnisotropy());
    const size = this.mobile ? [960, 600] : [1440, 900];
    const pageMats: THREE.Material[] = PAGES.map((_, i) => {
      const { c } = makeCanvas(size[0], size[1]);
      renderPage(c, i, this.draw);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = aniso;
      this.canvases.push(c);
      this.textures.push(tex);
      const side = i % 2 === 0 ? THREE.FrontSide : THREE.BackSide;
      const outerCover = i === 0 || i === PAGES.length - 1;
      if (outerCover) {
        const { c: mc } = makeCanvas(1024, 640);
        renderPage(mc, i, this.draw, true);
        const mtex = new THREE.CanvasTexture(mc);
        mtex.anisotropy = aniso;
        this.masks.set(i, { canvas: mc, tex: mtex });
        return new THREE.MeshStandardMaterial({
          map: tex,
          side,
          roughness: 1,
          metalness: 1,
          roughnessMap: mtex,
          metalnessMap: mtex,
          envMap: env,
          envMapIntensity: 0.4,
        });
      }
      return new THREE.MeshStandardMaterial({ map: tex, side, roughness: 0.64, metalness: 0, envMap: env, envMapIntensity: 0.05 });
    });
    this.book = new Book({
      pages: pageMats,
      coverEdge: new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.55 }),
      paperEdge: new THREE.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 0.95 }),
    });
    this.scene.add(this.book.group);

    /* post: subtle bloom on highlights, then lens vignette, CA and film grain */
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.05, 0.4, 1.3);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.finish = new ShaderPass(FinishShader);
    this.composer.addPass(this.finish);

    this.applyCamera(true);
    this.bind();
    this.loop();
    this.emit();
  }

  /* ── public API ─────────────────────────────────────────────────── */

  setLang(draw: DrawContext) {
    this.draw = { ...draw, hover: this.draw.hover };
    this.canvases.forEach((c, i) => {
      renderPage(c, i, draw);
      this.textures[i].needsUpdate = true;
    });
    this.masks.forEach((m, i) => {
      renderPage(m.canvas, i, draw, true);
      m.tex.needsUpdate = true;
    });
  }

  next() {
    this.goTo(this.spread + 1);
  }

  prev() {
    this.goTo(this.spread - 1);
  }

  close() {
    this.goTo(0);
  }

  goTo(target: number) {
    target = THREE.MathUtils.clamp(target, 0, MAX_SPREAD);
    const from = this.spread;
    if (target === from) return;
    const forward = target > from;
    this.spread = target;

    for (const leaf of this.book.leaves) gsap.to(leaf, { hover: 0, duration: 0.3, overwrite: 'auto' });
    this.setHot(null);

    const list: number[] = [];
    if (forward) for (let k = from; k < target; k++) list.push(k);
    else for (let k = from - 1; k >= target; k--) list.push(k);
    const n = list.length;
    const stagger = n > 1 ? Math.min(0.13, 1.1 / n) : 0;
    list.forEach((k, i) => {
      const leaf = this.book.leaves[k];
      const fast = n > 2;
      gsap.to(leaf, {
        theta: forward ? Math.PI : 0,
        duration: fast ? 0.95 : leaf.stiff ? 1.35 : 1.15,
        ease: fast ? 'power2.inOut' : 'power3.inOut',
        delay: i * stagger,
        overwrite: 'auto',
      });
    });

    if (from === 0) {
      gsap.to(this.pose, { open: 1, duration: 1.6, ease: 'power3.inOut', overwrite: 'auto' });
    } else if (target === 0) {
      gsap.to(this.pose, { open: 0, duration: 1.5, ease: 'power3.inOut', delay: Math.max(0, (n - 1) * stagger) + 0.35, overwrite: 'auto' });
    }
    this.emit();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.unbind();
    gsap.killTweensOf(this.lightLevel);
    gsap.killTweensOf(this.pose);
    this.book.leaves.forEach((l) => gsap.killTweensOf(l));
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const mat of mats) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
        mat.dispose();
      }
    });
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ── internals ──────────────────────────────────────────────────── */

  private emit() {
    this.onChange({ open: this.spread > 0, spread: this.spread });
  }

  private applyCamera(snap = false) {
    const { clientWidth: w, clientHeight: h } = this.container;
    const aspect = w / h;
    const o = this.pose.open;
    const tanV = Math.tan((this.camera.fov * DEG) / 2);
    const tanH = tanV * aspect;
    const portrait = aspect < 0.9;
    const elev = lerp(57, portrait ? 76 : 68, o) * DEG;
    const needW = lerp(portrait ? 3.7 : 6.7, portrait ? 3.36 : 4.05, o);
    const needD = lerp(portrait ? 6.5 : 4.9, portrait ? 2.6 : 2.25, o);
    const dist = Math.max(needW / 2 / tanH, ((needD / 2) * Math.sin(elev)) / tanV);
    const tz = lerp(0.42, 0.2, o);
    const tx = 0;

    if (snap) this.parallax.copy(this.pointer);
    const px = this.parallax.x * lerp(0.22, 0.08, o);
    const pz = this.parallax.y * lerp(0.12, 0.05, o);
    this.camera.position.set(tx + px, Math.sin(elev) * dist, tz + Math.cos(elev) * dist - pz);
    this.camera.lookAt(tx + px * 0.4, 0, tz - pz * 0.4);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    // the magazine slides to the centre and squares up as it opens
    const g = this.book.group;
    g.position.set(lerp(-COVER_W / 2 + 0.06, 0, o), 0, lerp(0.28, 0.02, o));
    g.rotation.y = lerp(0.12, 0, o);
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const t = performance.now() / 1000;
    this.parallax.lerp(this.pointer, 0.045);
    this.applyCamera();
    this.book.open = this.pose.open;
    this.book.update();
    this.steamMat.uniforms.uTime.value = t;
    this.steam.quaternion.copy(this.camera.quaternion);
    this.finish.uniforms.uTime.value = t;
    this.composer.render();
  };

  private onResize = () => {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.finish.uniforms.uRes.value.set(w * this.renderer.getPixelRatio(), h * this.renderer.getPixelRatio());
    this.applyCamera();
  };

  /**
   * Where on the magazine the pointer is: which zone, which page, and the
   * point on that page in artboard pixels (so printed links can be hit).
   */
  private pick(clientX: number, clientY: number): { zone: 'book' | 'left' | 'right' | null; page: number; ax: number; ay: number } {
    const none = { zone: null, page: -1, ax: 0, ay: 0 };
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(this.deskPlane, hit)) return none;
    const p = this.book.group.worldToLocal(hit);
    if (Math.abs(p.z) > COVER_H / 2 + 0.02) return none;
    const ay = ((p.z + PAGE_H / 2) / PAGE_H) * ART_H;
    if (this.spread === 0) return p.x > -0.02 && p.x < COVER_W + 0.02 ? { zone: 'book', page: 0, ax: 0, ay } : none;
    if (p.x > 0 && p.x < COVER_W + 0.02) return { zone: 'right', page: this.spread * 2, ax: (p.x / PAGE_W) * ART_W, ay };
    if (p.x < 0 && p.x > -COVER_W - 0.02) return { zone: 'left', page: this.spread * 2 - 1, ax: ((p.x + PAGE_W) / PAGE_W) * ART_W, ay };
    return none;
  }

  /** True while any sheet is mid-turn (printed links are ignored until it lands). */
  private turning() {
    return this.book.leaves.some((l) => l.theta > 0.02 && l.theta < Math.PI - 0.02);
  }

  private spotUnder(clientX: number, clientY: number) {
    const hit = this.pick(clientX, clientY);
    const onPage = hit.zone === 'left' || hit.zone === 'right';
    const spot = onPage && !this.turning() ? hotspotAt(hit.page, hit.ax, hit.ay) : null;
    return { hit, spot };
  }

  private repaint(i: number) {
    if (!this.canvases[i]) return;
    renderPage(this.canvases[i], i, this.draw);
    this.textures[i].needsUpdate = true;
  }

  /** Repaints the pages whose printed link gained or lost the hover state. */
  private setHot(next: { page: number; id: string } | null) {
    const prev = this.draw.hover ?? null;
    if (prev?.page === next?.page && prev?.id === next?.id) return;
    this.draw = { ...this.draw, hover: next };
    const pages = new Set<number>();
    if (prev) pages.add(prev.page);
    if (next) pages.add(next.page);
    pages.forEach((i) => this.repaint(i));
  }

  private activate(spot: Hotspot) {
    if (spot.goto !== undefined) {
      this.goTo(spot.goto);
    } else if (spot.href) {
      if (spot.href.startsWith('mailto:')) window.location.href = spot.href;
      else window.open(spot.href, '_blank', 'noopener,noreferrer');
    }
  }

  private setHover(h: 'book' | 'left' | 'right' | null) {
    if (h === 'right' && this.spread >= MAX_SPREAD) h = null;
    if (h === this.hover) return;
    this.hover = h;
    const leaves = this.book.leaves;
    const lift = (k: number, v: number) => {
      const leaf = leaves[k];
      if (leaf) gsap.to(leaf, { hover: v, duration: v ? 0.55 : 0.4, ease: v ? 'power2.out' : 'power2.inOut', overwrite: 'auto' });
    };
    leaves.forEach((_, k) => lift(k, 0));
    if (h === 'book') lift(0, 0.8);
    if (h === 'right') lift(this.spread, 1);
    if (h === 'left') lift(this.spread - 1, 1);
  }

  private updateHover(clientX: number, clientY: number) {
    const { hit, spot } = this.spotUnder(clientX, clientY);
    this.setHot(spot ? { page: hit.page, id: spot.id } : null);
    // over a printed link the page stays put; elsewhere it lifts to invite a turn
    this.setHover(spot ? null : hit.zone);
    this.renderer.domElement.style.cursor = spot || this.hover ? 'pointer' : 'default';
  }

  private onMove = (e: PointerEvent) => {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (e.pointerType === 'mouse') this.updateHover(e.clientX, e.clientY);
  };

  private onDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  private onUp = (e: PointerEvent) => {
    const d = this.down;
    this.down = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) && this.spread > 0) {
      if (dx < 0) this.next();
      else this.prev();
      return;
    }
    if (Math.hypot(dx, dy) > 10) return;
    const { hit, spot } = this.spotUnder(e.clientX, e.clientY);
    if (spot) this.activate(spot);
    else if (hit.zone === 'book') this.goTo(1);
    else if (hit.zone === 'right') this.next();
    else if (hit.zone === 'left') this.prev();
    if (e.pointerType === 'mouse') this.updateHover(e.clientX, e.clientY);
  };

  private onLeave = () => {
    this.pointer.set(0, 0);
    this.setHover(null);
    this.setHot(null);
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === 'ArrowRight') this.goTo(this.spread + 1);
    else if (e.key === 'ArrowLeft') this.prev();
    else if (e.key === 'Escape') this.close();
    else return;
    e.preventDefault();
  };

  private ro?: ResizeObserver;
  private wheel?: Observer;
  private wheelLock = 0;
  private lastWheel = 0;
  private lastFlip = 0;

  /**
   * Mouse-wheel paging. Each scroll gesture turns one page; if the wheel keeps
   * spinning, pages keep turning at a steady riffle instead of all at once.
   */
  private wheelStep(dir: 1 | -1) {
    const now = performance.now();
    if (now < this.wheelLock) return;
    const target = this.spread + dir;
    if (target < 0 || target > MAX_SPREAD) return;
    // opening/closing moves the camera too, so give it a little longer
    this.wheelLock = now + (this.spread === 0 || target === 0 ? 1100 : 620);
    this.lastFlip = now;
    this.goTo(target);
  }

  private bind() {
    const el = this.renderer.domElement;
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointerleave', this.onLeave);
    window.addEventListener('keydown', this.onKey);
    this.wheel = Observer.create({
      target: window,
      type: 'wheel',
      tolerance: 14,
      preventDefault: true,
      onWheel: () => {
        // a pause in the wheel starts a new gesture, which may turn a page right away
        const now = performance.now();
        if (now - this.lastWheel > 220 && now - this.lastFlip > 320 && this.wheelLock - now < 600) this.wheelLock = 0;
        this.lastWheel = now;
      },
      onDown: () => this.wheelStep(1),
      onUp: () => this.wheelStep(-1),
    });
    this.ro = new ResizeObserver(this.onResize);
    this.ro.observe(this.container);
    this.onResize();
  }

  private unbind() {
    const el = this.renderer.domElement;
    el.removeEventListener('pointermove', this.onMove);
    el.removeEventListener('pointerdown', this.onDown);
    el.removeEventListener('pointerup', this.onUp);
    el.removeEventListener('pointerleave', this.onLeave);
    window.removeEventListener('keydown', this.onKey);
    this.wheel?.kill();
    this.ro?.disconnect();
  }
}
