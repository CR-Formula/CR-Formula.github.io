// Procedural 4-layer PCB model used by the PCB Explorer.
// All layout coordinates are in millimetres in "plan view": x to the right,
// y towards the top edge of the board. World space is three.js Y-up, so a plan
// point (x, y) at height h lives at world (x, h, -y).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const BOARD = { w: 64, h: 44, r: 3 };

// Explode order, bottom to top. Index 5 (core) stays put when exploding.
export const LAYER_IDS = ['silkB', 'maskB', 'L4', 'ppB', 'L3', 'core', 'L2', 'ppT', 'L1', 'maskT', 'silkT', 'comps'];

// Heights (mm). Copper is drawn slightly thicker than real 1 oz copper so it is visible.
export const H = {
  l4b: 0, l4t: 0.05,
  ppBb: 0.05, ppBt: 0.25,
  l3b: 0.25, l3t: 0.30,
  coreb: 0.30, coret: 1.30,
  l2b: 1.30, l2t: 1.35,
  ppTb: 1.35, ppTt: 1.55,
  l1b: 1.55, l1t: 1.60,
  top: 1.63,
};

const SILK_PX = 32; // canvas pixels per mm for silkscreen

// ---------------------------------------------------------------- materials
const std = (color, metalness, roughness, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });

export const MAT = {
  copper: std(0xc8783c, 0.9, 0.34, { side: THREE.DoubleSide }),
  plane: std(0xd08550, 0.85, 0.42, { side: THREE.DoubleSide }),
  gold: std(0xe8b84c, 1.0, 0.26),
  barrel: std(0xc8783c, 0.9, 0.35, { side: THREE.DoubleSide }),
  core: std(0x9a8446, 0.0, 0.85, { side: THREE.DoubleSide }),
  prepreg: std(0xb9a86c, 0.0, 0.9, { side: THREE.DoubleSide }),
  mask: std(0x0b6332, 0.0, 0.38, { transparent: true, opacity: 0.86, depthWrite: false, envMapIntensity: 0.6 }),
  icBody: std(0x1d1d21, 0.0, 0.55),
  ceramic: std(0xc4a06c, 0.0, 0.6),
  resBody: std(0x161616, 0.0, 0.5),
  tin: std(0xd8d8d8, 0.9, 0.3),
  pinGold: std(0xf0c255, 1.0, 0.25),
  plasticBlack: std(0x141414, 0.0, 0.6),
  termGreen: std(0x2559b8, 0.0, 0.5),
  steel: std(0xc5c9ce, 1.0, 0.28),
  dark: std(0x050505, 0.0, 1.0),
  ledWhite: std(0xf2efe6, 0.0, 0.5),
  ledRed: std(0xff3b30, 0.0, 0.2, { emissive: 0x6a0a06, transparent: true, opacity: 0.88 }),
  ledGreen: std(0x34e07a, 0.0, 0.2, { emissive: 0x0b5a2a, transparent: true, opacity: 0.88 }),
  loop: new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide }),
  outline: new THREE.MeshBasicMaterial({ color: 0xffd23f, side: THREE.DoubleSide }),
};

// ---------------------------------------------------------------- 2D helpers
function polyShape(pts, Cls = THREE.Shape) {
  const s = new Cls();
  pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  s.closePath();
  return s;
}
function circlePath(x, y, r, Cls = THREE.Path) {
  const p = new Cls();
  p.absarc(x, y, r, 0, Math.PI * 2, false);
  return p;
}
function rectPts(x, y, w, h) {
  return [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]];
}
function roundRectPts(w, h, r, grow = 0, seg = 8) {
  const pts = [];
  const hw = w / 2 + grow, hh = h / 2 + grow, rr = r + grow;
  const corners = [[hw - rr, hh - rr, 0], [-hw + rr, hh - rr, 90], [-hw + rr, -hh + rr, 180], [hw - rr, -hh + rr, 270]];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = (a0 + (90 * i) / seg) * Math.PI / 180;
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  }
  return pts;
}
const boardShape = () => polyShape(roundRectPts(BOARD.w, BOARD.h, BOARD.r));

// Annular slot used for thermal-relief gaps (four of them make a relief).
function arcSlotPath(x, y, r1, r2, a1, a2, n = 8) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a1 + ((a2 - a1) * i) / n;
    pts.push([x + r2 * Math.cos(a), y + r2 * Math.sin(a)]);
  }
  for (let i = n; i >= 0; i--) {
    const a = a1 + ((a2 - a1) * i) / n;
    pts.push([x + r1 * Math.cos(a), y + r1 * Math.sin(a)]);
  }
  return polyShape(pts, THREE.Path);
}

function extrude(shape, depth, curveSegments = 14) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments });
  g.rotateX(-Math.PI / 2);
  return g;
}

// A trace: boxes along each segment plus round joints, merged into one geometry.
function traceGeo(pts, w, t) {
  const geos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    const g = new THREE.BoxGeometry(len, t, w);
    g.rotateY(Math.atan2(by - ay, bx - ax));
    g.translate((ax + bx) / 2, t / 2, -(ay + by) / 2);
    geos.push(g);
  }
  for (const [x, y] of pts) {
    const c = new THREE.CylinderGeometry(w / 2, w / 2, t, 18);
    c.translate(x, t / 2, -y);
    geos.push(c);
  }
  const merged = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return merged;
}

function box(w, d, h, mat, x, y, z0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, z0 + h / 2, -y);
  return m;
}
function cyl(r, h, mat, x, y, z0, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.position.set(x, z0 + h / 2, -y);
  return m;
}

// Top-face texture for IC packages.
const markCache = new Map();
function markedMaterial(lines) {
  const key = lines.join('|');
  if (markCache.has(key)) return markCache.get(key);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#1d1d21'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#a9a9ad'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const size = lines.length > 2 ? 64 : 84;
  g.font = `600 ${size}px "Helvetica Neue", Arial, sans-serif`;
  lines.forEach((l, i) => g.fillText(l, 256, 256 + (i - (lines.length - 1) / 2) * size * 1.25));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const top = std(0xffffff, 0, 0.55, { map: tex });
  const mats = [MAT.icBody, MAT.icBody, top, MAT.icBody, MAT.icBody, MAT.icBody];
  markCache.set(key, mats);
  return mats;
}

// ---------------------------------------------------------------- footprints
// STM32F042K6 (LQFP-32) pinout. Check ST's datasheet (DS10152) before using it for a real design.
export const U1_PINS = {
  1: 'VDD', 2: 'PF0 / OSC_IN', 3: 'PF1 / OSC_OUT', 4: 'NRST', 5: 'VDDA', 6: 'PA0', 7: 'PA1', 8: 'PA2',
  9: 'PA3', 10: 'PA4 (green LED)', 11: 'PA5 (red LED)', 12: 'PA6', 13: 'PA7', 14: 'PB0', 15: 'PB1', 16: 'VSS / GND',
  17: 'VDDIO2', 18: 'PA8', 19: 'PA9', 20: 'PA10', 21: 'PA11 / CAN_RX', 22: 'PA12 / CAN_TX', 23: 'PA13 / SWDIO', 24: 'PA14 / SWCLK',
  25: 'PA15', 26: 'PB3', 27: 'PB4', 28: 'PB5', 29: 'PB6 / I2C1_SCL', 30: 'PB7 / I2C1_SDA', 31: 'BOOT0', 32: 'VSS / GND',
};
const U3_PINS = { 1: 'TXD', 2: 'GND', 3: 'VCC', 4: 'RXD', 5: 'VREF', 6: 'CANL', 7: 'CANH', 8: 'STBY' };
const U2_PINS = { 1: 'GND', 2: 'VOUT', 3: 'VIN', 4: 'VOUT (tab)' };
const U4_PINS = { 1: 'SDA', 2: 'SCL', 3: 'OS (alert)', 4: 'GND', 5: 'A2', 6: 'A1', 7: 'A0', 8: 'VCC' };

function qfpPads() {
  const pads = [];
  for (let n = 1; n <= 32; n++) {
    const k = (n - 1) % 8, side = Math.floor((n - 1) / 8), o = (3.5 - k) * 0.8;
    if (side === 0) pads.push({ n, x: -4.3, y: o, w: 1.4, h: 0.5 });
    else if (side === 1) pads.push({ n, x: -o, y: -4.3, w: 0.5, h: 1.4 });
    else if (side === 2) pads.push({ n, x: 4.3, y: -o, w: 1.4, h: 0.5 });
    else pads.push({ n, x: o, y: 4.3, w: 0.5, h: 1.4 });
  }
  return pads;
}

function footprintPads(c) {
  let local;
  switch (c.fp) {
    case 'qfp32': local = qfpPads(); break;
    case '0603': local = [{ n: 1, x: -0.75, y: 0, w: 0.8, h: 0.9 }, { n: 2, x: 0.75, y: 0, w: 0.8, h: 0.9 }]; break;
    case 'xtal': local = [{ n: 1, x: -1.25, y: 0, w: 0.9, h: 1.3 }, { n: 2, x: 1.25, y: 0, w: 0.9, h: 1.3 }]; break;
    case 'sot223': local = [
      { n: 1, x: -2.3, y: -3.15, w: 0.95, h: 2.0 }, { n: 2, x: 0, y: -3.15, w: 0.95, h: 2.0 },
      { n: 3, x: 2.3, y: -3.15, w: 0.95, h: 2.0 }, { n: 4, x: 0, y: 3.15, w: 3.4, h: 2.0 }]; break;
    case 'soic8': local = [];
      for (let k = 0; k < 4; k++) {
        local.push({ n: k + 1, x: -2.7, y: 1.905 - 1.27 * k, w: 1.55, h: 0.6 });
        local.push({ n: 8 - k, x: 2.7, y: 1.905 - 1.27 * k, w: 1.55, h: 0.6 });
      }
      break;
    case 'usb': local = [
      { n: 'VBUS', x: 0, y: 2.2, w: 1.2, h: 0.6 }, { n: 'GND', x: 0, y: 0.8, w: 1.2, h: 0.45 },
      { n: 'D−', x: 0, y: -0.6, w: 1.2, h: 0.45 }, { n: 'D+', x: 0, y: -1.4, w: 1.2, h: 0.45 },
      { n: 'CC', x: 0, y: -2.2, w: 1.2, h: 0.45 }]; break;
    default: local = [];
  }
  return local.map((p) => {
    let { x, y, w, h } = p;
    if (c.rot === 90) { [x, y] = [-y, x]; [w, h] = [h, w]; }
    if (c.rot === 180) { [x, y] = [-x, -y]; }
    return { ...p, x: c.x + x, y: c.y + y, w, h, ref: c.ref };
  });
}

function pinName(ref, n) {
  const map = { U1: U1_PINS, U2: U2_PINS, U3: U3_PINS, U4: U4_PINS }[ref];
  if (map) return map[n] || '';
  return '';
}

// ---------------------------------------------------------------- layout data
function layout(v) {
  const smd = [
    { ref: 'U1', fp: 'qfp32', x: 0, y: 0, kind: 'qfp', terms: ['mcu', 'smd', 'footprint'], label: 'U1 — STM32F042K6 microcontroller (Arm Cortex-M0, LQFP-32)', mark: ['STM32', 'F042K6', 'LQFP32'] },
    { ref: 'U2', fp: 'sot223', x: -21.5, y: 12, kind: 'sot223', terms: ['smd', 'thermal-vias'], label: 'U2 — 3.3 V linear regulator (SOT-223 package)', mark: ['LDO', '3V3'] },
    { ref: 'U3', fp: 'soic8', x: 16, y: -10, kind: 'soic8', terms: ['can', 'smd'], label: 'U3 — CAN bus transceiver (SOIC-8 package)', mark: ['CAN', 'XCVR'] },
    { ref: 'U4', fp: 'soic8', x: -8, y: 11, rot: 180, kind: 'soic8', terms: ['i2c', 'smd'], label: 'U4 — I²C temperature sensor (LM75-style, address 0x48, SOIC-8)', mark: ['TEMP', 'I2C'] },
    { ref: 'Y1', fp: 'xtal', x: -8.6, y: 1.6, rot: 90, kind: 'xtal', terms: ['crystal', 'smd'], label: 'Y1 — 8 MHz crystal for the STM32’s HSE oscillator' },
    v.decapFar
      ? { ref: 'C1', fp: '0603', x: -10.0, y: 6.2, kind: 'cap', terms: ['decap', 'smd'], label: 'C1 — 100 nF VDD decoupling capacitor, placed badly (far from its pin)' }
      : { ref: 'C1', fp: '0603', x: -5.85, y: 4.6, kind: 'cap', terms: ['decap', 'smd'], label: 'C1 — 100 nF decoupling capacitor for VDD (pin 1)' },
    { ref: 'C2', fp: '0603', x: -6.2, y: -1.75, rot: 90, kind: 'cap', terms: ['decap', 'smd'], label: 'C2 — 100 nF decoupling capacitor for VDDA (pin 5, analog supply)' },
    { ref: 'C3', fp: '0603', x: 6.0, y: -3.55, rot: 90, kind: 'cap', terms: ['decap', 'smd'], label: 'C3 — 100 nF decoupling capacitor for VDDIO2 (pin 17)' },
    { ref: 'C4', fp: '0603', x: -12.6, y: 8.345, rot: 90, kind: 'cap', terms: ['decap', 'smd', 'i2c'], label: 'C4 — 100 nF decoupling capacitor for the temperature sensor U4' },
    { ref: 'C5', fp: '0603', x: -10.6, y: 2.85, kind: 'cap', terms: ['crystal', 'smd'], label: 'C5 — 12 pF crystal load capacitor (0603)' },
    { ref: 'C6', fp: '0603', x: -10.6, y: 0.35, kind: 'cap', terms: ['crystal', 'smd'], label: 'C6 — 12 pF crystal load capacitor (0603)' },
    { ref: 'C7', fp: '0603', x: -16.4, y: 8.85, kind: 'cap', terms: ['smd'], label: 'C7 — 10 µF regulator input capacitor (0603)' },
    { ref: 'C8', fp: '0603', x: -16.0, y: 15.15, kind: 'cap', terms: ['smd'], label: 'C8 — 10 µF regulator output capacitor (0603)' },
    { ref: 'R1', fp: '0603', x: -15, y: -9, kind: 'res', terms: ['smd'], label: 'R1 — 1 kΩ LED current-limiting resistor (0603)' },
    { ref: 'R2', fp: '0603', x: -15, y: -6.5, kind: 'res', terms: ['smd'], label: 'R2 — 1 kΩ LED current-limiting resistor (0603)' },
    { ref: 'D1', fp: '0603', x: -19, y: -9, kind: 'led', color: 'red', terms: ['smd', 'pin1'], label: 'D1 — Red LED driven by PA5 (0603). Polarity matters!' },
    { ref: 'D2', fp: '0603', x: -19, y: -6.5, kind: 'led', color: 'green', terms: ['smd', 'pin1'], label: 'D2 — Green LED driven by PA4 (0603). Polarity matters!' },
    { ref: 'R3', fp: '0603', x: 24.6, y: -10, rot: 90, kind: 'res', terms: ['can', 'smd', 'diffpair'], label: 'R3 — 120 Ω CAN bus termination resistor (0603)' },
    { ref: 'R5', fp: '0603', x: -23.2, y: -1.6, rot: 90, kind: 'res', terms: ['smd'], label: 'R5 — 5.1 kΩ USB-C CC pull-down resistor (0603)' },
    { ref: 'R6', fp: '0603', x: -2.0, y: 6.9, rot: 90, kind: 'res', terms: ['mcu', 'smd'], label: 'R6 — 10 kΩ pull-down on BOOT0, so the STM32 boots from its own Flash' },
    { ref: 'R7', fp: '0603', x: -3.0, y: 11.115, rot: 90, kind: 'res', terms: ['pull-up', 'i2c', 'smd'], label: 'R7 — 4.7 kΩ I²C pull-up resistor on SCL' },
    { ref: 'R8', fp: '0603', x: -4.3, y: 8.345, rot: 90, kind: 'res', terms: ['pull-up', 'i2c', 'smd'], label: 'R8 — 4.7 kΩ I²C pull-up resistor on SDA' },
    { ref: 'J1', fp: 'usb', x: -25.4, y: 2.6, kind: 'usb', terms: ['connector', 'smd'], label: 'J1 — USB-C connector (5 V power input; data pins unused)' },
  ];

  const th = [
    { ref: 'J1', n: 'shield', x: -28.8, y: 6.6, drill: 0.9, pad: 1.5, net: 'GND' },
    { ref: 'J1', n: 'shield', x: -28.8, y: -1.4, drill: 0.9, pad: 1.5, net: 'GND' },
    { ref: 'J2', n: 1, name: '3V3', x: 14.0, y: 14, drill: 1.0, pad: 1.7, square: true, net: '3V3' },
    { ref: 'J2', n: 2, name: 'SWCLK', x: 16.54, y: 14, drill: 1.0, pad: 1.7, net: 'SWCLK' },
    { ref: 'J2', n: 3, name: 'SWDIO', x: 19.08, y: 14, drill: 1.0, pad: 1.7, net: 'SWDIO' },
    { ref: 'J2', n: 4, name: 'NRST', x: 21.62, y: 14, drill: 1.0, pad: 1.7, net: 'NRST' },
    { ref: 'J2', n: 5, name: 'GND', x: 24.16, y: 14, drill: 1.0, pad: 1.7, net: 'GND' },
    { ref: 'J3', n: 1, name: 'CANH', x: 27.5, y: -8.73, drill: 1.1, pad: 1.9, square: true, net: 'CANH' },
    { ref: 'J3', n: 2, name: 'CANL', x: 27.5, y: -11.27, drill: 1.1, pad: 1.9, net: 'CANL' },
  ];
  th.forEach((t) => { t.th = true; });

  const mholes = [[-28.5, 18.5], [28.5, 18.5], [-28.5, -18.5], [28.5, -18.5]].map(([x, y]) => ({ x, y, drill: 3.2, keep: 3.0 }));

  const V = (x, y, net, kind = 'via') => ({ x, y, net, kind, drill: 0.3, pad: 0.6 });
  const vias = [
    ...(v.decapFar ? [V(-9.25, 7.25, '3V3'), V(-11.8, 6.2, 'GND')] : [V(-7.6, 4.6, '3V3'), V(-5.1, 5.65, 'GND')]),
    { x: -3.3, y: 5.5, net: 'GND', kind: 'blind', drill: 0.15, pad: 0.4 },
    V(-7.25, -1.0, '3V3'), V(-7.25, -2.5, 'GND'), V(7.05, -2.8, '3V3'), V(7.05, -4.3, 'GND'), V(2.8, -6.0, 'GND'),
    V(-12.4, 2.85, 'GND'), V(-12.4, 0.35, 'GND'), V(-5.55, 0.4, 'NRST'), V(-3.05, 7.65, 'GND'),
    V(-4.3, 6.55, '3V3'), V(-1.9, 11.865, '3V3'), V(-5.3, 14.2, 'GND'), V(-11.8, 12.905, 'GND'),
    V(-13.65, 9.095, '3V3'), V(-12.6, 6.55, 'GND'),
    V(-20.9, -9, 'GND'), V(-20.9, -6.5, 'GND'), V(-24.2, 3.4, 'GND'), V(-23.2, -3.4, 'GND'), V(-23.8, 6.6, 'GND'),
    V(-14.6, 8.85, 'GND'), V(-14.2, 15.15, 'GND'), V(-11.5, 16.8, 'GND'),
    V(12.0, -9.365, 'GND'), V(12.0, -10.635, '3V3'), V(20.4, -7.3, 'GND'),
  ];
  for (const y of [17.2, 18.4]) for (const x of [-24.1, -22.9, -21.7, -20.5, -19.3, -18.1]) vias.push(V(x, y, '3V3', 'thermal'));

  const T = (net, w, pts, o = {}) => ({ net, w, pts, layer: 'L1', ...o });
  const diff = { terms: ['diffpair', 'can', 'trace'] };
  const can = { terms: ['can', 'trace'], tag: 'corners' };
  const i2c = { terms: ['i2c', 'trace'] };
  const xtal = { terms: ['crystal', 'trace'] };
  const decap = { terms: ['decap', 'trace'] };
  const swd = { terms: ['trace', 'mcu'] };
  const traces = [
    // VDD (pin 1) and its decoupling capacitor C1
    ...(v.decapFar ? [
      T('3V3', 0.3, [[-4.3, 2.8], [-5.8, 2.8], [-6.6, 3.6], [-6.6, 5.4], [-7.4, 6.2], [-9.25, 6.2]], decap),
      T('3V3', 0.3, [[-9.25, 6.2], [-9.25, 7.25]], decap),
      T('GND', 0.3, [[-10.75, 6.2], [-11.8, 6.2]], decap),
    ] : [
      T('3V3', 0.3, [[-4.3, 2.8], [-5.8, 2.8], [-6.6, 3.6], [-6.6, 4.6]], decap),
      T('3V3', 0.3, [[-6.6, 4.6], [-7.6, 4.6]], decap),
      T('GND', 0.3, [[-5.1, 4.6], [-5.1, 5.65]], decap),
    ]),
    T('GND', 0.2, [[-2.8, 4.3], [-2.8, 5.0], [-3.3, 5.5]], decap), // VSS pin 32 → blind via
    // Crystal
    T('OSC_IN', 0.25, [[-4.3, 2.0], [-7.75, 2.0], [-8.6, 2.85]], xtal),
    T('OSC_OUT', 0.25, [[-4.3, 1.2], [-7.75, 1.2], [-8.6, 0.35]], xtal),
    T('OSC_IN', 0.25, [[-8.6, 2.85], [-9.85, 2.85]], xtal),
    T('OSC_OUT', 0.25, [[-8.6, 0.35], [-9.85, 0.35]], xtal),
    T('GND', 0.3, [[-11.35, 2.85], [-12.4, 2.85]], xtal),
    T('GND', 0.3, [[-11.35, 0.35], [-12.4, 0.35]], xtal),
    // NRST → bottom layer → J2
    T('NRST', 0.25, [[-4.3, 0.4], [-5.55, 0.4]], swd),
    T('NRST', 0.25, [[-5.55, 0.4], [-6.35, 1.2], [-6.35, 10], [0.7, 17], [18.62, 17], [21.62, 14]], { layer: 'L4', terms: ['trace', 'mcu'] }),
    // VDDA (pin 5) + C2
    T('VDDA', 0.3, [[-4.3, -0.4], [-5.6, -0.4], [-6.2, -1.0]], decap),
    T('3V3', 0.3, [[-6.2, -1.0], [-7.25, -1.0]], decap),
    T('GND', 0.3, [[-6.2, -2.5], [-7.25, -2.5]], decap),
    // LEDs on PA4 / PA5
    T('PA4 · LED', 0.25, [[-2.0, -4.3], [-2.0, -5.6], [-2.9, -6.5], [-14.25, -6.5]]),
    T('PA5 · LED', 0.25, [[-1.2, -4.3], [-1.2, -6.8], [-3.4, -9.0], [-14.25, -9.0]]),
    T('PA5 · LED', 0.25, [[-15.75, -9], [-18.25, -9]]),
    T('PA4 · LED', 0.25, [[-15.75, -6.5], [-18.25, -6.5]]),
    T('GND', 0.3, [[-19.75, -9], [-20.9, -9]]),
    T('GND', 0.3, [[-19.75, -6.5], [-20.9, -6.5]]),
    // VSS pin 16, VDDIO2 pin 17 + C3
    T('GND', 0.3, [[2.8, -4.3], [2.8, -6.0]], decap),
    T('VDDIO2', 0.3, [[4.3, -2.8], [6.0, -2.8]], decap),
    T('3V3', 0.3, [[6.0, -2.8], [7.05, -2.8]], decap),
    T('GND', 0.3, [[6.0, -4.3], [7.05, -4.3]], decap),
    // BOOT0 pull-down
    T('BOOT0', 0.25, [[-2.0, 4.3], [-2.0, 6.15]], swd),
    T('GND', 0.3, [[-2.0, 7.65], [-3.05, 7.65]], swd),
    // I²C bus to U4 with pull-ups R7/R8
    T('I2C SDA', 0.25, [[-1.2, 4.3], [-1.2, 8.8], [-1.495, 9.095], [-5.3, 9.095]], i2c),
    T('I2C SCL', 0.25, [[-0.4, 4.3], [-0.4, 9.6], [-1.165, 10.365], [-5.3, 10.365]], i2c),
    T('3V3', 0.3, [[-4.3, 7.595], [-4.3, 6.55]], i2c),
    T('3V3', 0.3, [[-3.0, 11.865], [-1.9, 11.865]], i2c),
    T('GND', 0.3, [[-5.3, 12.905], [-5.3, 14.2]], i2c),
    T('GND', 0.3, [[-10.7, 10.365], [-10.7, 12.905], [-11.8, 12.905]], { terms: ['i2c', 'trace'] }),
    T('3V3', 0.3, [[-10.7, 9.095], [-12.6, 9.095], [-13.65, 9.095]], decap),
    T('GND', 0.3, [[-12.6, 7.595], [-12.6, 6.55]], decap),
    // SWD to the programming header
    T('SWDIO', 0.25, [[4.3, 2.0], [7.5, 2.0], [19.08, 13.58], [19.08, 14]], swd),
    T('SWCLK', 0.25, [[4.3, 2.8], [6.0, 2.8], [16.54, 13.34], [16.54, 14]], swd),
    // CAN TX/RX to the transceiver
    ...(v.corners90 ? [
      T('CAN_TX', 0.25, [[4.3, 1.2], [10.5, 1.2], [10.5, -8.095], [13.3, -8.095]], can),
      T('CAN_RX', 0.25, [[4.3, 0.4], [9.0, 0.4], [9.0, -11.905], [13.3, -11.905]], can),
    ] : [
      T('CAN_TX', 0.25, [[4.3, 1.2], [7.5, 1.2], [10.5, -1.8], [10.5, -8.095], [13.3, -8.095]], can),
      T('CAN_RX', 0.25, [[4.3, 0.4], [6.0, 0.4], [9.0, -2.6], [9.0, -11.905], [13.3, -11.905]], can),
    ]),
    T('GND', 0.3, [[13.3, -9.365], [12.0, -9.365]]),
    T('3V3', 0.3, [[13.3, -10.635], [12.0, -10.635]]),
    T('GND', 0.25, [[18.7, -8.095], [19.6, -8.095], [20.4, -7.3]]),
    T('CANH', 0.3, [[18.7, -9.365], [23.0, -9.365], [23.635, -8.73], [27.5, -8.73]], diff),
    T('CANL', 0.3, [[18.7, -10.635], [23.0, -10.635], [23.635, -11.27], [27.5, -11.27]], diff),
    T('CANH', 0.3, [[24.6, -8.73], [24.6, -9.25]], diff),
    T('CANL', 0.3, [[24.6, -11.27], [24.6, -10.75]], diff),
    // USB-C power input + regulator
    T('GND', 0.3, [[-25.4, 3.4], [-24.2, 3.4]]),
    T('CC', 0.25, [[-25.4, 0.4], [-23.9, 0.4], [-23.2, -0.3], [-23.2, -0.85]]),
    T('GND', 0.3, [[-23.2, -2.35], [-23.2, -3.4]]),
    T('VBUS (5 V)', v.vbusW, [[-25.4, 4.8], [-20.2, 4.8], [-19.2, 5.8], [-19.2, 8.85]], { terms: ['trace-width', 'trace'] }),
    T('GND', 0.4, [[-23.8, 8.85], [-23.8, 6.6]]),
    T('3V3', 0.6, [[-21.5, 8.85], [-21.5, 15.15]], { terms: ['trace-width', 'trace'] }),
    T('VBUS (5 V)', 0.6, [[-19.2, 8.85], [-17.15, 8.85]], { terms: ['trace-width', 'trace'] }),
    T('GND', 0.4, [[-15.65, 8.85], [-14.6, 8.85]]),
    T('3V3', 0.6, [[-17.4, 15.15], [-16.75, 15.15]]),
    T('GND', 0.4, [[-15.25, 15.15], [-14.2, 15.15]]),
    T('3V3', 0.4, [[-17.4, 18.2], [-14.5, 18.2]], { terms: ['testpoint', 'trace'] }),
    T('GND', 0.4, [[-11.5, 18.2], [-11.5, 16.8]], { terms: ['testpoint', 'trace'] }),
  ];

  const pour = [[-25.0, 14.0], [-24.4, 13.4], [-17.4, 13.4], [-17.4, 19.0], [-24.4, 19.0], [-25.0, 18.4]];
  const tps = [
    { ref: 'TP1', x: -14.5, y: 18.2, r: 0.75, net: '3V3' },
    { ref: 'TP2', x: -11.5, y: 18.2, r: 0.75, net: 'GND' },
  ];
  const fids = [[-10, -19], [10, 19.5], [28.5, 3]].map(([x, y]) => ({ x, y }));

  const pads = smd.flatMap(footprintPads);

  // Stitching vias: walk the perimeter and keep only spots that are clear of everything else.
  const obstacles = [];
  pads.forEach((p) => obstacles.push({ rect: [p.x - p.w / 2, p.y - p.h / 2, p.x + p.w / 2, p.y + p.h / 2] }));
  th.forEach((t) => obstacles.push({ c: [t.x, t.y, t.pad / 2 + 0.2] }));
  vias.forEach((t) => obstacles.push({ c: [t.x, t.y, t.pad / 2] }));
  mholes.forEach((m) => obstacles.push({ c: [m.x, m.y, 3.6] }));
  fids.forEach((f) => obstacles.push({ c: [f.x, f.y, 1.6] }));
  tps.forEach((t) => obstacles.push({ c: [t.x, t.y, t.r] }));
  traces.forEach((t) => { for (let i = 0; i < t.pts.length - 1; i++) obstacles.push({ seg: [...t.pts[i], ...t.pts[i + 1], t.w / 2] }); });
  obstacles.push({ rect: [-25.6, 13.4, -17.4, 19.0] });
  obstacles.push({ rect: [-33, -2.5, -26.4, 8] }); // USB connector body
  obstacles.push({ rect: [25.4, -13.4, 33, -6.6] }); // CAN connector body
  const clear = (x, y) => obstacles.every((o) => distTo(o, x, y) > 1.0);
  const stitch = [];
  const add = (x, y) => { if (clear(x, y)) { stitch.push(V(x, y, 'GND', 'stitch')); obstacles.push({ c: [x, y, 0.3] }); } };
  for (let x = -24; x <= 24.01; x += 2.4) { add(x, 20.5); add(x, -20.5); }
  for (let y = -14.4; y <= 14.41; y += 2.4) { add(-30.5, y); add(30.5, y); }
  vias.push(...stitch);

  return { smd, pads, th, mholes, vias, traces, pour, tps, fids };
}

function distTo(o, x, y) {
  if (o.c) return Math.hypot(x - o.c[0], y - o.c[1]) - o.c[2];
  if (o.rect) {
    const [x0, y0, x1, y1] = o.rect;
    const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1);
    return Math.hypot(dx, dy);
  }
  const [ax, ay, bx, by, r] = o.seg;
  const vx = bx - ax, vy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(x - (ax + t * vx), y - (ay + t * vy)) - r;
}

// Paths (plan coords) used by the return-current animation.
export function returnPaths(v) {
  // SWCLK: the debug clock, driven by the programmer on J2 into the STM32.
  const signal = [[16.54, 14], [16.54, 13.34], [6.0, 2.8], [4.3, 2.8]];
  const ret = v.slot
    ? [[4.3, 2.8], [6.0, 2.8], [10.6, 7.4], [7.7, 10.3], [8.4, 11.0], [11.3, 8.1], [16.54, 13.34], [16.54, 14]]
    : [[4.3, 2.8], [6.0, 2.8], [16.54, 13.34], [16.54, 14]];
  return { signal, ret };
}
// Diagonal slot cut across the SWCLK/SWDIO traces for the return-path technique.
const SLOT = [[8.783, 10.583], [14.783, 4.583], [14.217, 4.017], [8.217, 10.017]];

const VIA_TERMS = {
  via: ['via', 'annular-ring'],
  blind: ['blind-via', 'via'],
  thermal: ['thermal-vias', 'via'],
  stitch: ['stitching', 'via'],
};
const VIA_LABEL = {
  via: (v) => `Via — net ${v.net}`,
  blind: () => 'Blind microvia — connects L1 to the L2 ground plane only',
  thermal: () => 'Thermal via — carries heat from the regulator into the 3V3 plane',
  stitch: () => 'Stitching via — ties ground together around the board edge',
};

// ---------------------------------------------------------------- build
export function buildBoard(v) {
  const L = layout(v);
  const root = new THREE.Group();
  const groups = {};
  for (const id of LAYER_IDS) { const g = new THREE.Group(); g.name = id; groups[id] = g; root.add(g); }
  const barrelGroup = new THREE.Group();
  root.add(barrelGroup);
  const pickables = [];
  const barrels = [];
  const textures = [];

  const reg = (mesh, layer, terms, label, extra = {}) => {
    mesh.userData = { layer, terms, label, ...extra };
    pickables.push(mesh);
    return mesh;
  };

  const drills = [...L.vias, ...L.th];

  // ---- dielectric slabs
  const dielectric = (id, y0, t, mat, includeBlind, term, label) => {
    const s = boardShape();
    for (const d of drills) {
      if (d.kind === 'blind' && !includeBlind) continue;
      s.holes.push(circlePath(d.x, d.y, d.drill / 2));
    }
    for (const m of L.mholes) s.holes.push(circlePath(m.x, m.y, m.drill / 2));
    const mesh = new THREE.Mesh(extrude(s, t, 12), mat);
    mesh.position.y = y0;
    groups[id].add(reg(mesh, id, term, label));
  };
  dielectric('core', H.coreb, H.coret - H.coreb, MAT.core, false, ['substrate', 'stackup', 'pcb'], 'FR-4 core — the rigid fiberglass + epoxy heart of the board');
  dielectric('ppT', H.ppTb, H.ppTt - H.ppTb, MAT.prepreg, true, ['prepreg', 'stackup'], 'Prepreg — glues the top copper layer to the core');
  dielectric('ppB', H.ppBb, H.ppBt - H.ppBb, MAT.prepreg, false, ['prepreg', 'stackup'], 'Prepreg — glues the bottom copper layer to the core');

  // ---- inner planes
  const plane = (id, net, y0, term, label) => {
    const s = boardShape();
    for (const m of L.mholes) s.holes.push(circlePath(m.x, m.y, m.keep));
    for (const d of drills) {
      if (d.kind === 'blind' && id !== 'L2') continue;
      if (d.net === net) {
        s.holes.push(circlePath(d.x, d.y, d.drill / 2));
        const solid = v.solidRelief && d.ref === 'J2';
        if (d.th && !solid) {
          const r1 = d.pad / 2, r2 = r1 + 0.35, sw = 0.5;
          const h1 = Math.asin(sw / 2 / r1), h2 = Math.asin(sw / 2 / r2);
          for (let k = 0; k < 4; k++) {
            const base = (k * Math.PI) / 2;
            // Use the larger half-angle so spokes have parallel-ish sides.
            const a1 = base + Math.max(h1, h2), a2 = base + Math.PI / 2 - Math.max(h1, h2);
            s.holes.push(arcSlotPath(d.x, d.y, r1, r2, a1, a2));
          }
        }
      } else {
        s.holes.push(circlePath(d.x, d.y, d.pad / 2 + 0.25));
      }
    }
    if (net === 'GND' && v.slot) s.holes.push(polyShape(SLOT, THREE.Path));
    const mesh = new THREE.Mesh(extrude(s, 0.05, 12), MAT.plane);
    mesh.position.y = y0;
    groups[id].add(reg(mesh, id, [term, 'antipad', 'copper-layer', 'stackup'], label));
  };
  plane('L2', 'GND', H.l2b, 'ground-plane', v.slot ? 'L2 ground plane — with a slot cut through it (bad!)' : 'L2 — solid ground plane (GND)');
  plane('L3', '3V3', H.l3b, 'power-plane', 'L3 — 3.3 V power plane');

  // ---- outer copper: traces
  for (const t of L.traces) {
    const onTop = t.layer === 'L1';
    const mesh = new THREE.Mesh(traceGeo(t.pts, t.w, 0.05), MAT.copper);
    mesh.position.y = onTop ? H.l1b : H.l4b;
    const terms = [...(t.terms || ['trace']), 'copper-layer', 'net'];
    const where = onTop ? 'top layer (L1)' : 'bottom layer (L4)';
    groups[t.layer].add(reg(mesh, t.layer, terms, `Trace — net ${t.net}, ${t.w.toFixed(2)} mm wide, ${where}`, { tag: t.tag }));
  }

  // ---- copper pour
  {
    const mesh = new THREE.Mesh(extrude(polyShape(L.pour), 0.05), MAT.copper);
    mesh.position.y = H.l1b;
    groups.L1.add(reg(mesh, 'L1', ['pour', 'thermal-vias'], 'Copper pour — a solid 3V3 area that spreads heat from the regulator tab'));
  }

  // ---- SMD pads (exposed, gold finish)
  for (const p of L.pads) {
    const mesh = box(p.w, p.h, 0.055, MAT.gold, p.x, p.y, H.l1b);
    const nm = pinName(p.ref, p.n);
    const label = typeof p.n === 'number'
      ? `Pad — ${p.ref} pin ${p.n}${nm ? ` (${nm})` : ''}`
      : `Pad — ${p.ref} ${p.n}`;
    const terms = p.ref === 'U2' && p.n === 4 ? ['thermal-vias', 'pad'] : ['pad', 'footprint'];
    groups.L1.add(reg(mesh, 'L1', terms, label));
  }

  // ---- test points and fiducials
  for (const t of L.tps) {
    groups.L1.add(reg(cyl(t.r, 0.055, MAT.gold, t.x, t.y, H.l1b), 'L1', ['testpoint'], `${t.ref} — test point on net ${t.net}`));
  }
  for (const f of L.fids) {
    groups.L1.add(reg(cyl(0.5, 0.055, MAT.gold, f.x, f.y, H.l1b, 32), 'L1', ['fiducial'], 'Fiducial — an alignment target for the pick-and-place machine'));
  }

  // ---- via pads and barrels
  const ringCache = new Map();
  const ring = (outer, inner, square) => {
    const key = `${outer}|${inner}|${square}`;
    if (!ringCache.has(key)) {
      const s = square ? polyShape(rectPts(0, 0, outer, outer)) : circlePath(0, 0, outer / 2, THREE.Shape);
      s.holes.push(circlePath(0, 0, inner / 2));
      ringCache.set(key, extrude(s, 0.055, 20));
    }
    return ringCache.get(key);
  };
  const barrelGeo = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true);
  const addBarrel = (d, from, terms, label) => {
    const m = new THREE.Mesh(barrelGeo, MAT.barrel);
    m.scale.set(d.drill / 2, 1, d.drill / 2);
    m.position.set(d.x, 0, -d.y);
    barrelGroup.add(reg(m, 'barrel', terms, label));
    barrels.push({ mesh: m, from });
  };
  for (const d of L.vias) {
    const terms = VIA_TERMS[d.kind];
    const label = VIA_LABEL[d.kind](d);
    const top = new THREE.Mesh(ring(d.pad, d.drill), MAT.copper);
    top.position.set(d.x, H.l1b, -d.y);
    groups.L1.add(reg(top, 'L1', terms, label));
    if (d.kind !== 'blind') {
      const bot = new THREE.Mesh(ring(d.pad, d.drill), MAT.copper);
      bot.position.set(d.x, H.l4b - 0.005, -d.y);
      groups.L4.add(reg(bot, 'L4', terms, label));
    }
    addBarrel(d, d.kind === 'blind' ? 'L2' : 'L4', terms, label + ' (plated barrel)');
  }
  for (const t of L.th) {
    const label = `Plated through-hole pad — ${t.ref} ${typeof t.n === 'number' ? `pin ${t.n}` : t.n}${t.name ? ` (${t.name})` : ''}${t.square ? ', square = pin 1' : ''}`;
    const terms = t.square ? ['th-pad', 'pin1', 'annular-ring'] : ['th-pad', 'annular-ring'];
    for (const [layer, y] of [['L1', H.l1b], ['L4', H.l4b - 0.005]]) {
      const m = new THREE.Mesh(ring(t.pad, t.drill, t.square), MAT.gold);
      m.position.set(t.x, y, -t.y);
      groups[layer].add(reg(m, layer, terms, label));
    }
    addBarrel(t, 'L4', ['th-pad', 'annular-ring'], label + ' (plated barrel)');
  }

  // ---- solder mask (top + bottom) with openings
  const maskShape = (top) => {
    const s = boardShape();
    const g = 0.05;
    if (top) {
      for (const p of L.pads) s.holes.push(polyShape(rectPts(p.x, p.y, p.w + 2 * g, p.h + 2 * g), THREE.Path));
      for (const t of L.tps) s.holes.push(circlePath(t.x, t.y, t.r + g));
      for (const f of L.fids) s.holes.push(circlePath(f.x, f.y, 1.5));
    }
    for (const t of L.th) {
      if (t.square) s.holes.push(polyShape(rectPts(t.x, t.y, t.pad + 2 * g, t.pad + 2 * g), THREE.Path));
      else s.holes.push(circlePath(t.x, t.y, t.pad / 2 + g));
    }
    for (const m of L.mholes) s.holes.push(circlePath(m.x, m.y, 2.6));
    return s;
  };
  {
    const mt = new THREE.Mesh(extrude(maskShape(true), H.top - H.l1b, 16), MAT.mask);
    mt.position.y = H.l1b;
    mt.renderOrder = 2;
    groups.maskT.add(reg(mt, 'maskT', ['mask'], 'Solder mask (top) — the green protective coating'));
    const mb = new THREE.Mesh(extrude(maskShape(false), 0.08, 16), MAT.mask);
    mb.position.y = -0.03;
    mb.renderOrder = 2;
    groups.maskB.add(reg(mb, 'maskB', ['mask'], 'Solder mask (bottom)'));
  }

  // ---- silkscreen
  const bothSides = [
    ...L.th.map((t) => ({ c: [t.x, t.y, t.pad / 2 + 0.2] })),
    ...L.mholes.map((m) => ({ c: [m.x, m.y, 2.7] })),
  ];
  const topOnly = [
    ...L.pads.map((p) => ({ rect: [p.x, p.y, p.w + 0.3, p.h + 0.3] })),
    ...L.tps.map((t) => ({ c: [t.x, t.y, t.r + 0.15] })),
    ...L.fids.map((f) => ({ c: [f.x, f.y, 1.6] })),
  ];
  for (const top of [true, false]) {
    const silk = drawSilk(top, v, top ? [...topOnly, ...bothSides] : bothSides);
    textures.push(silk.texture);
    const geo = new THREE.PlaneGeometry(BOARD.w, BOARD.h);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: silk.texture, transparent: true, depthWrite: false, side: top ? THREE.FrontSide : THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = top ? H.top + 0.004 : -0.034;
    mesh.renderOrder = 3;
    const id = top ? 'silkT' : 'silkB';
    groups[id].add(reg(mesh, id, ['silkscreen'], top ? 'Silkscreen (top)' : 'Silkscreen (bottom)', { silk }));
  }

  // ---- mounting holes (non-plated): a label-only pick target ring in the core
  for (const m of L.mholes) {
    const geo = new THREE.CylinderGeometry(m.drill / 2, m.drill / 2, H.top + 0.03, 32, 1, true);
    const mesh = new THREE.Mesh(geo, MAT.core);
    mesh.position.set(m.x, (H.top - 0.03) / 2, -m.y);
    groups.core.add(reg(mesh, 'core', ['mounting-hole'], 'Mounting hole — 3.2 mm, non-plated, for an M3 screw'));
  }

  // ---- components
  buildComponents(L, groups.comps, reg);

  // ---- board outline highlight band (only shown when "outline" is highlighted)
  {
    const s = polyShape(roundRectPts(BOARD.w, BOARD.h, BOARD.r, 0.35));
    s.holes.push(polyShape(roundRectPts(BOARD.w, BOARD.h, BOARD.r, 0.02), THREE.Path));
    const geo = new THREE.ShapeGeometry(s);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, MAT.outline);
    mesh.position.y = H.top + 0.02;
    mesh.userData = { terms: ['outline'], onlyWhenHighlighted: true };
    mesh.visible = false;
    groups.silkT.add(mesh);
  }

  // ---- current-loop overlay for the decoupling technique
  if (v.showLoop) {
    const loopPts = v.decapFar
      ? [[-4.3, 2.8], [-5.8, 2.8], [-6.6, 3.6], [-6.6, 5.4], [-7.4, 6.2], [-11.8, 6.2], [-11.8, 6.9], [-3.3, 6.9], [-3.3, 5.5], [-2.8, 5.0], [-2.8, 4.3]]
      : [[-4.3, 2.8], [-5.8, 2.8], [-6.6, 3.6], [-6.6, 4.6], [-5.1, 4.6], [-5.1, 5.65], [-3.3, 5.5], [-2.8, 5.0], [-2.8, 4.3]];
    const geo = new THREE.ShapeGeometry(polyShape(loopPts));
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, MAT.loop);
    mesh.position.y = H.top + 0.05;
    mesh.renderOrder = 4;
    groups.silkT.add(reg(mesh, 'silkT', ['decap'], `Current loop area — ${v.decapFar ? 'large (bad): more inductance, more noise' : 'small (good): low inductance'}`, { noHighlight: true }));
  }

  return { root, groups, pickables, barrels, textures, layout: L };
}

// ---------------------------------------------------------------- components
function buildComponents(L, group, reg) {
  const z = H.top;
  for (const c of L.smd) {
    const g = new THREE.Group();
    g.name = c.ref;
    const parts = [];
    const vert = c.rot === 90;
    const sw = (w, d) => (vert ? [d, w] : [w, d]);
    switch (c.kind) {
      case 'qfp': {
        parts.push(box(7, 7, 1.4, markedMaterial(c.mark), c.x, c.y, z + 0.1));
        const dot = cyl(0.35, 0.02, MAT.plasticBlack, c.x - 2.6, c.y + 2.6, z + 1.5);
        parts.push(dot);
        for (const p of footprintPads(c)) {
          const horiz = p.w > p.h;
          const sx = Math.sign(horiz ? p.x - c.x : 0), sy = Math.sign(horiz ? 0 : p.y - c.y);
          const foot = horiz ? box(1.0, 0.3, 0.15, MAT.tin, c.x + sx * 4.35, p.y, z) : box(0.3, 1.0, 0.15, MAT.tin, p.x, c.y + sy * 4.35, z);
          const riser = horiz ? box(0.4, 0.3, 0.75, MAT.tin, c.x + sx * 3.75, p.y, z + 0.05) : box(0.3, 0.4, 0.75, MAT.tin, p.x, c.y + sy * 3.75, z + 0.05);
          parts.push(foot, riser);
        }
        break;
      }
      case 'sot223': {
        parts.push(box(6.5, 3.5, 1.6, markedMaterial(c.mark), c.x, c.y, z + 0.1));
        for (const dx of [-2.3, 0, 2.3]) parts.push(box(0.7, 1.7, 0.15, MAT.tin, c.x + dx, c.y - 2.55, z));
        parts.push(box(3.0, 1.7, 0.2, MAT.tin, c.x, c.y + 2.55, z));
        break;
      }
      case 'soic8': {
        parts.push(box(3.9, 4.9, 1.5, markedMaterial(c.mark), c.x, c.y, z + 0.1));
        for (let k = 0; k < 4; k++) {
          const y = c.y + 1.905 - 1.27 * k;
          parts.push(box(1.3, 0.42, 0.15, MAT.tin, c.x - 2.55, y, z), box(1.3, 0.42, 0.15, MAT.tin, c.x + 2.55, y, z));
        }
        const r = c.rot === 180 ? -1 : 1;
        parts.push(cyl(0.3, 0.02, MAT.plasticBlack, c.x - 1.2 * r, c.y + 1.7 * r, z + 1.6));
        break;
      }
      case 'cap':
      case 'res': {
        const body = c.kind === 'cap' ? MAT.ceramic : MAT.resBody;
        parts.push(box(...sw(1.0, 0.8), 0.8, body, c.x, c.y, z));
        for (const s of [-1, 1]) {
          const [dx, dy] = vert ? [0, s * 0.65] : [s * 0.65, 0];
          parts.push(box(...sw(0.3, 0.82), 0.82, MAT.tin, c.x + dx, c.y + dy, z));
        }
        break;
      }
      case 'led': {
        parts.push(box(1.6, 0.8, 0.3, MAT.ledWhite, c.x, c.y, z));
        parts.push(box(1.1, 0.7, 0.4, c.color === 'red' ? MAT.ledRed : MAT.ledGreen, c.x, c.y, z + 0.3));
        parts.push(box(0.12, 0.72, 0.31, MAT.icBody, c.x - 0.55, c.y, z)); // cathode band
        break;
      }
      case 'xtal': {
        parts.push(box(...sw(3.2, 1.5), 0.15, MAT.ceramic, c.x, c.y, z));
        parts.push(box(...sw(3.0, 1.3), 0.6, MAT.steel, c.x, c.y, z + 0.15));
        break;
      }
      case 'usb': {
        parts.push(box(6.4, 9.0, 3.2, MAT.steel, -29.8, 2.6, z));
        parts.push(box(0.06, 7.6, 2.2, MAT.dark, -33.02, 2.6, z + 0.5));
        for (const p of footprintPads(c)) parts.push(box(1.2, 0.28, 0.12, MAT.tin, -26.0, p.y, z));
        for (const y of [6.6, -1.4]) parts.push(box(0.7, 0.7, 3.4, MAT.steel, -28.8, y, -1.8));
        break;
      }
      default: break;
    }
    for (const p of parts) g.add(reg(p, 'comps', c.terms, c.label));
    group.add(g);
  }

  // Through-hole parts
  {
    const g = new THREE.Group();
    const terms = ['th', 'connector'];
    const label = 'J2 — 5-pin programming/debug header (through-hole, 2.54 mm pitch)';
    g.add(reg(box(12.7, 2.54, 2.5, MAT.plasticBlack, 19.08, 14, z), 'comps', terms, label));
    for (const t of L.th.filter((t) => t.ref === 'J2')) g.add(reg(box(0.64, 0.64, 11.4, MAT.pinGold, t.x, t.y, -2.9), 'comps', terms, label));
    group.add(g);
  }
  {
    const g = new THREE.Group();
    const terms = ['th', 'connector'];
    const label = 'J3 — 2-pin CAN bus screw terminal (through-hole)';
    g.add(reg(box(5.8, 6.4, 7.0, MAT.termGreen, 28.5, -10, z), 'comps', terms, label));
    for (const y of [-8.73, -11.27]) {
      g.add(reg(box(0.06, 1.8, 2.0, MAT.dark, 31.42, y, z + 1.2), 'comps', terms, label));
      g.add(reg(cyl(0.9, 0.3, MAT.steel, 29.0, y, z + 7.0), 'comps', terms, label));
      g.add(reg(box(1.4, 0.25, 0.05, MAT.dark, 29.0, y, z + 7.3), 'comps', terms, label));
      g.add(reg(box(0.8, 0.8, 3.0, MAT.tin, 27.5, y, -2.0), 'comps', terms, label));
    }
    group.add(g);
  }
}

// ---------------------------------------------------------------- silkscreen
function drawSilk(top, v, openings) {
  const S = SILK_PX, W = BOARD.w * S, Hh = BOARD.h * S;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = Hh;
  const ctx = cv.getContext('2d');
  const X = (x) => (x + BOARD.w / 2) * S, Y = (y) => (BOARD.h / 2 - y) * S;
  const ink = '#f5f5ef';
  ctx.strokeStyle = ink; ctx.fillStyle = ink;
  ctx.lineWidth = 0.15 * S; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const regions = [];

  const text = (s, x, y, size, term = 'refdes', label = null, weight = 700) => {
    ctx.save();
    ctx.font = `${weight} ${size * S}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.translate(X(x), Y(y));
    if (!top) ctx.scale(-1, 1);
    ctx.fillText(s, 0, 0);
    const w = ctx.measureText(s).width / S;
    ctx.restore();
    regions.push({ x0: x - w / 2 - 0.2, x1: x + w / 2 + 0.2, y0: y - size / 2 - 0.2, y1: y + size / 2 + 0.2, term, label: label || `Reference designator “${s}”` });
  };
  const line = (pts, closed = false) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
    if (closed) ctx.closePath();
    ctx.stroke();
  };
  const dot = (x, y, r, term = 'pin1', label = 'Pin 1 marker') => {
    ctx.beginPath(); ctx.arc(X(x), Y(y), r * S, 0, Math.PI * 2); ctx.fill();
    regions.push({ x0: x - r - 0.3, x1: x + r + 0.3, y0: y - r - 0.3, y1: y + r + 0.3, term, label });
  };
  const circle = (x, y, r) => { ctx.beginPath(); ctx.arc(X(x), Y(y), r * S, 0, Math.PI * 2); ctx.stroke(); };

  if (top) {
    // U1 corner marks + pin 1
    const q = 3.75, l = 0.8;
    line([[-q + l, q], [-q, q - 0 + 0], [-q, q - l]]);
    line([[q - l, q], [q, q], [q, q - l]]);
    line([[q - l, -q], [q, -q], [q, -q + l]]);
    line([[-q + l, -q], [-q, -q], [-q, -q + l]]);
    dot(-4.95, 3.65, 0.25, 'pin1', 'Pin 1 marker for U1');
    text('U1', -5.7, -5.3, 1.0);
    // U2
    line([[-24.95, 10.4], [-24.95, 13.6]]); line([[-18.05, 10.4], [-18.05, 13.6]]);
    text('U2', -26.6, 11.6, 1.0);
    // U3
    line([[14.2, -7.7], [17.8, -7.7]]); line([[14.2, -12.3], [17.8, -12.3]]);
    dot(13.15, -7.1, 0.22, 'pin1', 'Pin 1 marker for U3');
    text('U3', 16, -6.5, 1.0);
    // Y1 + load caps
    text('Y1', -8.6, -0.95, 0.9);
    text('C5', -10.6, 4.0, 0.9);
    text('C6', -10.6, -0.95, 0.9);
    // decoupling caps
    if (v.decapFar) text('C1', -10.6, 7.35, 0.9); else text('C1', -7.4, 5.75, 0.9);
    text('C2', -6.2, -3.45, 0.9);
    text('C3', 8.0, -3.55, 0.9);
    text('C4', -14.0, 7.6, 0.9);
    // U4 temperature sensor, BOOT0 and I²C pull-ups
    line([[-9.5, 13.6], [-6.5, 13.6]]); line([[-9.5, 8.4], [-6.5, 8.4]]);
    dot(-5.3, 8.3, 0.22, 'pin1', 'Pin 1 marker for U4 (it is rotated 180°)');
    text('U4', -8, 14.6, 1.0);
    text('R6', -3.3, 6.6, 0.8);
    text('R7', -3.0, 12.9, 0.8);
    text('R8', -6.0, 7.5, 0.8);
    // regulator caps
    text('C7', -16.4, 10.25, 0.9);
    text('C8', -16.0, 16.55, 0.9);
    text('R1', -15, -10.35, 0.9);
    text('R2', -15, -5.15, 0.9);
    text('D1', -19, -10.35, 0.9);
    text('D2', -19, -5.15, 0.9);
    text('R3', 24.6, -12.6, 0.9);
    text('R5', -21.7, -1.6, 0.9);
    // LED cathode bars
    for (const y of [-9, -6.5]) { ctx.save(); ctx.lineWidth = 0.22 * S; line([[-20.15, y + 0.7], [-20.15, y - 0.7]]); ctx.restore(); regions.push({ x0: -20.5, x1: -19.8, y0: y - 0.8, y1: y + 0.8, term: 'pin1', label: 'Cathode (−) marking for the LED' }); }
    // connectors
    text('J1', -27.4, -3.3, 1.0);
    line([[-26.7, -2.2], [-26.7, 7.4]]);
    line([[12.5, 12.5], [25.65, 12.5], [25.65, 15.5], [12.5, 15.5]], true);
    text('J2', 11.0, 14, 1.0);
    ['3V3', 'CLK', 'DIO', 'RST', 'GND'].forEach((s, i) => text(s, 14.0 + 2.54 * i, 16.4, 0.7, 'silkscreen', 'Pin labels — tell people what each header pin is'));
    line([[25.4, -6.6], [31.6, -6.6], [31.6, -13.4], [25.4, -13.4]], true);
    text('J3', 24.0, -6.2, 1.0);
    text('H', 26.0, -8.0, 0.7, 'silkscreen', 'Net label — CAN high');
    text('L', 26.0, -12.0, 0.7, 'silkscreen', 'Net label — CAN low');
    // test points
    text('TP1', -14.5, 19.65, 0.75); text('3V3', -14.5, 16.75, 0.6, 'silkscreen', 'Net label for the test point');
    text('TP2', -11.5, 19.65, 0.75); text('GND', -10.0, 16.8, 0.6, 'silkscreen', 'Net label for the test point');
    // mounting holes
    for (const [x, y] of [[-28.5, 18.5], [28.5, 18.5], [-28.5, -18.5], [28.5, -18.5]]) circle(x, y, 3.0);
    // USB label + logo
    text('USB', -27.6, 8.4, 0.8, 'silkscreen', 'Silkscreen label');
    text('CR FORMULA', 7.5, -16.2, 2.4, 'silkscreen', 'Silkscreen logo / board name', 800);
    text('PCB EXPLORER · REV A', 7.5, -18.9, 1.0, 'silkscreen', 'Board name and revision — always put a revision on your silkscreen', 600);
  } else {
    text('CR FORMULA', 0, 4, 2.6, 'silkscreen', 'Bottom silkscreen (mirrored so it reads correctly from below)', 800);
    text('4 LAYERS · 1.6 mm · ENIG', 0, 0.5, 1.2, 'silkscreen', 'Bottom silkscreen — board specs', 600);
    text('REV A  2026', 0, -2.2, 1.2, 'silkscreen', 'Bottom silkscreen — revision and date', 600);
    ['3V3', 'CLK', 'DIO', 'RST', 'GND'].forEach((s, i) => text(s, 14.0 + 2.54 * i, 11.9, 0.7, 'silkscreen', 'Bottom-side pin labels for the header'));
    for (const [x, y] of [[-28.5, 18.5], [28.5, 18.5], [-28.5, -18.5], [28.5, -18.5]]) circle(x, y, 3.0);
  }

  // Fab houses clip silkscreen off exposed copper; do the same.
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (const o of openings) {
    ctx.beginPath();
    if (o.rect) { const [x, y, w, h] = o.rect; ctx.rect(X(x - w / 2), Y(y + h / 2), w * S, h * S); }
    else { const [x, y, r] = o.c; ctx.arc(X(x), Y(y), r * S, 0, Math.PI * 2); }
    ctx.fill();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const alpha = ctx.getImageData(0, 0, W, Hh).data;
  return { texture, alpha, W, H: Hh, regions };
}
