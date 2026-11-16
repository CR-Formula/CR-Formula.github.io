// Tiny SVG helpers shared by the lesson modules. Every scene draws into a 1000 × 600 viewBox.

export const NS = 'http://www.w3.org/2000/svg';

export const C = {
  bg: '#151820',
  panel: '#1d212b',
  line: '#3a4150',
  grid: '#262b36',
  text: '#e6e8ee',
  muted: '#9aa3b2',
  dim: '#5b6372',
  accent: '#ffb020',
  green: '#3fd38a',
  red: '#ff6b6b',
  blue: '#36d6ff',
  pink: '#ff4fd8',
  purple: '#a78bfa',
  lime: '#a3e635',
  copper: '#d08550',
  chip: '#262a33',
  canh: '#ffb020',
  canl: '#36d6ff',
  sda: '#3fd38a',
  scl: '#a78bfa',
};

export function h(parent, tag, attrs = {}, text) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, v);
  if (text !== undefined) el.textContent = text;
  if (parent) parent.appendChild(el);
  return el;
}
export const g = (parent, attrs = {}) => h(parent, 'g', attrs);

export function txt(parent, x, y, s, o = {}) {
  return h(parent, 'text', {
    x, y,
    fill: o.fill || C.text,
    'font-size': o.size || 15,
    'font-weight': o.weight || 400,
    'text-anchor': o.anchor || 'start',
    'dominant-baseline': o.base || 'middle',
    'font-family': o.mono ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : null,
    opacity: o.opacity,
    class: o.cls,
  }, s);
}
export function rect(parent, x, y, w, hh, o = {}) {
  return h(parent, 'rect', {
    x, y, width: w, height: hh, rx: o.rx ?? 8,
    fill: o.fill ?? C.panel, stroke: o.stroke ?? C.line, 'stroke-width': o.sw ?? 1.5, opacity: o.opacity, class: o.cls,
    'stroke-dasharray': o.dash,
  });
}
export function line(parent, x1, y1, x2, y2, o = {}) {
  return h(parent, 'line', { x1, y1, x2, y2, stroke: o.stroke || C.line, 'stroke-width': o.sw || 2, 'stroke-dasharray': o.dash, opacity: o.opacity, 'stroke-linecap': 'round' });
}
export function path(parent, d, o = {}) {
  return h(parent, 'path', { d, fill: o.fill || 'none', stroke: o.stroke || C.line, 'stroke-width': o.sw || 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': o.dash, opacity: o.opacity });
}
export function circle(parent, cx, cy, r, o = {}) {
  return h(parent, 'circle', { cx, cy, r, fill: o.fill || C.text, stroke: o.stroke, 'stroke-width': o.sw, opacity: o.opacity });
}

// A labelled box ("chip"). Returns { g, box, title, sub }.
export function chip(parent, x, y, w, hh, title, sub, o = {}) {
  const grp = g(parent, { class: o.cls });
  const box = rect(grp, x, y, w, hh, { fill: o.fill || C.chip, stroke: o.stroke || C.line, sw: o.sw || 1.5, rx: o.rx ?? 10 });
  const t = txt(grp, x + w / 2, y + (sub ? hh / 2 - 9 : hh / 2), title, { anchor: 'middle', weight: 650, size: o.size || 16 });
  const st = sub ? txt(grp, x + w / 2, y + hh / 2 + 12, sub, { anchor: 'middle', size: o.subSize || 12.5, fill: C.muted }) : null;
  return { g: grp, box, title: t, sub: st };
}

// Vertical resistor symbol between (x, y1) and (x, y2), with a label.
export function resistor(parent, x, y1, y2, label, o = {}) {
  const grp = g(parent);
  const mid = (y1 + y2) / 2, len = Math.min(40, Math.abs(y2 - y1) - 8);
  line(grp, x, y1, x, mid - len / 2, { stroke: o.stroke || C.muted });
  line(grp, x, mid + len / 2, x, y2, { stroke: o.stroke || C.muted });
  rect(grp, x - 7, mid - len / 2, 14, len, { rx: 2, fill: o.fill || '#2b303b', stroke: o.stroke || C.muted });
  if (label) txt(grp, x + (o.left ? -12 : 12), mid, label, { size: 12.5, fill: C.muted, anchor: o.left ? 'end' : 'start' });
  return grp;
}

// Digital waveform path from a list of [t, level] steps. tx(t) → x, ly(level) → y. Small slope on edges.
export function stepPath(steps, tx, ly, slope = 0) {
  let d = '';
  steps.forEach(([t, lv], i) => {
    const x = tx(t), y = ly(lv);
    if (i === 0) { d += `M${x},${y}`; return; }
    const prev = ly(steps[i - 1][1]);
    if (prev !== y) d += `L${x - slope},${prev}L${x + slope},${y}`;
    else d += `L${x},${y}`;
  });
  return d;
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
export const hex = (n, w = 2) => '0x' + n.toString(16).toUpperCase().padStart(w, '0');
export const bin = (n, w) => n.toString(2).padStart(w, '0');

// Position along a polyline (array of [x, y]) at fraction k ∈ [0, 1].
export function along(pts, k) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push(l); total += l;
  }
  let d = clamp(k, 0, 1) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? d / segs[i] : 0;
      return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
}
export const polyD = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('');

// Small "clickable" helper for SVG elements.
export function clickable(el, fn) {
  el.style.cursor = 'pointer';
  el.addEventListener('click', fn);
  return el;
}
