import {
  CHANNELS,
  EMAIL,
  PAGES,
  SECTIONS,
  SKILLS,
  translations,
  pageOf,
  spreadOfPage,
  type Lang,
  type PageSpec,
  type Project,
  type SectionKey,
  type UiCopy,
} from './content';
import { drawMark, makeCanvas, noiseTile, rng } from './textures';

/* Every page is designed on a 1280×800 artboard and scaled to the canvas. */
export const ART_W = 1280;
export const ART_H = 800;

const SANS = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';
const SERIF = '"Instrument Serif", Georgia, "Times New Roman", serif';
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

const PAPER = '#f2f1ec';
const INK = '#121214';
const NIGHT = '#0c0c0e';

export interface DrawContext {
  lang: Lang;
  ui: UiCopy;
  projects: Project[];
  img: (url: string) => HTMLImageElement | undefined;
  /** The clickable area currently under the pointer, drawn in its hover state. */
  hover?: { page: number; id: string } | null;
}

type C = CanvasRenderingContext2D;

/* ── clickable areas printed on the pages ─────────────────────────────
 * Each page registers its links while it is painted, in artboard pixels.
 * `goto` jumps to a spread, `href` opens a link. */

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  goto?: number;
  href?: string;
}

const HOTSPOTS = new Map<number, Hotspot[]>();

export function hotspotAt(page: number, ax: number, ay: number): Hotspot | null {
  return (HOTSPOTS.get(page) ?? []).find((h) => ax >= h.x && ax <= h.x + h.w && ay >= h.y && ay <= h.y + h.h) ?? null;
}

function addHot(page: number, h: Hotspot) {
  const list = HOTSPOTS.get(page) ?? [];
  list.push(h);
  HOTSPOTS.set(page, list);
}

const isHot = (d: DrawContext, page: number, id: string) => d.hover?.page === page && d.hover.id === id;

/* ── drawing helpers ───────────────────────────────────────────────── */

function spacing(ctx: C, px: number) {
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
}

function font(ctx: C, f: string, color: string, px = 0) {
  ctx.font = f;
  ctx.fillStyle = color;
  spacing(ctx, px);
}

function txt(ctx: C, s: string, x: number, y: number, align: CanvasTextAlign = 'left') {
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

function wrap(ctx: C, s: string, x: number, y: number, maxW: number, lh: number, maxLines = 99) {
  const words = s.split(/\s+/);
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      if (lines === maxLines - 1) {
        let cut = line;
        while (ctx.measureText(`${cut}…`).width > maxW && cut.length) cut = cut.slice(0, -1);
        ctx.fillText(`${cut.trimEnd()}…`, x, y);
        return y + lh;
      }
      ctx.fillText(line, x, y);
      y += lh;
      lines++;
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lh;
  }
  return y;
}

function breakLines(ctx: C, s: string, width: (line: number) => number) {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > width(lines.length) && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Sets paragraphs in columns like a magazine: lines run down one column and
 * continue at the top of the next. The first paragraph can open with a drop cap.
 */
function flow(
  ctx: C,
  paragraphs: string[],
  cols: { x: number; w: number }[],
  top: number,
  bottom: number,
  lh: number,
  gap: number,
  textFont: string,
  color: string,
  cap?: { font: string; color: string },
) {
  let col = 0;
  let y = top;
  paragraphs.forEach((para, pi) => {
    let text = para;
    let capW = 0;
    if (cap && pi === 0) {
      const letter = para[0];
      text = para.slice(1);
      ctx.font = cap.font;
      spacing(ctx, 0);
      capW = ctx.measureText(letter).width + 10;
      ctx.fillStyle = cap.color;
      ctx.fillText(letter, cols[0].x - 2, y + lh * 1.75);
    }
    font(ctx, textFont, color, 0);
    const lines = breakLines(ctx, text, (i) => cols[col].w - (pi === 0 && i < 3 ? capW : 0));
    lines.forEach((ln, i) => {
      if (y > bottom && col < cols.length - 1) {
        col++;
        y = top;
      }
      ctx.fillText(ln, cols[col].x + (pi === 0 && i < 3 ? capW : 0), y);
      y += lh;
    });
    y += gap;
  });
  return { col, y };
}

function fitFont(ctx: C, s: string, weight: string, family: string, start: number, maxW: number, min = 28) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(s).width > maxW && size > min) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function rr(ctx: C, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function coverImg(ctx: C, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, fx = 0.5, fy = 0.5) {
  if (!img || !img.naturalWidth) return;
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / s;
  const sh = h / s;
  const sx = (img.naturalWidth - sw) * fx;
  const sy = (img.naturalHeight - sh) * fy;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function lighten(hex: string, amt: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

/** Makes sure an accent is bright enough to read on a near-black page. */
function readable(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum < 0.45 ? lighten(hex, 0.45) : lighten(hex, 0.08);
}

const edgeCache = new WeakMap<HTMLImageElement, string>();
/** Colour of an image's corner, so a logo's own background can bleed to the page edges. */
function edgeColor(img: HTMLImageElement | undefined, fallback: string) {
  if (!img || !img.naturalWidth) return fallback;
  const hit = edgeCache.get(img);
  if (hit) return hit;
  const { ctx } = makeCanvas(1, 1);
  ctx.drawImage(img, 6, 6, 2, 2, 0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  const c = `rgb(${d[0]},${d[1]},${d[2]})`;
  edgeCache.set(img, c);
  return c;
}

function grain(ctx: C, dark: boolean) {
  ctx.save();
  ctx.globalAlpha = dark ? 0.045 : 0.075;
  ctx.globalCompositeOperation = dark ? 'screen' : 'multiply';
  ctx.fillStyle = ctx.createPattern(noiseTile(), 'repeat')!;
  ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.restore();
}

/** Shading where the paper curves into the spine. */
function gutter(ctx: C, spineLeft: boolean, dark: boolean) {
  const w = 120;
  const g = spineLeft ? ctx.createLinearGradient(0, 0, w, 0) : ctx.createLinearGradient(ART_W, 0, ART_W - w, 0);
  const a = dark ? 0.55 : 0.2;
  g.addColorStop(0, `rgba(0,0,0,${a})`);
  g.addColorStop(0.25, `rgba(0,0,0,${a * 0.4})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  if (spineLeft) ctx.fillRect(0, 0, w, ART_H);
  else ctx.fillRect(ART_W - w, 0, w, ART_H);
}

function folio(ctx: C, page: number, dark: boolean, ui: UiCopy, shadow = false) {
  const left = page % 2 === 1;
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
  }
  const c = dark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.62)';
  const sub = dark ? 'rgba(255,255,255,0.46)' : 'rgba(0,0,0,0.42)';
  const n = String(page).padStart(2, '0');
  font(ctx, `600 16px ${MONO}`, c, 1);
  if (left) {
    txt(ctx, n, 56, 768);
    font(ctx, `500 12px ${MONO}`, sub, 2);
    txt(ctx, ui.running, 104, 767);
  } else {
    txt(ctx, n, ART_W - 56, 768, 'right');
    font(ctx, `500 12px ${MONO}`, sub, 2);
    txt(ctx, ui.running, ART_W - 104, 767, 'right');
  }
  ctx.restore();
}

function hostOf(url: string) {
  try {
    return new URL(url).host + new URL(url).pathname.replace(/\/$/, '');
  } catch {
    return '';
  }
}

function pill(ctx: C, s: string, x: number, y: number, fg: string, border: string, fill?: string) {
  font(ctx, `500 14px ${MONO}`, fg, 0.3);
  const w = ctx.measureText(s).width + 28;
  rr(ctx, x, y - 22, w, 32, 16);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.fillStyle = fg;
  txt(ctx, s, x + 14, y);
  return w;
}

function availability(ctx: C, ui: UiCopy, xRight: number, y: number) {
  font(ctx, `500 14px ${MONO}`, '#f0f0f4', 0.4);
  const label = ui.available.toUpperCase();
  const w = ctx.measureText(label).width + 52;
  rr(ctx, xRight - w, y - 23, w, 34, 17);
  ctx.fillStyle = 'rgba(10,10,12,0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.stroke();
  ctx.fillStyle = '#3ddc84';
  ctx.beginPath();
  ctx.arc(xRight - w + 19, y - 6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0f0f4';
  txt(ctx, label, xRight - w + 34, y);
}

function browserFrame(ctx: C, img: HTMLImageElement | undefined, x: number, y: number, w: number, url: string, fx = 0.5, fy = 0, bg?: string) {
  const bar = 34;
  const h = w / 1.6 + bar;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.restore();
  ctx.save();
  rr(ctx, x, y, w, h, 14);
  ctx.clip();
  ctx.fillStyle = '#1d1d21';
  ctx.fillRect(x, y, w, bar);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + 20 + i * 18, y + bar / 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
  });
  rr(ctx, x + w / 2 - 150, y + 8, 300, bar - 16, 9);
  ctx.fillStyle = '#2a2a30';
  ctx.fill();
  font(ctx, `500 13px ${MONO}`, '#b4b4be', 0);
  txt(ctx, url || 'localhost', x + w / 2, y + bar / 2 + 4, 'center');
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y + bar, w, h - bar);
  }
  if (bg && img && img.naturalWidth) {
    // logos are fitted whole, centred on their own background colour
    const ih = h - bar;
    const sc = Math.min(w / img.naturalWidth, ih / img.naturalHeight) * 0.92;
    const dw = img.naturalWidth * sc;
    const dh = img.naturalHeight * sc;
    ctx.drawImage(img, x + (w - dw) / 2, y + bar + (ih - dh) / 2, dw, dh);
  } else {
    coverImg(ctx, img, x, y + bar, w, h - bar, fx, fy);
  }
  ctx.restore();
  rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 14);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
  return h;
}

/* ── pages ─────────────────────────────────────────────────────────── */

function drawCover(ctx: C, d: DrawContext, mask: boolean, back: boolean) {
  // mask mode paints a roughness (G) / metalness (B) map so the logo reads as silver foil
  if (mask) {
    ctx.fillStyle = 'rgb(0,150,0)';
    ctx.fillRect(0, 0, ART_W, ART_H);
  } else {
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, ART_W, ART_H);
    const g = ctx.createRadialGradient(640, 380, 40, 640, 400, 760);
    g.addColorStop(0, 'rgba(255,255,255,0.035)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ART_W, ART_H);
    grain(ctx, true);
  }
  const foil = mask ? 'rgb(0,55,255)' : '#e9e9ec';
  const size = back ? 0.45 : 1;
  ctx.save();
  ctx.translate(640, back ? 300 : 400);
  ctx.scale(size, size);
  font(ctx, `600 76px ${SANS}`, foil, -2);
  const label = d.ui.brand;
  const tw = ctx.measureText(label).width;
  const total = tw + 76;
  drawMark(ctx, -total / 2 + 26, -2, 26, foil);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = foil;
  txt(ctx, label, -total / 2 + 76, 2);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
  if (mask) return;

  if (!back) {
    font(ctx, `500 14px ${MONO}`, '#85858c', 5);
    txt(ctx, d.ui.edition.toUpperCase(), 640, 478, 'center');
    font(ctx, `400 12px ${MONO}`, '#56565c', 3);
    txt(ctx, 'VOL. 01', 60, 70);
    txt(ctx, 'Nº 2026', ART_W - 60, 70, 'right');
    txt(ctx, translations[d.lang].hero.roles[0].toUpperCase(), 60, 750);
    txt(ctx, '@OLUIGILUCIO', ART_W - 60, 750, 'right');
  } else {
    font(ctx, `400 13px ${MONO}`, '#6c6c72', 3);
    txt(ctx, d.ui.edition.toUpperCase(), 640, 360, 'center');
    // barcode block
    const bx = 960;
    const by = 560;
    ctx.fillStyle = '#f3f3f3';
    ctx.fillRect(bx, by, 250, 150);
    const r = rng(2026);
    let x = bx + 18;
    while (x < bx + 232) {
      const w = 1 + Math.floor(r() * 4);
      if (r() > 0.42) {
        ctx.fillStyle = '#0b0b0c';
        ctx.fillRect(x, by + 16, w, 96);
      }
      x += w + 1;
    }
    font(ctx, `500 13px ${MONO}`, '#0b0b0c', 2);
    txt(ctx, '9 772026 000017', bx + 125, by + 136, 'center');
    font(ctx, `400 12px ${MONO}`, '#6c6c72', 2);
    txt(ctx, d.ui.price.toUpperCase(), bx + 250, by - 18, 'right');
    txt(ctx, '© 2026 LUIGI MELLO', 60, 690);
  }
}

function drawContents(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, ART_W, ART_H);

  drawMark(ctx, 76, 72, 12, INK);
  font(ctx, `600 24px ${SANS}`, INK, -0.4);
  txt(ctx, ui.brand, 100, 80);
  font(ctx, `500 14px ${MONO}`, '#6f6f68', 2);
  txt(ctx, ui.edition.toUpperCase(), ART_W - 110, 79, 'right');

  font(ctx, `300 112px ${SANS}`, INK, -4);
  txt(ctx, ui.contentsTitle, 60, 250);
  font(ctx, `400 24px ${SANS}`, '#33332e', 0);
  wrap(ctx, ui.contentsIntro, 66, 314, 350, 34);
  font(ctx, `500 14px ${MONO}`, '#6f6f68', 1);
  wrap(ctx, `↳ ${ui.contentsHint.toUpperCase()}`, 66, 676, 340, 22, 2);

  const entry = (x: number, y: number, n: number, title: string, id: string) => {
    const hot = isHot(d, page, id);
    if (hot) {
      rr(ctx, x - 12, y - 31, 352, 46, 8);
      ctx.fillStyle = 'rgba(20,24,60,0.08)';
      ctx.fill();
    }
    font(ctx, `500 16px ${MONO}`, hot ? '#3446c9' : '#85857d', 0);
    txt(ctx, String(n).padStart(2, '0'), x, y);
    font(ctx, `500 25px ${SANS}`, hot ? '#3446c9' : INK, -0.4);
    txt(ctx, title, x + 46, y);
    font(ctx, `400 20px ${SANS}`, hot ? '#3446c9' : 'rgba(0,0,0,0.3)', 0);
    txt(ctx, '→', x + 328, y, 'right');
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, y + 18, 330, 1);
    addHot(page, { id, x: x - 12, y: y - 33, w: 352, h: 50, goto: spreadOfPage(n) });
  };
  const label = (x: number, y: number, s: string) => {
    font(ctx, `600 14px ${MONO}`, '#6f6f68', 2.5);
    txt(ctx, s.toUpperCase(), x, y);
  };

  const colA = 470;
  const colB = 860;
  let y = 160;
  label(colA, y, ui.groups.editorial);
  y += 54;
  entry(colA, y, pageOf('letter'), ui.letterKicker, 'letter');
  y += 52;
  entry(colA, y, pageOf('divider', 'about'), ui.sections.about, 'about');
  y += 72;
  label(colA, y, ui.groups.work);
  y += 54;
  entry(colA, y, pageOf('grid'), ui.gridKicker, 'grid');
  y += 52;
  d.projects.slice(0, 4).forEach((p, i) => {
    entry(colA, y, pageOf('shot', i), p.name, `p${i}`);
    y += 52;
  });
  y = 214;
  d.projects.slice(4).forEach((p, i) => {
    entry(colB, y, pageOf('shot', i + 4), p.name, `p${i + 4}`);
    y += 52;
  });
  y += 20;
  label(colB, y, ui.groups.end);
  y += 54;
  entry(colB, y, pageOf('divider', 'skills'), ui.sections.skills, 'skills');
  y += 52;
  entry(colB, y, pageOf('divider', 'services'), ui.sections.services, 'services');
  y += 52;
  entry(colB, y, pageOf('divider', 'contact'), ui.sections.contact, 'contact');

  grain(ctx, false);
  gutter(ctx, page % 2 === 0, false);
  folio(ctx, page, false, ui);
}

/** Editor's letter: a short welcome, set in two columns, signed. */
function drawLetter(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  const tr = translations[d.lang];
  const m = page % 2 === 0 ? 108 : 76;
  ctx.fillStyle = '#efede6';
  ctx.fillRect(0, 0, ART_W, ART_H);

  font(ctx, `600 15px ${MONO}`, '#6f6f68', 3);
  txt(ctx, ui.letterKicker.toUpperCase(), m, 100);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(m, 118, 40, 1.5);
  font(ctx, `italic 400 70px ${SERIF}`, INK, -0.5);
  wrap(ctx, ui.letterTitle, m - 2, 200, 640, 70, 2);

  // portrait in a round frame, top right
  const img = d.img('/avatar.jpg');
  ctx.save();
  ctx.beginPath();
  ctx.arc(1110, 168, 80, 0, Math.PI * 2);
  ctx.clip();
  coverImg(ctx, img, 1030, 88, 160, 160, 0.5, 0.18);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(1110, 168, 88, 0, Math.PI * 2);
  ctx.stroke();

  const paragraphs = [tr.hero.description, ui.letterBody[0], ui.letterBody[1]];
  const end = flow(
    ctx,
    paragraphs,
    [
      { x: m, w: 510 },
      { x: m + 556, w: 510 },
    ],
    350,
    630,
    39,
    18,
    `400 26px Georgia, "Times New Roman", serif`,
    '#1a1a18',
    { font: `400 124px ${SERIF}`, color: INK },
  );
  const sx = m + 556;
  const sy = end.col === 0 ? 560 : Math.max(end.y + 12, 600);
  font(ctx, `italic 400 26px ${SERIF}`, '#45453f', 0);
  txt(ctx, ui.signoff, sx, sy);
  font(ctx, `italic 400 58px ${SERIF}`, INK, 0);
  txt(ctx, 'Luigi Mello', sx, sy + 60);

  grain(ctx, false);
  gutter(ctx, page % 2 === 0, false);
  folio(ctx, page, false, ui);
}

function drawAboutCover(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  const tr = translations[d.lang];
  const m = page % 2 === 0 ? 108 : 76;
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, ART_W, ART_H);
  coverImg(ctx, d.img('/avatar.jpg'), 560, 0, 720, ART_H, 0.5, 0.2);
  const g = ctx.createLinearGradient(560, 0, 880, 0);
  g.addColorStop(0, NIGHT);
  g.addColorStop(1, 'rgba(12,12,14,0)');
  ctx.fillStyle = g;
  ctx.fillRect(559, 0, 322, ART_H);
  const gb = ctx.createLinearGradient(0, ART_H, 0, ART_H - 240);
  gb.addColorStop(0, 'rgba(12,12,14,0.9)');
  gb.addColorStop(1, 'rgba(12,12,14,0)');
  ctx.fillStyle = gb;
  ctx.fillRect(560, ART_H - 240, 720, 240);

  font(ctx, `600 15px ${MONO}`, '#a6a6b2', 3);
  txt(ctx, ui.aboutLabel.toUpperCase(), m, 104);
  font(ctx, `italic 400 46px ${SERIF}`, '#c9d0ff', 0);
  txt(ctx, ui.hello, m, 196);
  font(ctx, `700 138px ${SANS}`, '#f4f4f6', -6);
  txt(ctx, 'Luigi', m - 8, 318);
  txt(ctx, 'Mello', m - 8, 438);
  font(ctx, `italic 400 27px ${SERIF}`, '#e3e5f2', 0);
  wrap(ctx, tr.hero.description, m, 494, 450, 32, 4);

  let x = m;
  let y = 650;
  for (const role of tr.hero.roles.slice(0, 3)) {
    font(ctx, `500 14px ${MONO}`, '#e2e2e8', 0.3);
    const w = ctx.measureText(role).width + 28;
    if (x + w > m + 470) {
      x = m;
      y += 42;
    }
    x += pill(ctx, role, x, y, '#e2e2e8', 'rgba(255,255,255,0.3)') + 8;
  }

  availability(ctx, ui, ART_W - 54, 76);
  grain(ctx, true);
  gutter(ctx, page % 2 === 0, true);
  folio(ctx, page, true, ui);
}

/** About, part 2: the profile in columns with a pull quote. */
function drawProfile(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  const tr = translations[d.lang];
  const m = page % 2 === 0 ? 108 : 76;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, ART_W, ART_H);

  font(ctx, `600 15px ${MONO}`, '#6f6f68', 3);
  txt(ctx, `${ui.profileKicker.toUpperCase()} · ${tr.about.subtitle.toUpperCase()}`, m, 100);
  font(ctx, `300 66px ${SANS}`, INK, -2.5);
  txt(ctx, ui.profileTitle[0], m - 3, 200);
  const w0 = ctx.measureText(`${ui.profileTitle[0]} `).width;
  font(ctx, `italic 400 78px ${SERIF}`, INK, -0.5);
  txt(ctx, ui.profileTitle[1], m - 3 + w0, 200);

  // English proficiency is covered in the fact sheet and the skills page
  flow(
    ctx,
    [tr.about.p1, tr.about.p2],
    [
      { x: m, w: 392 },
      { x: m + 424, w: 392 },
    ],
    292,
    700,
    36,
    18,
    `400 24px ${SANS}`,
    '#1c1c1a',
    { font: `400 116px ${SERIF}`, color: INK },
  );

  // pull quote
  const qx = m + 856;
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(qx - 24, 268, 1, 440);
  font(ctx, `italic 400 120px ${SERIF}`, '#3446c9', 0);
  txt(ctx, '“', qx - 6, 362);
  font(ctx, `italic 400 34px ${SERIF}`, INK, -0.3);
  const end = wrap(ctx, ui.quote, qx, 392, 248, 40, 8);
  font(ctx, `600 15px ${MONO}`, '#6f6f68', 2);
  txt(ctx, 'LUIGI MELLO', qx, end + 16);

  grain(ctx, false);
  gutter(ctx, page % 2 === 0, false);
  folio(ctx, page, false, ui);
}

/** About, part 3: fact sheet, numbers and the illustrated editor. */
function drawFacts(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  const tr = translations[d.lang];
  const m = page % 2 === 0 ? 108 : 76;
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, ART_W, ART_H);
  const glow = ctx.createRadialGradient(1000, 300, 20, 1000, 300, 520);
  glow.addColorStop(0, 'rgba(120,140,255,0.12)');
  glow.addColorStop(1, 'rgba(120,140,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, ART_W, ART_H);

  font(ctx, `600 15px ${MONO}`, '#a6a6b2', 3);
  txt(ctx, `${ui.sections.about.toUpperCase()} · 03`, m, 100);
  font(ctx, `300 62px ${SANS}`, '#f6f6f8', -2.5);
  txt(ctx, ui.factsTitle, m - 3, 180);

  let y = 254;
  for (const [k, v] of ui.facts) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(m, y - 32, 640, 1);
    font(ctx, `600 13px ${MONO}`, '#a6a6b2', 2);
    txt(ctx, k.toUpperCase(), m, y);
    const size = fitFont(ctx, v, '500', SANS, 23, 485, 19);
    font(ctx, `500 ${size}px ${SANS}`, '#f4f4f7', -0.2);
    txt(ctx, v, m + 168, y + 1);
    y += 52;
  }

  // the cartoon editor
  const cx = 1012;
  const cy = 262;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 126, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#f6ece6';
  ctx.fillRect(cx - 128, cy - 128, 256, 256);
  coverImg(ctx, d.img('/mello.jpg'), cx - 128, cy - 128, 256, 256, 0.5, 0.1);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 138, 0, Math.PI * 2);
  ctx.stroke();
  font(ctx, `italic 400 25px ${SERIF}`, '#c4c4cd', 0);
  txt(ctx, ui.illustration, cx, cy + 180, 'center');

  font(ctx, `600 15px ${MONO}`, '#a6a6b2', 3);
  txt(ctx, ui.numbersTitle.toUpperCase(), 812, 548);
  const stats: [string, string][] = [
    ['10+', tr.about.stats.projects],
    ['10+', tr.about.stats.technologies],
    ['5', tr.about.stats.aiTools],
  ];
  stats.forEach(([n, l], i) => {
    const x = 812 + i * 140;
    font(ctx, `600 62px ${SANS}`, '#f6f6f8', -2);
    txt(ctx, n, x, 630);
    fitFont(ctx, l.toUpperCase(), '500', MONO, 13, 128, 9);
    ctx.fillStyle = '#a6a6b2';
    spacing(ctx, 1);
    txt(ctx, l.toUpperCase(), x + 2, 662);
  });

  grain(ctx, true);
  gutter(ctx, page % 2 === 0, true);
  folio(ctx, page, true, ui);
}

/** Project index: every project as a square tile that jumps to its feature. */
function drawGrid(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  const right = page % 2 === 0;
  const m = right ? 108 : 64;
  const width = ART_W - m - (right ? 56 : 108);
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, ART_W, ART_H);

  font(ctx, `600 15px ${MONO}`, '#a6a6b2', 3);
  txt(ctx, `${ui.gridKicker.toUpperCase()} · ${String(d.projects.length).padStart(2, '0')}`, m, 92);
  font(ctx, `300 50px ${SANS}`, '#f4f4f6', -2);
  txt(ctx, ui.gridTitle[0], m - 2, 152);
  const w0 = ctx.measureText(`${ui.gridTitle[0]} `).width;
  font(ctx, `italic 400 58px ${SERIF}`, '#c9d0ff', 0);
  txt(ctx, ui.gridTitle[1], m - 2 + w0, 152);
  font(ctx, `600 13px ${MONO}`, '#b4b4be', 1.5);
  txt(ctx, `${ui.gridHint.toUpperCase()} →`, m + width, 148, 'right');

  const cols = 4;
  const gap = 16;
  const size = (width - gap * (cols - 1)) / cols;
  const top = 184;
  d.projects.forEach((p, i) => {
    const x = m + (i % cols) * (size + gap);
    const y = top + Math.floor(i / cols) * (size + gap);
    const id = `p${i}`;
    const hot = isHot(d, page, id);
    const accent = readable(p.color);

    ctx.save();
    rr(ctx, x, y, size, size, 12);
    ctx.clip();
    if (p.shots[0]) {
      ctx.fillStyle = NIGHT;
      ctx.fillRect(x, y, size, size);
      const zoom = hot ? 1.06 : 1;
      const zs = size * zoom;
      coverImg(ctx, d.img(p.shots[0]), x - (zs - size) / 2, y - (zs - size) / 2, zs, zs, 0.1, 0);
    } else {
      const logo = p.logo ? d.img(p.logo) : undefined;
      ctx.fillStyle = edgeColor(logo, p.bg ?? p.color);
      ctx.fillRect(x, y, size, size);
      if (logo) {
        const ls = size * (hot ? 0.86 : 0.8);
        ctx.drawImage(logo, x + (size - ls) / 2, y + (size - ls) / 2 - 14, ls, ls);
      }
    }
    if (hot) {
      ctx.fillStyle = `${p.color}26`;
      ctx.fillRect(x, y, size, size);
    }
    const shade = ctx.createLinearGradient(0, y + size * 0.42, 0, y + size);
    shade.addColorStop(0, 'rgba(6,6,8,0)');
    shade.addColorStop(1, 'rgba(6,6,8,0.94)');
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, size, size);
    rr(ctx, x + 12, y + 12, 46, 28, 14);
    ctx.fillStyle = 'rgba(10,10,12,0.78)';
    ctx.fill();
    font(ctx, `600 14px ${MONO}`, '#f4f4f7', 0.5);
    txt(ctx, String(i + 1).padStart(2, '0'), x + 35, y + 31, 'center');
    const ns = fitFont(ctx, p.name, '600', SANS, 27, size - 32, 18);
    font(ctx, `600 ${ns}px ${SANS}`, '#ffffff', -0.6);
    txt(ctx, p.name, x + 16, y + size - 44);
    fitFont(ctx, p.category.toUpperCase(), '600', MONO, 13, size - 32, 9);
    ctx.fillStyle = hot ? accent : '#cfcfd8';
    spacing(ctx, 0.6);
    txt(ctx, p.category.toUpperCase(), x + 16, y + size - 18);
    if (hot) {
      font(ctx, `700 13px ${MONO}`, '#0b0b0e', 1);
      const label = `${ui.seeMore.toUpperCase()} →`;
      const lw = ctx.measureText(label).width + 24;
      rr(ctx, x + size - lw - 12, y + 12, lw, 28, 14);
      ctx.fillStyle = '#f4f5ff';
      ctx.fill();
      ctx.fillStyle = '#0b0b0e';
      txt(ctx, label, x + size - lw, y + 31);
    }
    ctx.restore();
    rr(ctx, x + 0.5, y + 0.5, size - 1, size - 1, 12);
    ctx.strokeStyle = hot ? accent : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = hot ? 2.5 : 1;
    ctx.stroke();
    addHot(page, { id, x, y, w: size, h: size, goto: spreadOfPage(pageOf('shot', i)) });
  });

  grain(ctx, true);
  gutter(ctx, right, true);
  folio(ctx, page, true, ui);
}

function drawShot(ctx: C, d: DrawContext, page: number, i: number) {
  const p = d.projects[i];
  const shot = p.shots[0];
  if (shot) {
    ctx.fillStyle = NIGHT;
    ctx.fillRect(0, 0, ART_W, ART_H);
    coverImg(ctx, d.img(shot), 0, 0, ART_W, ART_H, 0.5, 0);
  } else {
    const logo = p.logo ? d.img(p.logo) : undefined;
    ctx.fillStyle = edgeColor(logo, p.bg ?? p.color);
    ctx.fillRect(0, 0, ART_W, ART_H);
    if (logo) coverImg(ctx, logo, 640 - 330, 400 - 330, 660, 660);
  }
  // a light varnish so the print doesn't read as a flat screen
  const v = ctx.createLinearGradient(0, 0, 0, ART_H);
  v.addColorStop(0, 'rgba(255,255,255,0.03)');
  v.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, ART_W, ART_H);
  const cap = `${String(i + 1).padStart(2, '0')} · ${p.name.toUpperCase()} · ${p.category.toUpperCase()}`;
  font(ctx, `600 14px ${MONO}`, '#f4f4f7', 1.2);
  const cw = ctx.measureText(cap).width + 36;
  const cx = page % 2 === 1 ? 52 : ART_W - 52 - cw;
  rr(ctx, cx, 678, cw, 38, 19);
  ctx.fillStyle = 'rgba(10,10,12,0.74)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.stroke();
  ctx.fillStyle = '#f4f4f7';
  txt(ctx, cap, cx + 18, 702);
  grain(ctx, true);
  gutter(ctx, page % 2 === 0, false);
  folio(ctx, page, true, d.ui, true);
}

function drawFeature(ctx: C, d: DrawContext, page: number, i: number) {
  const { ui } = d;
  const p = d.projects[i];
  const accent = readable(p.color);
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, ART_W, ART_H);
  // coloured light spill behind the screenshot
  const glow = ctx.createRadialGradient(920, 360, 20, 920, 380, 620);
  glow.addColorStop(0, `${p.color}40`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, ART_W, ART_H);

  // oversized outline numeral
  ctx.save();
  ctx.font = `700 400px ${SANS}`;
  spacing(ctx, -20);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  ctx.textAlign = 'right';
  ctx.strokeText(String(i + 1).padStart(2, '0'), ART_W - 30, ART_H + 70);
  ctx.restore();

  const x = 92;
  const kicker = `${ui.projectLabel.toUpperCase()} ${String(i + 1).padStart(2, '0')} / ${String(d.projects.length).padStart(2, '0')} · ${p.category.toUpperCase()}`;
  fitFont(ctx, kicker, '600', MONO, 15, 520, 11);
  ctx.fillStyle = accent;
  spacing(ctx, 1.5);
  txt(ctx, kicker, x, 104);
  ctx.fillRect(x, 124, 40, 2);

  const backHot = isHot(d, page, 'index');
  font(ctx, `600 14px ${MONO}`, backHot ? '#ffffff' : '#b4b4be', 1.5);
  const back = ui.backToIndex.toUpperCase();
  const bw = ctx.measureText(back).width;
  txt(ctx, back, ART_W - 64, 104, 'right');
  if (backHot) ctx.fillRect(ART_W - 64 - bw, 111, bw, 1.5);
  addHot(page, { id: 'index', x: ART_W - 64 - bw - 10, y: 80, w: bw + 20, h: 38, goto: spreadOfPage(pageOf('grid')) });

  const title = p.name.toUpperCase();
  const size = fitFont(ctx, title, '700', SANS, 88, 480);
  font(ctx, `700 ${size}px ${SANS}`, '#f7f7f9', -size * 0.04);
  txt(ctx, title, x - 4, 140 + size * 0.8);
  let y = 140 + size * 0.8 + 58;
  font(ctx, `italic 400 38px ${SERIF}`, accent, 0);
  y = wrap(ctx, p.tagline, x, y, 490, 42, 2) + 14;
  font(ctx, `400 21px ${SANS}`, '#d2d2d9', 0);
  wrap(ctx, p.description, x, y, 480, 30, 8);

  let tx = x;
  let ty = 674;
  for (const tag of p.tags) {
    font(ctx, `500 14px ${MONO}`, '#e2e2e8', 0.3);
    const w = ctx.measureText(tag).width + 28;
    if (tx + w > x + 490) {
      tx = x;
      ty -= 42;
    }
    tx += pill(ctx, tag, tx, ty, '#e2e2e8', 'rgba(255,255,255,0.3)') + 8;
  }

  const live = p.demo && p.demo !== '#';
  const urlHot = isHot(d, page, 'url');
  font(ctx, `600 17px ${MONO}`, live ? (urlHot ? '#ffffff' : accent) : '#9a9aa4', 0.3);
  const urlText = live ? `↗ ${hostOf(p.demo)}` : ui.privateBuild;
  const uw = ctx.measureText(urlText).width;
  txt(ctx, urlText, x, 728);
  if (live) {
    if (urlHot) ctx.fillRect(x, 735, uw, 1.5);
    addHot(page, { id: 'url', x: x - 8, y: 704, w: uw + 16, h: 36, href: p.demo });
  }
  if (p.github && p.github !== '#') {
    const ghHot = isHot(d, page, 'gh');
    font(ctx, `600 17px ${MONO}`, ghHot ? '#ffffff' : '#b4b4be', 0.3);
    const gx = x + uw + 28;
    const gw = ctx.measureText(ui.githubLink).width;
    txt(ctx, ui.githubLink, gx, 728);
    if (ghHot) ctx.fillRect(gx, 735, gw, 1.5);
    addHot(page, { id: 'gh', x: gx - 8, y: 704, w: gw + 16, h: 36, href: p.github });
  }

  const second = p.shots[1] ?? p.shots[0];
  const img = second ? d.img(second) : p.logo ? d.img(p.logo) : undefined;
  const fx = 624;
  const fw = 586;
  const h = browserFrame(ctx, img, fx, 172, fw, live ? hostOf(p.demo) : p.name.toLowerCase(), second && !p.shots[1] ? 1 : 0.5, 0, second ? undefined : edgeColor(img, p.bg ?? NIGHT));
  if (live) addHot(page, { id: 'url', x: fx, y: 172, w: fw, h, href: p.demo });
  font(ctx, `500 14px ${MONO}`, '#a6a6b2', 1);
  txt(ctx, `FIG. ${String(i + 1).padStart(2, '0')} · ${p.name}`, fx, 172 + h + 38);

  grain(ctx, true);
  gutter(ctx, page % 2 === 0, true);
  folio(ctx, page, true, ui);
}

function drawSkills(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  const tr = translations[d.lang];
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.save();
  ctx.translate(page % 2 === 0 ? 26 : 0, 0);
  font(ctx, `600 14px ${MONO}`, '#6f6f68', 2.5);
  txt(ctx, `${tr.skills.title.toUpperCase()} · ${tr.skills.subtitle.toUpperCase()}`, 70, 96);
  // keep the heading inside its column, whatever the language
  const t0 = fitFont(ctx, ui.skillsTitle[0], '300', SANS, 92, 360, 40);
  font(ctx, `300 ${t0}px ${SANS}`, INK, -t0 * 0.045);
  txt(ctx, ui.skillsTitle[0], 64, 214);
  const t1 = fitFont(ctx, ui.skillsTitle[1], 'italic 400', SERIF, 104, 370, 40);
  font(ctx, `italic 400 ${t1}px ${SERIF}`, INK, -1);
  txt(ctx, ui.skillsTitle[1], 66, 214 + t1 * 0.88);
  font(ctx, `400 22px ${SANS}`, '#33332e', 0);
  wrap(ctx, ui.skillsIntro, 70, 372, 340, 31);

  font(ctx, `600 14px ${MONO}`, '#6f6f68', 2.5);
  txt(ctx, ui.beyond.label.toUpperCase(), 70, 512);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(70, 528, 340, 1);
  // wrap long items onto a second line rather than shrinking them
  let by = 568;
  ui.beyond.items.forEach((item, i) => {
    font(ctx, `500 15px ${MONO}`, '#85857d', 0);
    txt(ctx, String(i + 1).padStart(2, '0'), 70, by);
    font(ctx, `500 21px ${SANS}`, INK, -0.2);
    by = wrap(ctx, item, 110, by, 320, 27, 2) + 12;
  });

  SKILLS.forEach((group, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 476 + col * 372;
    const y = 96 + row * 226;
    font(ctx, `600 14px ${MONO}`, '#6f6f68', 2);
    txt(ctx, tr.skills.categories[group.cat].toUpperCase(), x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(x, y + 16, 330, 1);
    font(ctx, `500 25px ${SANS}`, INK, -0.4);
    group.items.slice(0, 6).forEach((s, j) => {
      txt(ctx, s, x + (j % 2) * 168, y + 60 + Math.floor(j / 2) * 42);
    });
  });
  ctx.restore();
  grain(ctx, false);
  gutter(ctx, page % 2 === 0, false);
  folio(ctx, page, false, ui);
}

function drawServices(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  const tr = translations[d.lang];
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, ART_W, ART_H);
  font(ctx, `600 14px ${MONO}`, '#a6a6b2', 2.5);
  txt(ctx, `${tr.services.title.toUpperCase()} · ${tr.services.subtitle.toUpperCase()}`, 92, 96);
  font(ctx, `300 70px ${SANS}`, '#f6f6f8', -3);
  txt(ctx, ui.servicesTitle[0], 88, 184);
  const w0 = ctx.measureText(`${ui.servicesTitle[0]} `).width;
  font(ctx, `italic 400 80px ${SERIF}`, '#cdd4ff', 0);
  txt(ctx, ui.servicesTitle[1], 88 + w0, 184);
  availability(ctx, ui, ART_W - 60, 96);

  const colW = 372;
  tr.services.items.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 92 + col * colW;
    const y = 290 + row * 236;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, y - 34, colW - 36, 1);
    font(ctx, `600 15px ${MONO}`, readable(s.color), 1);
    txt(ctx, String(i + 1).padStart(2, '0'), x, y);
    const ts = fitFont(ctx, s.title, '600', SANS, 26, colW - 44, 18);
    font(ctx, `600 ${ts}px ${SANS}`, '#f6f6f8', -0.5);
    txt(ctx, s.title, x, y + 40);
    font(ctx, `400 20px ${SANS}`, '#cfcfd7', 0);
    wrap(ctx, s.description, x, y + 76, colW - 44, 28, 5);
  });
  grain(ctx, true);
  gutter(ctx, page % 2 === 0, true);
  folio(ctx, page, true, ui);
}

function drawContact(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  const bg = ctx.createLinearGradient(0, 0, ART_W, ART_H);
  bg.addColorStop(0, '#05060f');
  bg.addColorStop(1, '#0d1650');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, ART_W, ART_H);
  const glow = ctx.createRadialGradient(260, 820, 40, 260, 820, 700);
  glow.addColorStop(0, 'rgba(56,86,255,0.55)');
  glow.addColorStop(1, 'rgba(56,86,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, ART_W, ART_H);
  const ox = page % 2 === 0 ? 30 : 0;
  ctx.save();
  ctx.translate(ox, 0);

  font(ctx, `700 112px ${SANS}`, '#f6f7ff', -5);
  txt(ctx, ui.contactTitle[0], 62, 164);
  txt(ctx, ui.contactTitle[1], 62, 272);
  font(ctx, `italic 400 126px ${SERIF}`, '#bcc4ff', -1);
  txt(ctx, ui.contactTitle[2], 66, 380);
  font(ctx, `400 22px ${SANS}`, '#d0d4ee', 0);
  wrap(ctx, ui.contactIntro, 70, 440, 560, 30, 2);

  let y = 540;
  CHANNELS.forEach((c) => {
    const hot = isHot(d, page, c.key);
    if (hot) {
      ctx.fillStyle = 'rgba(180,189,255,0.12)';
      ctx.fillRect(58, y - 31, 664, 46);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(70, y - 31, 640, 1);
    font(ctx, `600 14px ${MONO}`, hot ? '#eef0ff' : '#b0b7e6', 2);
    txt(ctx, c.label.toUpperCase(), 70, y);
    font(ctx, `500 24px ${SANS}`, '#f6f7ff', -0.3);
    txt(ctx, c.handle, 236, y + 1);
    font(ctx, `400 21px ${SANS}`, hot ? '#ffffff' : '#b0b7e6', 0);
    txt(ctx, '↗', 706, y + 1, 'right');
    addHot(page, { id: c.key, x: 58 + ox, y: y - 31, w: 664, h: 46, href: c.href });
    y += 46;
  });

  // rubber stamp
  ctx.save();
  ctx.translate(1000, 560);
  ctx.rotate(-0.22);
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#bcc4ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 128, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 112, 0, Math.PI * 2);
  ctx.stroke();
  font(ctx, `800 34px ${SANS}`, '#bcc4ff', 2);
  txt(ctx, ui.warranty[0], 0, -6, 'center');
  txt(ctx, ui.warranty[1], 0, 32, 'center');
  font(ctx, `600 13px ${MONO}`, '#bcc4ff', 2.5);
  txt(ctx, '★ LUIGI MELLO · 2026 ★', 0, 70, 'center');
  ctx.restore();

  ctx.restore();
  grain(ctx, true);
  gutter(ctx, page % 2 === 0, true);
  folio(ctx, page, true, ui);
}

/** Section opener: a page that carries nothing but the section's title. */
function drawDivider(ctx: C, d: DrawContext, page: number, section: SectionKey) {
  const { ui } = d;
  const right = page % 2 === 0;
  const m = right ? 108 : 76;
  ctx.fillStyle = '#0b0b0d';
  ctx.fillRect(0, 0, ART_W, ART_H);
  const glow = ctx.createRadialGradient(right ? 260 : 1020, 860, 30, right ? 260 : 1020, 860, 760);
  glow.addColorStop(0, 'rgba(120,140,255,0.17)');
  glow.addColorStop(1, 'rgba(120,140,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, ART_W, ART_H);

  const n = String(SECTIONS.indexOf(section) + 1).padStart(2, '0');
  font(ctx, `600 15px ${MONO}`, 'rgba(255,255,255,0.6)', 3);
  txt(ctx, `${n} · ${ui.sectionWord.toUpperCase()}`, m, 104);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(m, 124, 40, 1.5);

  // big title: first word in the grotesque, the rest in serif italic underneath
  const words = ui.sections[section].split(' ');
  const head = words[0];
  const tail = words.slice(1).join(' ');
  const maxW = ART_W - m - 90;
  const size = Math.min(
    fitFont(ctx, head, '600', SANS, 230, maxW, 90),
    tail ? fitFont(ctx, tail, 'italic 400', SERIF, 250, maxW, 90) / 1.08 : 999,
  );
  const base = 650;
  const top = tail ? base - size * 2.05 : base - size * 0.95;
  const g = ctx.createLinearGradient(0, top, 0, base + size * 0.15);
  g.addColorStop(0, '#f7f8ff');
  g.addColorStop(1, '#aebdff');
  if (tail) {
    font(ctx, `600 ${size}px ${SANS}`, g as unknown as string, -size * 0.055);
    ctx.fillStyle = g;
    txt(ctx, head, m - size * 0.04, base - size * 1.02);
    font(ctx, `italic 400 ${size * 1.08}px ${SERIF}`, '#c9d0ff', -size * 0.01);
    txt(ctx, tail, m, base);
  } else {
    ctx.font = `600 ${size}px ${SANS}`;
    spacing(ctx, -size * 0.055);
    ctx.fillStyle = g;
    txt(ctx, head, m - size * 0.04, base);
  }

  grain(ctx, true);
  gutter(ctx, right, true);
  folio(ctx, page, true, ui);
}

function drawThanks(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 0, ART_W, ART_H);
  const img = d.img('/mello.jpg');
  ctx.save();
  ctx.beginPath();
  ctx.arc(640, 300, 150, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#f6ece6';
  ctx.fillRect(490, 150, 300, 300);
  coverImg(ctx, img, 490, 150, 300, 300, 0.5, 0.12);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(640, 300, 162, 0, Math.PI * 2);
  ctx.stroke();
  font(ctx, `italic 400 74px ${SERIF}`, '#f2f2f4', 0);
  txt(ctx, ui.thanks, 640, 552, 'center');
  font(ctx, `400 23px ${SANS}`, '#b4b4be', 0);
  txt(ctx, ui.thanksSub, 640, 596, 'center');
  const hot = isHot(d, page, 'mail');
  const cta = `${ui.thanksCta}  ${EMAIL}  ↗`;
  font(ctx, `600 15px ${MONO}`, hot ? '#0b0b0e' : '#eef0ff', 0.6);
  const cw = ctx.measureText(cta).width + 44;
  rr(ctx, 640 - cw / 2, 630, cw, 46, 23);
  ctx.fillStyle = hot ? '#e8ebff' : 'rgba(255,255,255,0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,235,255,0.4)';
  ctx.stroke();
  ctx.fillStyle = hot ? '#0b0b0e' : '#e8ebff';
  txt(ctx, cta, 640, 659, 'center');
  addHot(page, { id: 'mail', x: 640 - cw / 2, y: 630, w: cw, h: 46, href: `mailto:${EMAIL}` });
  grain(ctx, true);
  gutter(ctx, page % 2 === 0, true);
  folio(ctx, page, true, ui);
}

function drawInsideBack(ctx: C, d: DrawContext, page: number) {
  const { ui } = d;
  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 0, ART_W, ART_H);
  font(ctx, `600 34px ${SANS}`, '#d9d9de', -1);
  const tw = ctx.measureText(ui.brand).width;
  drawMark(ctx, 640 - (tw + 40) / 2 + 12, 386, 12, '#d9d9de');
  txt(ctx, ui.brand, 640 - (tw + 40) / 2 + 36, 398);
  font(ctx, `500 14px ${MONO}`, '#9a9aa4', 2);
  txt(ctx, ui.colophon.toUpperCase(), 640, 448, 'center');
  txt(ctx, '© 2026 LUIGI MELLO', 640, 478, 'center');
  grain(ctx, true);
  gutter(ctx, page % 2 === 0, true);
}

/** Paints page `index` into a canvas (any size with a 16:10 ratio). */
export function renderPage(canvas: HTMLCanvasElement, index: number, d: DrawContext, mask = false) {
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(canvas.width / ART_W, 0, 0, canvas.height / ART_H, 0, 0);
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (!mask) HOTSPOTS.set(index, []);
  const spec: PageSpec = PAGES[index];
  switch (spec.kind) {
    case 'cover':
      return drawCover(ctx, d, mask, false);
    case 'backCover':
      return drawCover(ctx, d, mask, true);
    case 'contents':
      return drawContents(ctx, d, index);
    case 'letter':
      return drawLetter(ctx, d, index);
    case 'aboutCover':
      return drawAboutCover(ctx, d, index);
    case 'profile':
      return drawProfile(ctx, d, index);
    case 'facts':
      return drawFacts(ctx, d, index);
    case 'grid':
      return drawGrid(ctx, d, index);
    case 'shot':
      return drawShot(ctx, d, index, spec.project);
    case 'feature':
      return drawFeature(ctx, d, index, spec.project);
    case 'skills':
      return drawSkills(ctx, d, index);
    case 'services':
      return drawServices(ctx, d, index);
    case 'contact':
      return drawContact(ctx, d, index);
    case 'insideBack':
      return drawInsideBack(ctx, d, index);
    case 'divider':
      return drawDivider(ctx, d, index, spec.section);
    case 'thanks':
      return drawThanks(ctx, d, index);
  }
}
