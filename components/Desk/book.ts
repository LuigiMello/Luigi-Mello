import * as THREE from 'three';
import { rectShadowTexture } from './textures';

/* Magazine proportions, in scene units (1 unit ≈ 17 cm). */
export const PAGE_W = 1.6;
export const PAGE_H = 1.0;
export const COVER_W = PAGE_W + 0.006;
export const COVER_H = PAGE_H + 0.01;
const PAGE_T = 0.0018; // thickness of one paper leaf
const COVER_T = 0.009; // thickness of a cover board

const SEG_X = 44;
const SEG_Y = 10;

/* How the paper behaves while turning. */
const BEND = 1.15; // how much the free edge lags/leads the spine
const LEAD = 0.95; // early in the turn the lifted edge leads
const LAG = 0.75; // late in the turn the edge trails and floats down last
const TWIST = 0.42; // the corner nearest the reader leads, like a real hand-turn
const GUTTER = 0.3; // how steeply the paper rises out of the spine when open
const GUTTER_W = 0.048;
/** Height the paper gains climbing out of the gutter (∫ sin(g·e^(-s/w)) ds). */
const GUTTER_RISE = GUTTER * GUTTER_W * (1 - (GUTTER * GUTTER) / 18);
const HOVER_ANGLE = 0.11;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export interface LeafOptions {
  index: number;
  stiff: boolean;
  front: THREE.Material;
  back: THREE.Material;
  edge?: THREE.Material;
}

export class Leaf {
  readonly index: number;
  readonly stiff: boolean;
  readonly w: number;
  readonly h: number;
  readonly thick: number;
  theta = 0;
  hover = 0;
  yRight = 0;
  yLeft = 0;
  readonly group = new THREE.Group();
  readonly front: THREE.Mesh;
  readonly back: THREE.Mesh;
  private slab?: THREE.Mesh;
  private geoF: THREE.BufferGeometry;
  private geoB: THREE.BufferGeometry;
  private posF: Float32Array;
  private posB: Float32Array;
  private last = { theta: NaN, hover: NaN, open: NaN };

  constructor(o: LeafOptions) {
    this.index = o.index;
    this.stiff = o.stiff;
    this.w = o.stiff ? COVER_W : PAGE_W;
    this.h = o.stiff ? COVER_H : PAGE_H;
    this.thick = o.stiff ? COVER_T : PAGE_T;

    const nx = SEG_X + 1;
    const ny = SEG_Y + 1;
    const count = nx * ny;
    this.posF = new Float32Array(count * 3);
    this.posB = o.stiff ? new Float32Array(count * 3) : this.posF;
    const uvF = new Float32Array(count * 2);
    const uvB = new Float32Array(count * 2);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        const u = i / SEG_X;
        const v = 1 - j / SEG_Y; // row 0 is the far edge (top of the page)
        uvF[k * 2] = u;
        uvF[k * 2 + 1] = v;
        uvB[k * 2] = 1 - u; // the back is read with the spine on the right
        uvB[k * 2 + 1] = v;
      }
    }
    const index: number[] = [];
    for (let j = 0; j < SEG_Y; j++) {
      for (let i = 0; i < SEG_X; i++) {
        const a = j * nx + i;
        const b = a + 1;
        const c = a + nx;
        const d = c + 1;
        index.push(a, c, b, b, c, d); // wound so the front faces +Y when lying flat
      }
    }
    this.geoF = new THREE.BufferGeometry();
    this.geoF.setIndex(index);
    this.geoF.setAttribute('position', new THREE.BufferAttribute(this.posF, 3));
    this.geoF.setAttribute('uv', new THREE.BufferAttribute(uvF, 2));
    this.geoB = new THREE.BufferGeometry();
    this.geoB.setIndex(index);
    if (o.stiff) {
      this.geoB.setAttribute('position', new THREE.BufferAttribute(this.posB, 3));
    } else {
      // pages are paper-thin: both faces share one surface and its normals
      this.geoB.setAttribute('position', this.geoF.getAttribute('position'));
    }
    this.geoB.setAttribute('uv', new THREE.BufferAttribute(uvB, 2));

    this.front = new THREE.Mesh(this.geoF, o.front);
    this.back = new THREE.Mesh(this.geoB, o.back);
    for (const m of [this.front, this.back]) {
      m.frustumCulled = false;
      m.receiveShadow = true;
    }
    this.front.castShadow = true;
    this.back.castShadow = o.stiff;
    this.group.add(this.front, this.back);

    if (o.stiff && o.edge) {
      this.slab = new THREE.Mesh(new THREE.BoxGeometry(this.w, this.thick, this.h), o.edge);
      this.slab.castShadow = true;
      this.slab.receiveShadow = false; // edge-on to the lamp: would alias into stripes
      this.group.add(this.slab);
    }
  }

  /** Lays the sheet out for its current turn angle. `open` is 0 (closed) → 1 (lying open). */
  update(open: number, force = false) {
    const side = this.theta < Math.PI / 2 ? 1 : -1;
    const theta = THREE.MathUtils.clamp(this.theta + this.hover * HOVER_ANGLE * side, 0, Math.PI);
    if (!force && theta === this.last.theta && this.hover === this.last.hover && open === this.last.open) return;
    this.last = { theta, hover: this.hover, open };

    const t = theta / Math.PI;
    const ease = t * t * (3 - 2 * t);
    const baseY = lerp(this.yRight, this.yLeft, ease) + Math.sin(theta) * 0.004;
    const flex = this.stiff ? 0 : 1;
    const bend = flex * BEND * Math.sin(theta) * ((1 - t) * LEAD - t * LAG);
    const twist = flex * TWIST;
    const gutter = flex * GUTTER * open;
    const cosT = Math.cos(theta);

    const nx = SEG_X + 1;
    const ds = this.w / SEG_X;
    const half = this.stiff ? this.thick / 2 + 0.0004 : 0;
    for (let j = 0; j <= SEG_Y; j++) {
      const zN = j / SEG_Y - 0.5; // -0.5 far edge … +0.5 near edge
      const z = zN * this.h;
      const rowBend = bend * (1 + twist * zN * 2);
      let x = 0;
      let y = 0;
      for (let i = 0; i <= SEG_X; i++) {
        const k = (j * nx + i) * 3;
        const s = i * ds;
        const sm = s + ds / 2;
        const phiHere = theta + rowBend * Math.pow(s / this.w, 1.7) + gutter * Math.exp(-s / GUTTER_W) * cosT;
        const ox = -Math.sin(phiHere) * half;
        const oy = Math.cos(phiHere) * half;
        this.posF[k] = x + ox;
        this.posF[k + 1] = baseY + y + oy;
        this.posF[k + 2] = z;
        if (this.stiff) {
          this.posB[k] = x - ox;
          this.posB[k + 1] = baseY + y - oy;
          this.posB[k + 2] = z;
        }
        // integrate along the arc so the paper never stretches
        const phi = theta + rowBend * Math.pow(sm / this.w, 1.7) + gutter * Math.exp(-sm / GUTTER_W) * cosT;
        x += Math.cos(phi) * ds;
        y += Math.sin(phi) * ds;
      }
    }
    this.geoF.attributes.position.needsUpdate = true;
    this.geoF.computeVertexNormals();
    if (this.stiff) {
      this.geoB.attributes.position.needsUpdate = true;
      this.geoB.computeVertexNormals();
    }
    if (this.slab) {
      this.slab.position.set(Math.cos(theta) * this.w / 2, baseY + Math.sin(theta) * this.w / 2, 0);
      this.slab.rotation.z = theta;
    }
  }
}

export interface BookMaterials {
  pages: THREE.Material[]; // one per page, front/back alternating per leaf
  coverEdge: THREE.Material;
  paperEdge: THREE.Material;
}

/**
 * A saddle-stitched magazine: rigid covers, flexible leaves, all hinged on the
 * spine at x = 0. Angle 0 lies to the right (unread), π to the left (read).
 */
export class Book {
  readonly group = new THREE.Group(); // positioned/rotated on the desk
  readonly leaves: Leaf[] = [];
  open = 0;
  private blockR: THREE.Mesh;
  private blockL: THREE.Mesh;
  private shadow: THREE.Mesh;
  private shadowMat: THREE.MeshBasicMaterial;

  constructor(mats: BookMaterials) {
    const n = mats.pages.length / 2;
    for (let k = 0; k < n; k++) {
      const stiff = k === 0 || k === n - 1;
      const leaf = new Leaf({ index: k, stiff, front: mats.pages[2 * k], back: mats.pages[2 * k + 1], edge: mats.coverEdge });
      this.leaves.push(leaf);
      this.group.add(leaf.group);
    }
    // heights of each leaf in the right-hand (unread) and left-hand (read) stacks
    for (let k = 0; k < n; k++) {
      let below = 0;
      for (let j = k + 1; j < n; j++) below += this.leaves[j].thick;
      this.leaves[k].yRight = below + this.leaves[k].thick / 2;
      let under = 0;
      for (let j = 0; j < k; j++) under += this.leaves[j].thick;
      this.leaves[k].yLeft = under + this.leaves[k].thick / 2;
    }

    // solid paper blocks so the stacks show their page edges
    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    blockGeo.translate(0.5, 0.5, 0);
    this.blockR = new THREE.Mesh(blockGeo, mats.paperEdge);
    this.blockL = new THREE.Mesh(blockGeo, mats.paperEdge);
    for (const b of [this.blockR, this.blockL]) {
      // the edge faces sit edge-on to the lamp, where shadow maps alias into stripes
      b.castShadow = true;
      b.receiveShadow = false;
      this.group.add(b);
    }

    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      alphaMap: rectShadowTexture(COVER_W / COVER_H),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.001;
    this.shadow.renderOrder = 1;
    this.group.add(this.shadow);
    this.update(true);
  }

  update(force = false) {
    for (const leaf of this.leaves) leaf.update(this.open, force);

    // page blocks fill the stacks under the top couple of resting leaves, so their edges read as paper
    let restR = 0;
    let restL = 0;
    for (const leaf of this.leaves) {
      if (leaf.stiff) continue;
      if (leaf.theta < 0.02) restR++;
      else if (leaf.theta > Math.PI - 0.02) restL++;
    }
    const back = this.leaves[this.leaves.length - 1];
    const front = this.leaves[0];
    const inset = 0.006;
    const start = 0.16; // stay clear of the gutter, where the paper dips into the fold
    const rise = GUTTER_RISE * this.open;
    const setBlock = (b: THREE.Mesh, count: number, base: number, dir: number) => {
      const hh = (count - 2.2) * PAGE_T + rise;
      b.visible = count >= 3 && hh > 0.0005;
      b.scale.set(PAGE_W - inset - start, Math.max(hh, 0.0001), PAGE_H - inset * 2);
      b.position.set(dir > 0 ? start : -PAGE_W + inset, base, 0);
    };
    setBlock(this.blockR, restR, back.thick, 1);
    setBlock(this.blockL, restL, front.thick, -1);

    // soft shadow grows from one cover to the full spread
    const leftExtent = Math.max(0, -Math.cos(front.theta)) * COVER_W;
    const w = COVER_W + leftExtent;
    this.shadow.scale.set(w * 1.24, COVER_H * 1.38, 1);
    this.shadow.position.x = (COVER_W - leftExtent) / 2;
  }
}
