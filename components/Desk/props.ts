import * as THREE from 'three';
import {
  cardTexture,
  latteTexture,
  radialShadowTexture,
  rng,
  soilTexture,
  steamNoiseTexture,
  stonewareTexture,
} from './textures';

const v2 = (pts: number[][]) => pts.map(([x, y]) => new THREE.Vector2(x, y));

/* ── Desk: dark stained oak, generated in the shader so it stays sharp at any zoom ── */

export function createDesk() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vWPos;
        float w_hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        float w_noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(w_hash(i), w_hash(i+vec2(1.,0.)), u.x), mix(w_hash(i+vec2(0.,1.)), w_hash(i+vec2(1.,1.)), u.x), u.y); }
        float w_fbm(vec2 p){ float s = 0.0; float a = 0.5; for(int i=0;i<4;i++){ s += a*w_noise(p); p = p*2.03 + vec2(17.1, 3.7); a *= 0.5; } s *= 1.067; return s; }
        `,
      )
      .replace(
        '#include <map_fragment>',
        /* glsl */ `
        vec2 wp = vWPos.xz + vec2(11.3, 4.1);
        // boards run left→right; each one gets its own grain phase and tone
        float board = floor(wp.y * 0.75);
        float plank = w_hash(vec2(board, 7.0));
        float gy = wp.y;
        float aa = clamp(1.0 - length(fwidth(wp)) * 55.0, 0.0, 1.0);
        // growth rings: dense and nearly parallel, meandering slowly along the board
        float warp = w_fbm(vec2(wp.x * 0.16 + plank * 31.0, gy * 1.1)) * 6.5 + w_noise(vec2(wp.x * 0.8, gy * 5.0)) * 0.6;
        float r = gy * 34.0 + warp;
        float ring = fract(r);
        // sharp latewood edge fading into softer earlywood; fades to its mean where it would alias
        float line = smoothstep(0.0, 0.07, ring) * smoothstep(0.55, 0.12, ring);
        line = mix(0.3, line, clamp(1.4 - fwidth(r) * 1.6, 0.0, 1.0));
        float streak = w_fbm(vec2(wp.x * 0.45 + plank * 7.0, r * 0.22));
        float fiber = mix(0.5, w_fbm(vec2(wp.x * 3.0, gy * 240.0 + warp * 4.0)), aa);
        float pores = mix(0.0, smoothstep(0.8, 1.0, w_noise(vec2(wp.x * 10.0, gy * 260.0 + warp * 6.0))), aa);
        float wH = clamp(line * 0.3 + streak * 0.52 + fiber * 0.22, 0.0, 1.0);
        vec3 woodDark = vec3(0.006, 0.006, 0.0065) * (0.75 + plank * 0.5);
        vec3 woodLight = vec3(0.1, 0.099, 0.106) * (0.8 + plank * 0.35);
        diffuseColor.rgb = mix(woodDark, woodLight, smoothstep(0.18, 0.88, wH));
        diffuseColor.rgb *= 1.0 - pores * 0.6;
        `,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `float roughnessFactor = roughness * mix(1.1, 0.86, wH) + pores * 0.2;`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
        {
          vec3 sx = dFdx(-vViewPosition);
          vec3 sy = dFdy(-vViewPosition);
          vec3 r1 = cross(sy, normal);
          vec3 r2 = cross(normal, sx);
          float det = dot(sx, r1);
          float hh = fiber * 0.00012 + line * 0.00005 - pores * 0.00035;
          vec2 dh = vec2(dFdx(hh), dFdy(hh));
          vec3 grad = sign(det) * (dh.x * r1 + dh.y * r2);
          normal = normalize(abs(det) * normal - grad);
        }`,
      );
  };
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat);
  desk.rotation.x = -Math.PI / 2;
  desk.receiveShadow = true;
  return desk;
}

/* ── Soft contact shadows (ambient occlusion where objects touch the desk) ── */

let radialAlpha: THREE.Texture | null = null;
export function contactShadow(rx: number, rz: number, opacity: number) {
  radialAlpha ??= radialShadowTexture();
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(rx * 2, rz * 2),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      alphaMap: radialAlpha,
      transparent: true,
      opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.0015;
  m.renderOrder = 1;
  return m;
}

/* ── Cappuccino on a saucer, with a spoon and a wisp of steam ── */

export function createCoffee(env: THREE.Texture) {
  const g = new THREE.Group();
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xe4e2dd,
    roughness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMap: env,
    envMapIntensity: 0.18,
  });

  const saucer = new THREE.Mesh(
    new THREE.LatheGeometry(
      v2([
        [0.0, 0.0], [0.15, 0.0], [0.165, 0.004], [0.18, 0.012], [0.3, 0.022], [0.4, 0.034],
        [0.455, 0.05], [0.472, 0.06], [0.468, 0.067], [0.452, 0.064], [0.4, 0.049],
        [0.28, 0.035], [0.19, 0.028], [0.16, 0.026], [0.0, 0.026],
      ]),
      96,
    ),
    ceramic,
  );
  saucer.castShadow = saucer.receiveShadow = true;
  g.add(saucer);

  const cup = new THREE.Mesh(
    new THREE.LatheGeometry(
      v2([
        [0.0, 0.026], [0.1, 0.026], [0.112, 0.03], [0.125, 0.038], [0.13, 0.048], [0.17, 0.075],
        [0.212, 0.12], [0.242, 0.17], [0.26, 0.215], [0.268, 0.252], [0.27, 0.262], [0.266, 0.268],
        [0.26, 0.266], [0.256, 0.255], [0.248, 0.215], [0.232, 0.17], [0.2, 0.12], [0.16, 0.085],
        [0.11, 0.066], [0.0, 0.062],
      ]),
      96,
    ),
    ceramic,
  );
  cup.castShadow = cup.receiveShadow = true;
  g.add(cup);

  // cappuccino surface sitting just below the rim
  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.247, 64),
    new THREE.MeshPhysicalMaterial({
      map: latteTexture(),
      roughness: 0.42,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      envMap: env,
      envMapIntensity: 0.25,
    }),
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.rotation.z = 0.5;
  coffee.position.y = 0.214;
  coffee.receiveShadow = true;
  g.add(coffee);

  // handle: a squashed partial torus attached to the wall
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.019, 20, 48, Math.PI * 1.25), ceramic);
  handle.rotation.z = -Math.PI * 0.625;
  handle.scale.set(1, 1.15, 1.25);
  handle.position.set(0.272, 0.15, 0);
  const handlePivot = new THREE.Group();
  handlePivot.add(handle);
  handlePivot.rotation.y = Math.PI * 0.78;
  handle.castShadow = true;
  g.add(handlePivot);

  // teaspoon resting on the saucer
  const steel = new THREE.MeshStandardMaterial({ color: 0xd9dbe0, metalness: 1, roughness: 0.18, envMap: env, envMapIntensity: 1.1 });
  const spoon = new THREE.Group();
  const bowlGeo = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const bowl = new THREE.Mesh(bowlGeo, steel);
  bowl.scale.set(0.036, 0.009, 0.056);
  bowl.rotation.x = Math.PI; // concave side up
  bowl.position.y = 0.009;
  spoon.add(bowl);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0095, 0.25, 16), steel);
  stem.rotation.x = Math.PI / 2;
  stem.scale.set(1.6, 1, 0.55);
  stem.position.set(0, 0.006, 0.17);
  spoon.add(stem);
  spoon.children.forEach((c) => (c.castShadow = true));
  spoon.position.set(-0.16, 0.05, 0.3);
  spoon.rotation.set(0.12, -0.95, 0);
  g.add(spoon);

  const shadow = contactShadow(0.62, 0.62, 0.75);
  g.add(shadow);

  // steam: a camera-facing card with scrolling noise
  const steamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uNoise: { value: steamNoiseTexture() }, uTime: { value: 0 }, uOpacity: { value: 0.22 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uNoise; uniform float uTime; uniform float uOpacity; varying vec2 vUv;
      void main(){
        vec2 uv = vUv;
        float sway = sin(uv.y * 3.0 - uTime * 0.6) * 0.06 * uv.y;
        float n1 = texture2D(uNoise, vec2(uv.x * 0.55 + sway, uv.y * 0.45 - uTime * 0.05)).r;
        float n2 = texture2D(uNoise, vec2(uv.x * 1.2 - sway * 2.0 + 0.3, uv.y * 0.8 - uTime * 0.09)).r;
        float n = smoothstep(0.5, 0.9, n1 * 0.62 + n2 * 0.48);
        float fx = smoothstep(0.0, 0.38, uv.x) * smoothstep(1.0, 0.62, uv.x);
        float fy = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.35, uv.y);
        gl_FragColor = vec4(vec3(0.93), n * fx * fy * uOpacity);
      }`,
  });
  const steam = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.62), steamMat);
  steam.position.y = 0.5;
  steam.renderOrder = 5;
  g.add(steam);

  return { group: g, steam, steamMat };
}

/* ── Echeveria in a speckled stoneware pot ── */

function leafGeometry() {
  const geo = new THREE.SphereGeometry(1, 20, 14);
  const pos = geo.attributes.position;
  const colors: number[] = [];
  const base = new THREE.Color('#7fa6a2');
  const tip = new THREE.Color('#c48f97');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    const z = pos.getZ(i);
    const t = (z + 1) / 2; // 0 at the base, 1 at the tip
    const width = 0.42 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.08)), 0.7) * (1 - t * 0.25);
    x *= width / 1;
    y *= 0.15 * (1 - t * 0.55);
    y += x * x * 1.4; // cupped leaf
    pos.setXYZ(i, x, y, t);
    c.copy(base).lerp(tip, Math.pow(t, 6));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export function createPlant() {
  const g = new THREE.Group();
  const potMat = new THREE.MeshStandardMaterial({ map: stonewareTexture(), roughness: 0.62, metalness: 0 });
  const pot = new THREE.Mesh(
    new THREE.LatheGeometry(
      v2([
        [0.0, 0.0], [0.16, 0.0], [0.175, 0.01], [0.2, 0.07], [0.222, 0.16], [0.232, 0.215],
        [0.234, 0.228], [0.226, 0.234], [0.212, 0.232], [0.208, 0.2], [0.0, 0.2],
      ]),
      72,
    ),
    potMat,
  );
  pot.castShadow = pot.receiveShadow = true;
  g.add(pot);

  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.209, 48), new THREE.MeshStandardMaterial({ map: soilTexture(), roughness: 1 }));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.205;
  soil.receiveShadow = true;
  g.add(soil);

  const leafMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.62,
    sheen: 0.6,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color('#cfe3e3'),
  });
  const count = 46;
  const leaves = new THREE.InstancedMesh(leafGeometry(), leafMat, count);
  const r = rng(21);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const t = i / count; // 0 = outer ring, 1 = centre
    const yaw = i * golden;
    const pitch = 0.18 + t * 1.05; // outer leaves lie flatter, inner ones stand up
    const len = 0.17 - t * 0.11 + r() * 0.012;
    e.set(-pitch, yaw, 0, 'YXZ');
    q.setFromEuler(e);
    s.set(len * 0.95, len * 0.9, len);
    p.set(0, 0.215 + t * 0.03, 0);
    m.compose(p, q, s);
    leaves.setMatrixAt(i, m);
    col.setHSL(0.47 + r() * 0.04, 0.16 + r() * 0.1, 0.52 + t * 0.12 + r() * 0.05);
    leaves.setColorAt(i, col);
  }
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  g.add(leaves);

  g.add(contactShadow(0.36, 0.36, 0.8));
  return g;
}

/* ── Black lacquered pencil with a silver ferrule ── */

export function createPencil(env: THREE.Texture) {
  const g = new THREE.Group();
  const L = 0.86;
  const R = 0.022;
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.2, envMap: env, envMapIntensity: 0.4 });
  const wood = new THREE.MeshStandardMaterial({ color: 0xc9a77c, roughness: 0.8 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.35, metalness: 0.5 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xcfd2d8, metalness: 1, roughness: 0.25, envMap: env, envMapIntensity: 1 });
  const eraser = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.9 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 6), lacquer);
  g.add(body);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, R, 0.1, 6), wood);
  cone.position.y = L / 2 + 0.05;
  g.add(cone);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.0056, 0.022, 12), graphite);
  lead.position.y = L / 2 + 0.1 + 0.011;
  g.add(lead);
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.04, R * 1.04, 0.055, 24), silver);
  ferrule.position.y = -L / 2 - 0.0275;
  g.add(ferrule);
  const rub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.98, R * 0.98, 0.034, 24), eraser);
  rub.position.y = -L / 2 - 0.055 - 0.017;
  g.add(rub);
  g.children.forEach((c) => {
    c.castShadow = true;
    c.receiveShadow = true;
  });

  // lie it on a flat face of the hexagon
  const holder = new THREE.Group();
  g.rotation.z = Math.PI / 2;
  g.rotation.x = Math.PI / 6;
  g.position.y = R * Math.cos(Math.PI / 6);
  holder.add(g);
  const sh = contactShadow(0.52, 0.06, 0.7);
  holder.add(sh);
  return holder;
}

/* ── A small stack of business cards ── */

export function createCards() {
  const g = new THREE.Group();
  const W = 0.85;
  const D = 0.49;
  const T = 0.0055;
  const whiteEdge = new THREE.MeshStandardMaterial({ color: 0xe9e8e4, roughness: 0.8 });
  const blackEdge = new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.6 });
  const whiteTop = new THREE.MeshStandardMaterial({ map: cardTexture('white'), roughness: 0.72 });
  const blackTop = new THREE.MeshStandardMaterial({ map: cardTexture('black'), roughness: 0.5 });
  const geo = new THREE.BoxGeometry(W, T, D);
  const layout = [
    { white: true, x: 0.02, z: 0.01, r: 0.06 },
    { white: true, x: -0.01, z: 0.0, r: 0.02 },
    { white: true, x: 0.0, z: -0.01, r: 0.04 },
    { white: false, x: -0.12, z: -0.16, r: 0.42 },
  ];
  layout.forEach((c, i) => {
    const edge = c.white ? whiteEdge : blackEdge;
    const top = c.white ? whiteTop : blackTop;
    const mesh = new THREE.Mesh(geo, [edge, edge, top, edge, edge, edge]);
    mesh.position.set(c.x, T / 2 + i * T, c.z);
    mesh.rotation.y = c.r;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  });
  g.add(contactShadow(0.62, 0.48, 0.55));
  return g;
}
