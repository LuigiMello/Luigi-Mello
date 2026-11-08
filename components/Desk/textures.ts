import * as THREE from 'three';

/* Small seeded RNG so procedural textures look the same on every load. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

export function canvasTexture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

let noiseCanvas: HTMLCanvasElement | null = null;
/** 256² grey noise tile, used for paper grain and print texture. */
export function noiseTile() {
  if (noiseCanvas) return noiseCanvas;
  const { c, ctx } = makeCanvas(256, 256);
  const img = ctx.createImageData(256, 256);
  const r = rng(7);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + r() * 145;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  noiseCanvas = c;
  return c;
}

/** Soft radial blob: white centre fading to black, used as an alphaMap for contact shadows. */
export function radialShadowTexture() {
  const { c, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgb(255,255,255)');
  g.addColorStop(0.35, 'rgb(190,190,190)');
  g.addColorStop(0.7, 'rgb(50,50,50)');
  g.addColorStop(1, 'rgb(0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return canvasTexture(c, false);
}

/** Blurred rectangle used as an alphaMap for the soft shadow under the magazine. */
export function rectShadowTexture(aspect: number) {
  const w = 512;
  const h = Math.round(w / aspect);
  const { c, ctx } = makeCanvas(w, h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const pad = Math.round(w * 0.12);
  // draw the rect far off-canvas and keep only its shadow (canvas filter isn't supported everywhere)
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = pad * 0.55;
  ctx.shadowOffsetX = 10000;
  ctx.fillStyle = '#fff';
  ctx.fillRect(pad - 10000, pad, w - pad * 2, h - pad * 2);
  ctx.shadowBlur = pad * 0.18;
  ctx.fillRect(pad - 10000, pad, w - pad * 2, h - pad * 2);
  return canvasTexture(c, false);
}

/** Cappuccino surface with a poured latte-art heart. */
export function latteTexture() {
  const S = 1024;
  const { c, ctx } = makeCanvas(S, S);
  const r = rng(42);
  const cx = S / 2;

  // crema
  const base = ctx.createRadialGradient(cx, cx * 0.98, S * 0.05, cx, cx, S * 0.5);
  base.addColorStop(0, '#a66a3c');
  base.addColorStop(0.55, '#8a522a');
  base.addColorStop(0.85, '#6a3a1a');
  base.addColorStop(1, '#3b1f0d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);

  // tiger-striping in the crema
  for (let i = 0; i < 900; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * S * 0.48;
    ctx.fillStyle = r() > 0.5 ? 'rgba(180,120,70,0.10)' : 'rgba(60,30,12,0.10)';
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, cx + Math.sin(a) * d, 4 + r() * 18, 2 + r() * 6, a + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // the heart: a few nested pours, each slightly smaller and offset
  const heart = (scale: number, oy: number) => {
    ctx.beginPath();
    const s = S * scale;
    const x = cx;
    const y = cx + oy * S;
    ctx.moveTo(x, y + s * 0.42);
    ctx.bezierCurveTo(x - s * 0.62, y + s * 0.02, x - s * 0.52, y - s * 0.48, x - s * 0.02, y - s * 0.22);
    ctx.bezierCurveTo(x - s * 0.01, y - s * 0.21, x + s * 0.01, y - s * 0.21, x + s * 0.02, y - s * 0.22);
    ctx.bezierCurveTo(x + s * 0.52, y - s * 0.48, x + s * 0.62, y + s * 0.02, x, y + s * 0.42);
    ctx.closePath();
  };
  ctx.save();
  ctx.shadowColor = 'rgba(245,232,214,0.9)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#f4e9da';
  heart(0.62, 0.02);
  ctx.fill();
  ctx.restore();
  // inner ripples of crema pulled through the foam
  ctx.strokeStyle = 'rgba(150,95,55,0.55)';
  ctx.lineWidth = 7;
  heart(0.44, 0.035);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,105,60,0.35)';
  ctx.lineWidth = 5;
  heart(0.28, 0.05);
  ctx.stroke();
  // the cut line through the heart's cleft
  ctx.strokeStyle = 'rgba(140,85,45,0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cx - S * 0.16);
  ctx.quadraticCurveTo(cx + 4, cx + S * 0.12, cx, cx + S * 0.3);
  ctx.stroke();

  // micro bubbles
  for (let i = 0; i < 2600; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * S * 0.5;
    ctx.fillStyle = `rgba(255,240,220,${0.04 + r() * 0.1})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cx + Math.sin(a) * d, 0.6 + r() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // darker meniscus ring at the cup wall
  const rim = ctx.createRadialGradient(cx, cx, S * 0.42, cx, cx, S * 0.5);
  rim.addColorStop(0, 'rgba(30,14,5,0)');
  rim.addColorStop(1, 'rgba(30,14,5,0.65)');
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, S, S);
  return canvasTexture(c);
}

/** Dark potting soil with a few pebbles. */
export function soilTexture() {
  const S = 256;
  const { c, ctx } = makeCanvas(S, S);
  const r = rng(11);
  ctx.fillStyle = '#1c140e';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1600; i++) {
    const v = 20 + r() * 50;
    ctx.fillStyle = `rgb(${v + 8},${v},${v - 6})`;
    ctx.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3);
  }
  for (let i = 0; i < 40; i++) {
    const v = 90 + r() * 80;
    ctx.fillStyle = `rgb(${v},${v - 6},${v - 14})`;
    ctx.beginPath();
    ctx.ellipse(r() * S, r() * S, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvasTexture(c);
}

/** Speckled stoneware glaze for the plant pot. */
export function stonewareTexture() {
  const S = 512;
  const { c, ctx } = makeCanvas(S, S);
  const r = rng(5);
  ctx.fillStyle = '#2b2c2f';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 5000; i++) {
    const v = r();
    ctx.fillStyle = v > 0.6 ? `rgba(200,200,205,${0.05 + r() * 0.12})` : `rgba(0,0,0,${0.1 + r() * 0.2})`;
    ctx.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2);
  }
  return canvasTexture(c);
}

const SANS = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

/** Draws the round "◐" brand mark used across the identity. */
export function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x + r * 0.42, y - r * 0.1, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + r * 0.42, y - r * 0.1, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Business card faces: a black one with the brand, a white one with contacts. */
export function cardTexture(kind: 'black' | 'white') {
  const W = 1050;
  const H = 600;
  const { c, ctx } = makeCanvas(W, H);
  const dark = kind === 'black';
  ctx.fillStyle = dark ? '#111113' : '#f2f1ed';
  ctx.fillRect(0, 0, W, H);
  // paper tooth
  ctx.globalAlpha = dark ? 0.05 : 0.07;
  ctx.globalCompositeOperation = dark ? 'screen' : 'multiply';
  ctx.fillStyle = ctx.createPattern(noiseTile(), 'repeat')!;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (dark) {
    drawMark(ctx, W / 2 - 170, H / 2, 30, '#ececec');
    ctx.fillStyle = '#ececec';
    ctx.font = `600 64px ${SANS}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('luigi mello', W / 2 - 122, H / 2 + 2);
  } else {
    ctx.fillStyle = '#141414';
    ctx.font = `600 46px ${SANS}`;
    ctx.fillText('Luigi Mello', 70, 120);
    ctx.fillStyle = '#6b6b70';
    ctx.font = `400 26px ${MONO}`;
    ctx.fillText('FULL-STACK DEVELOPER', 70, 168);
    ctx.fillStyle = '#2a2a2e';
    ctx.font = `400 27px ${MONO}`;
    ctx.fillText('luigileitenski@gmail.com', 70, 430);
    ctx.fillText('+55 41 99209-6564', 70, 474);
    ctx.fillText('@oluigilucio', 70, 518);
    drawMark(ctx, W - 110, 110, 34, '#141414');
  }
  return canvasTexture(c);
}

/** Steam is drawn in a shader; this is the noise it scrolls through. */
export function steamNoiseTexture() {
  const S = 128;
  const { c, ctx } = makeCanvas(S, S);
  const img = ctx.createImageData(S, S);
  const r = rng(3);
  // tileable value noise, a couple of octaves
  const grid = (n: number) => Array.from({ length: n * n }, () => r());
  const oct = [grid(8), grid(16), grid(32)];
  const sample = (g: number[], n: number, x: number, y: number) => {
    const fx = (x / S) * n;
    const fy = (y / S) * n;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const at = (a: number, b: number) => g[((b % n) + n) % n * n + (((a % n) + n) % n)];
    const top = at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx;
    const bot = at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx;
    return top * (1 - sy) + bot * sy;
  };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const v = sample(oct[0], 8, x, y) * 0.55 + sample(oct[1], 16, x, y) * 0.3 + sample(oct[2], 32, x, y) * 0.15;
      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = canvasTexture(c, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
