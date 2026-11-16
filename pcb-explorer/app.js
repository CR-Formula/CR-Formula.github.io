import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBoard, returnPaths, LAYER_IDS, H, BOARD, MAT } from './board.js';
import { TERMS, CATEGORIES, TECHNIQUES, TOUR, LAYER_INFO } from './content.js';
import { LessonPlayer } from './lessons/engine.js';
import { CAN_MODULE } from './lessons/can.js';
import { I2C_MODULE } from './lessons/i2c.js';
import { MCU_MODULE } from './lessons/mcu.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------------------------------------------ renderer / scene
const MODULES = { can: CAN_MODULE, i2c: I2C_MODULE, mcu: MCU_MODULE };
const MODULE_NAMES = { can: 'CAN Bus', i2c: 'I²C', mcu: 'Microcontroller' };
const pcbMain = $('#pcb');
const lessonMain = $('#lesson');
const viewport = $('#viewport');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (e) {
  viewport.innerHTML = '<div class="error">Sorry, your browser could not start WebGL, which the 3D model needs. You can still read the Glossary and Techniques tabs.</div>';
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
let controls;
if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  viewport.prepend(renderer.domElement);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 220;
  controls.screenSpacePanning = true;
}
scene.add(new THREE.HemisphereLight(0xffffff, 0x303644, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(30, 70, 40);
scene.add(sun);
const under = new THREE.DirectionalLight(0xbfd4ff, 0.5);
under.position.set(-20, -60, -30);
scene.add(under);

function resize() {
  if (!renderer) return;
  const r = viewport.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / Math.max(1, r.height);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);

// ------------------------------------------------------------------ state
const DEFAULT_VARIANTS = { corners90: false, decapFar: false, slot: false, solidRelief: false, vbusW: 0.8, showLoop: false };
const state = {
  explode: 0,
  hidden: new Set(),
  v: { ...DEFAULT_VARIANTS },
  highlight: [],
  selectedTerm: null,
  tech: null,
  returnAnim: false,
  clipOn: false,
  clipY: 14,
  tourIdx: -1,
};
let board = null;
const hiMats = new Set();
let inModel = new Set();
let particles = null;

const SPACING = 2.4;
const offset = (id) => (LAYER_IDS.indexOf(id) - 5) * state.explode * SPACING;

function rebuild() {
  if (board) disposeBoard(board);
  board = buildBoard(state.v);
  scene.add(board.root);
  inModel = new Set(['outline']);
  board.pickables.forEach((m) => m.userData.terms.forEach((t) => inModel.add(t)));
  applyExplode();
  applyVisibility();
  applyHighlight();
  buildParticles();
}
function disposeBoard(b) {
  scene.remove(b.root);
  b.root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    if (o.userData.silk) o.userData.baseMat ? o.userData.baseMat.dispose() : o.material.dispose();
  });
  hiMats.forEach((m) => m.dispose());
  hiMats.clear();
  b.textures.forEach((t) => t.dispose());
}

function applyExplode() {
  if (!board) return;
  for (const id of LAYER_IDS) board.groups[id].position.y = offset(id);
  const top = H.l1t + 0.005 + offset('L1');
  for (const b of board.barrels) {
    const bottom = b.from === 'L2' ? H.l2b + offset('L2') : H.l4b - 0.005 + offset('L4');
    b.mesh.position.y = (top + bottom) / 2;
    b.mesh.scale.y = Math.max(0.01, top - bottom);
  }
  $('#explode').value = state.explode;
}
function setExplode(e) { state.explode = e; applyExplode(); }

function applyVisibility() {
  if (!board) return;
  for (const id of LAYER_IDS) board.groups[id].visible = !state.hidden.has(id);
  $$('#stack input').forEach((el) => { el.checked = !state.hidden.has(el.dataset.layer); });
}
function setHidden(list) { state.hidden = new Set(list || []); applyVisibility(); }

// ------------------------------------------------------------------ highlighting
function makeHi(mat) {
  if (Array.isArray(mat)) return mat.map(makeHi);
  const h = mat.clone();
  if (h.emissive) { h.emissive = new THREE.Color(0xff9d14); h.emissiveIntensity = 0.6; }
  else h.color = new THREE.Color(0xffcf5c);
  if (h.transparent && h.opacity < 1) h.opacity = Math.min(0.92, h.opacity + 0.08);
  hiMats.add(h);
  return h;
}
function applyHighlight() {
  if (!board) return;
  const set = new Set(state.highlight);
  for (const m of board.pickables) {
    const on = !m.userData.noHighlight && m.userData.terms.some((t) => set.has(t));
    if (on) {
      if (!m.userData.baseMat) m.userData.baseMat = m.material;
      if (!m.userData.hiMat) m.userData.hiMat = makeHi(m.userData.baseMat);
      m.material = m.userData.hiMat;
    } else if (m.userData.baseMat) {
      m.material = m.userData.baseMat;
    }
  }
  board.root.traverse((o) => { if (o.userData.onlyWhenHighlighted) o.visible = o.userData.terms.some((t) => set.has(t)); });
  // Make the mask see-through while highlighting copper that sits underneath it.
  const buried = board.pickables.some((m) => ['L1', 'L4', 'barrel'].includes(m.userData.layer) && m.userData.terms.some((t) => set.has(t)));
  MAT.mask.opacity = buried ? 0.45 : 0.86;
}
function setHighlight(terms) { state.highlight = terms || []; applyHighlight(); }

// ------------------------------------------------------------------ camera moves
let camAnim = null;
const toWorld = (x, y, h = H.top) => new THREE.Vector3(x, h, -y);
function viewToPose(v) {
  const target = toWorld(v.t[0], v.t[1], 0.8);
  const az = THREE.MathUtils.degToRad(v.az || 0), el = THREE.MathUtils.degToRad(v.el ?? 45);
  // Distances of 60+ are "whole board" views: scale them so the board fits this viewport's aspect.
  const d = v.d >= 60 ? (fitDistance() * v.d) / 70 : v.d * 1.5;
  const pos = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(d).add(target);
  return { pos, target };
}
function fitDistance() {
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  return Math.max((BOARD.h / 2) * 1.12 / t, (BOARD.w / 2) * 1.12 / (t * camera.aspect));
}
function flyTo(v, dur = 900) {
  if (!controls) return;
  const { pos, target } = viewToPose(v);
  camAnim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), dur };
}
function flyToTerm(id) {
  if (!board || !controls) return;
  const box = new THREE.Box3();
  let n = 0;
  for (const m of board.pickables) {
    if (!m.userData.terms.includes(id)) continue;
    box.expandByObject(m);
    n++;
  }
  if (!n) return;
  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  const dist = THREE.MathUtils.clamp(Math.max(s.x, s.z, s.y * 2) * 1.5, 12, 90);
  const dir = camera.position.clone().sub(controls.target).normalize();
  if (dir.y < 0.35 && !state.hidden.has('maskB')) dir.y = 0.35;
  dir.normalize();
  camAnim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: c.clone().add(dir.multiplyScalar(dist)), t1: c, start: performance.now(), dur: 900 };
}
const VIEWS = {
  iso: { t: [0, 0], d: 80, az: 28, el: 44 },
  top: { t: [0, 0], d: 70, az: 0, el: 89.9 },
  bottom: { t: [0, 0], d: 70, az: 180, el: -89.9 }, // az 180 = flipped like turning the board over left-to-right
  side: { t: [0, 0], d: 70, az: 0, el: 3 },
};

// ------------------------------------------------------------------ return-path particles
function buildParticles() {
  particles = null;
  if (!state.returnAnim || !board) return;
  const { signal, ret } = returnPaths(state.v);
  const mk = (pts, color, group, h) => {
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segs.push({ a: pts[i], b: pts[i + 1], len, s0: total });
      total += len;
    }
    const geo = new THREE.SphereGeometry(0.26, 12, 8);
    const mat = new THREE.MeshBasicMaterial({ color });
    const dots = [];
    const n = Math.round(total / 2.2);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.y = h;
      group.add(m);
      dots.push(m);
    }
    return { segs, total, dots, n };
  };
  particles = [
    mk(signal, 0x36d6ff, board.groups.L1, H.l1t + 0.2),
    mk(ret, 0xff4fd8, board.groups.L2, H.l2t + 0.15),
  ];
}
function updateParticles(t) {
  if (!particles) return;
  for (const p of particles) {
    p.dots.forEach((m, i) => {
      const s = ((t * 0.006 + (i / p.n) * p.total) % p.total + p.total) % p.total;
      const seg = p.segs.find((sg) => s >= sg.s0 && s <= sg.s0 + sg.len) || p.segs[p.segs.length - 1];
      const k = (s - seg.s0) / seg.len;
      m.position.x = seg.a[0] + (seg.b[0] - seg.a[0]) * k;
      m.position.z = -(seg.a[1] + (seg.b[1] - seg.a[1]) * k);
    });
  }
}

// ------------------------------------------------------------------ picking
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const visibleChain = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };

function silkHit(obj, hit) {
  const s = obj.userData.silk;
  if (!hit.uv) return null;
  const cx = Math.floor(hit.uv.x * s.W), cy = Math.floor((1 - hit.uv.y) * s.H);
  let found = false;
  for (let dy = -4; dy <= 4 && !found; dy += 4) {
    for (let dx = -4; dx <= 4; dx += 4) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= s.W || y >= s.H) continue;
      if (s.alpha[(y * s.W + x) * 4 + 3] > 40) { found = true; break; }
    }
  }
  if (!found) return null;
  const px = hit.uv.x * BOARD.w - BOARD.w / 2, py = hit.uv.y * BOARD.h - BOARD.h / 2;
  const r = s.regions.find((g) => px >= g.x0 && px <= g.x1 && py >= g.y0 && py <= g.y1);
  if (r) return { terms: [r.term, 'silkscreen'], label: r.label };
  return { terms: ['silkscreen'], label: 'Silkscreen line' };
}

function pick(clientX, clientY) {
  if (!board || !renderer) return null;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(board.pickables, false);
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i], o = h.object;
    if (!visibleChain(o)) continue;
    if (state.clipOn && -h.point.z < state.clipY) continue;
    if (o.userData.silk) { const s = silkHit(o, h); if (s) return s; continue; }
    if (o.userData.layer === 'maskT' || o.userData.layer === 'maskB') {
      const want = o.userData.layer === 'maskT' ? 'L1' : 'L4';
      for (let j = i + 1; j < hits.length; j++) {
        const h2 = hits[j];
        if (h2.distance - h.distance > 0.35) break;
        if (h2.object.userData.layer === want && visibleChain(h2.object)) return { terms: h2.object.userData.terms, label: h2.object.userData.label + ' (under the solder mask)' };
      }
    }
    return { terms: o.userData.terms, label: o.userData.label };
  }
  return null;
}

const tooltip = $('#tooltip');
let hoverPending = null;
let down = null;
if (renderer) {
  const el = renderer.domElement;
  el.addEventListener('pointermove', (e) => { hoverPending = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerleave', () => { hoverPending = null; tooltip.style.display = 'none'; el.style.cursor = ''; });
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
    down = null;
    const p = pick(e.clientX, e.clientY);
    $('#hint').style.opacity = 0;
    if (p) selectTerm(p.terms[0], { label: p.label, fly: false });
    else clearSelection();
  });
}
function doHover() {
  if (!hoverPending) return;
  const { x, y } = hoverPending;
  hoverPending = null;
  if (camAnim) return;
  const p = pick(x, y);
  const r = viewport.getBoundingClientRect();
  if (p) {
    tooltip.innerHTML = `${esc(p.label)}<div class="muted small">Click to learn: ${esc(TERMS[p.terms[0]]?.name || '')}</div>`;
    tooltip.style.left = `${x - r.left}px`;
    tooltip.style.top = `${y - r.top}px`;
    tooltip.style.display = 'block';
    renderer.domElement.style.cursor = 'pointer';
  } else {
    tooltip.style.display = 'none';
    renderer.domElement.style.cursor = '';
  }
}

// ------------------------------------------------------------------ info panel
const info = $('#info');
function termLink(id) {
  const t = TERMS[id];
  return t ? `<button class="chip" data-term="${id}">${esc(t.name)}</button>` : '';
}
function showInfo(id, label) {
  const t = TERMS[id];
  if (!t) return;
  const tips = t.tips && t.tips.length ? `<h4>Design tips</h4><ul class="tips">${t.tips.map((x) => `<li>${x}</li>`).join('')}</ul>` : '';
  const rel = t.related && t.related.length ? `<h4>Related</h4><div class="chips">${t.related.map(termLink).join('')}</div>` : '';
  const show = inModel.has(id) ? `<div class="actions"><button class="btn" data-fly="${id}">Show me on the board</button></div>` : '<p class="muted small" style="margin-top:10px">This is a general concept, so it isn’t highlighted on the model.</p>';
  info.innerHTML = `<button class="close" aria-label="Close">×</button>
    <div class="kicker">${esc(t.cat)}</div><h2>${esc(t.name)}</h2>
    ${label ? `<div class="clicked">${esc(label)}</div>` : ''}
    <p class="lead">${t.short}</p>${t.body || ''}${tips}${rel}${show}
    ${t.module ? `<button class="btn primary module-btn" data-open-module="${t.module}">Open the ${esc(MODULE_NAMES[t.module])} module →</button>` : ''}`;
  info.classList.add('show');
  info.scrollTop = 0;
}
info.addEventListener('click', (e) => {
  if (e.target.closest('.close')) { clearSelection(); return; }
  const chip = e.target.closest('[data-term]');
  if (chip) { selectTerm(chip.dataset.term, { fly: true }); return; }
  const fly = e.target.closest('[data-fly]');
  if (fly) flyToTerm(fly.dataset.fly);
  const mod = e.target.closest('[data-open-module]');
  if (mod) openModule(mod.dataset.openModule);
});

function selectTerm(id, { label = null, fly = false } = {}) {
  if (!TERMS[id]) return;
  state.selectedTerm = id;
  setHighlight([id]);
  showInfo(id, label);
  if (fly && inModel.has(id)) flyToTerm(id);
  $$('.gitem').forEach((g) => g.classList.toggle('sel', g.dataset.term === id));
  try { history.replaceState(null, '', `#${id}`); } catch (e) { /* file:// */ }
}
function clearSelection() {
  state.selectedTerm = null;
  info.classList.remove('show');
  setHighlight(state.tech ? (state.tech.highlight || state.tech.terms) : []);
  $$('.gitem').forEach((g) => g.classList.remove('sel'));
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
}

// ------------------------------------------------------------------ tabs
function setTab(name) {
  $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  $$('.tab').forEach((t) => t.classList.toggle('active', t.id === `tab-${name}`));
}
$$('.tabs button').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));

// ------------------------------------------------------------------ learn / tour
const learn = $('#tab-learn');
function renderLearn() {
  if (state.tourIdx < 0) {
    learn.innerHTML = `
      <div class="tour-step">Start here</div>
      <h2 class="tour-title">Learn how a PCB is built</h2>
      <div class="tour-body"><p>New to board design? Take a 2-minute guided tour of a real 4-layer board: what it’s made of, what everything is called, and why it’s there.</p></div>
      <div class="tour-nav"><button class="btn primary" data-act="start">Start the tour →</button></div>
      <div class="start-cards">
        <button class="start-card" data-goto="techniques"><b>Design techniques</b><span>Flip between good and bad layout choices: decoupling, return paths, thermal reliefs…</span></button>
        <button class="start-card" data-goto="glossary"><b>Glossary</b><span>${Object.keys(TERMS).length} PCB terms in plain language, most linked to the 3D model.</span></button>
        <button class="start-card" data-goto="layers"><b>Layers & cross-section</b><span>Show, hide and slice through the layer stackup.</span></button>
      </div>
      <div class="tour-step" style="margin-top:22px">More modules</div>
      <div class="start-cards" style="margin-top:8px">
        <button class="start-card" data-module="can"><b>CAN Bus →</b><span>How the car’s controllers share two wires: differential signals, frames, arbitration, errors.</span></button>
        <button class="start-card" data-module="i2c"><b>I²C →</b><span>The two-wire sensor bus: pull-ups, START/STOP, addresses, ACK, a real temperature read.</span></button>
        <button class="start-card" data-module="mcu"><b>Microcontroller →</b><span>Inside the STM32F042: pinout, clocks, boot, running code, GPIO, interrupts, SWD.</span></button>
      </div>
      <p class="muted small" style="margin-top:18px">Tip: you can click anything on the board, including a trace, via, pad, label or part, to see what it is.</p>`;
    return;
  }
  const s = TOUR[state.tourIdx];
  const n = TOUR.length;
  learn.innerHTML = `
    <div class="tour-progress">${TOUR.map((_, i) => `<span class="${i <= state.tourIdx ? 'done' : ''}" data-step="${i}" title="Step ${i + 1}"></span>`).join('')}</div>
    <div class="tour-step">Step ${state.tourIdx + 1} of ${n}</div>
    <h2 class="tour-title">${esc(s.title)}</h2>
    <div class="tour-body">${s.body}</div>
    ${s.terms.length ? `<div class="chips" style="margin-top:6px">${s.terms.map(termLink).join('')}</div>` : ''}
    <div class="tour-nav">
      <button class="btn" data-act="prev" ${state.tourIdx === 0 ? 'disabled' : ''}>← Back</button>
      ${state.tourIdx < n - 1 ? '<button class="btn primary" data-act="next">Next →</button>' : '<button class="btn primary" data-act="techniques">Try the techniques →</button>'}
      <button class="btn" data-act="exit" style="margin-left:auto">Exit</button>
    </div>`;
}
function goStep(i) {
  deactivateTech(false);
  state.tourIdx = i;
  const s = TOUR[i];
  setHidden(s.hidden);
  setExplode(s.explode);
  info.classList.remove('show');
  state.selectedTerm = null;
  setHighlight(s.highlight || s.terms);
  flyTo(s.view, 1100);
  renderLearn();
}
learn.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]');
  const chip = e.target.closest('[data-term]');
  const step = e.target.closest('[data-step]');
  const go = e.target.closest('[data-goto]');
  const mod = e.target.closest('[data-module]');
  if (mod) { openModule(mod.dataset.module); return; }
  if (chip) { selectTerm(chip.dataset.term, { fly: false }); return; }
  if (step) { goStep(+step.dataset.step); return; }
  if (go) { setTab(go.dataset.goto); return; }
  if (!a) return;
  const act = a.dataset.act;
  if (act === 'start') goStep(0);
  else if (act === 'next') goStep(Math.min(TOUR.length - 1, state.tourIdx + 1));
  else if (act === 'prev') goStep(Math.max(0, state.tourIdx - 1));
  else if (act === 'techniques') { setTab('techniques'); }
  else if (act === 'exit') { state.tourIdx = -1; setHighlight([]); setHidden([]); setExplode(0); flyTo(VIEWS.iso); renderLearn(); }
});

// ------------------------------------------------------------------ techniques
const techList = $('#tech-list');
function calcWidth(I, dT, oz, internal) {
  const k = internal ? 0.024 : 0.048;
  const area = Math.pow(I / (k * Math.pow(dT, 0.44)), 1 / 0.725); // mil²
  const mil = area / (oz * 1.378);
  return { mil, mm: mil * 0.0254 };
}
function renderTechniques() {
  techList.innerHTML = TECHNIQUES.map((t) => `
    <div class="tech" data-tech="${t.id}">
      <button aria-expanded="false"><b>${esc(t.title)}</b><span>${esc(t.summary)}</span></button>
      <div class="detail">
        ${t.body}
        ${t.toggle ? `<label class="toggle"><input type="checkbox" data-toggle="${t.toggle.key}"><span class="state"><span class="good">${esc(t.toggle.off)}</span></span></label>` : ''}
        ${t.calculator ? `<div class="calc">
          <label>Current: <b class="cur-out">1.0 A</b><input type="range" min="0.1" max="5" step="0.1" value="1" data-calc="I"></label>
          <div class="row">
            <label>Allowed temp. rise<select data-calc="dT"><option value="10" selected>10 °C</option><option value="20">20 °C</option><option value="30">30 °C</option></select></label>
            <label>Copper weight<select data-calc="oz"><option value="1" selected>1 oz (35 µm)</option><option value="2">2 oz (70 µm)</option></select></label>
          </div>
          <label>Layer<select data-calc="layer"><option value="ext" selected>Outer layer (L1/L4)</option><option value="int">Inner layer (L2/L3)</option></select></label>
          <div><div class="small muted">Minimum trace width (IPC-2221)</div><div class="result calc-out"></div><div class="small muted calc-note"></div></div>
        </div>` : ''}
        ${t.altView ? `<div style="margin-top:10px" class="chips"><button class="chip" data-view-main>Look at the USB pair</button><button class="chip" data-view-alt>${esc(t.altLabel)}</button></div>` : ''}
        <div class="chips" style="margin-top:12px">${t.terms.map(termLink).join('')}</div>
      </div>
    </div>`).join('');
}
function deactivateTech(resetView = true) {
  if (!state.tech) return;
  state.tech = null;
  state.returnAnim = false;
  state.v = { ...DEFAULT_VARIANTS };
  $$('.tech').forEach((el) => { el.classList.remove('open'); el.querySelector('button').setAttribute('aria-expanded', 'false'); });
  $$('[data-toggle]').forEach((i) => { i.checked = false; updateToggleLabel(i); });
  rebuild();
  if (resetView) { setHidden([]); setExplode(0); setHighlight([]); }
}
function activateTech(id) {
  const t = TECHNIQUES.find((x) => x.id === id);
  if (state.tech && state.tech.id === id) { deactivateTech(); return; }
  if (state.tech) deactivateTech(false);
  state.tourIdx = -1; renderLearn();
  state.tech = t;
  state.v = { ...DEFAULT_VARIANTS, showLoop: !!t.loop };
  state.returnAnim = !!t.returnAnim;
  const el = $(`.tech[data-tech="${id}"]`);
  el.classList.add('open');
  el.querySelector('button').setAttribute('aria-expanded', 'true');
  if (t.calculator) state.v.vbusW = updateCalc(el, false);
  rebuild();
  setHidden(t.hidden || []);
  setExplode(t.explode || 0);
  info.classList.remove('show');
  state.selectedTerm = null;
  setHighlight(t.highlight || t.terms);
  flyTo(t.view, 1100);
  setTimeout(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
}
function updateToggleLabel(input) {
  const t = TECHNIQUES.find((x) => x.toggle && x.toggle.key === input.dataset.toggle);
  const span = input.parentElement.querySelector('.state');
  span.innerHTML = input.checked ? `<span class="bad">${esc(t.toggle.on)}</span>` : `<span class="good">${esc(t.toggle.off)}</span>`;
}
function updateCalc(el, apply = true) {
  const I = +el.querySelector('[data-calc=I]').value;
  const dT = +el.querySelector('[data-calc=dT]').value;
  const oz = +el.querySelector('[data-calc=oz]').value;
  const internal = el.querySelector('[data-calc=layer]').value === 'int';
  const { mil, mm } = calcWidth(I, dT, oz, internal);
  el.querySelector('.cur-out').textContent = `${I.toFixed(1)} A`;
  el.querySelector('.calc-out').innerHTML = `${mm.toFixed(2)} mm <small>(${mil.toFixed(1)} mil)</small>`;
  const shown = THREE.MathUtils.clamp(mm, 0.2, 1.6);
  el.querySelector('.calc-note').textContent = shown !== mm
    ? `Shown on the board as ${shown.toFixed(2)} mm (the model limits it to 0.2–1.6 mm).`
    : 'The VBUS trace on the board is now drawn at this width.';
  if (apply) { state.v.vbusW = shown; scheduleRebuild(); }
  return shown;
}
let rebuildQueued = false;
function scheduleRebuild() {
  if (rebuildQueued) return;
  rebuildQueued = true;
  requestAnimationFrame(() => { rebuildQueued = false; rebuild(); });
}
techList.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-term]');
  if (chip) { selectTerm(chip.dataset.term, { fly: false }); return; }
  if (e.target.closest('[data-view-alt]')) { const t = state.tech; if (t) flyTo(t.altView); return; }
  if (e.target.closest('[data-view-main]')) { const t = state.tech; if (t) flyTo(t.view); return; }
  const head = e.target.closest('.tech > button');
  if (head) activateTech(head.parentElement.dataset.tech);
});
techList.addEventListener('change', (e) => {
  const tg = e.target.closest('[data-toggle]');
  if (tg) {
    state.v[tg.dataset.toggle] = tg.checked;
    updateToggleLabel(tg);
    rebuild();
    return;
  }
  const calc = e.target.closest('[data-calc]');
  if (calc) updateCalc(calc.closest('.tech'));
});
techList.addEventListener('input', (e) => {
  const calc = e.target.closest('[data-calc]');
  if (calc) updateCalc(calc.closest('.tech'));
});

// ------------------------------------------------------------------ glossary
const glist = $('#glist');
function renderGlossary(q = '') {
  const query = q.trim().toLowerCase();
  const html = CATEGORIES.map((cat) => {
    const items = Object.entries(TERMS)
      .filter(([, t]) => t.cat === cat)
      .filter(([id, t]) => !query || t.name.toLowerCase().includes(query) || t.short.toLowerCase().includes(query) || id.includes(query))
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
    if (!items.length) return '';
    return `<div class="gcat">${esc(cat)}</div>` + items.map(([id, t]) => `
      <button class="gitem${state.selectedTerm === id ? ' sel' : ''}" data-term="${id}">
        <b>${esc(t.name)}</b>${inModel.has(id) ? '<span class="tag">3D</span>' : ''}
        <p>${t.short}</p>
      </button>`).join('');
  }).join('');
  glist.innerHTML = html || '<p class="muted">No matching terms.</p>';
}
$('#gsearch').addEventListener('input', (e) => renderGlossary(e.target.value));
glist.addEventListener('click', (e) => {
  const b = e.target.closest('[data-term]');
  if (b) selectTerm(b.dataset.term, { fly: true });
});

// ------------------------------------------------------------------ layers panel
const stackEl = $('#stack');
stackEl.innerHTML = LAYER_INFO.map((l) => `
  <div class="lrow">
    <input type="checkbox" checked data-layer="${l.id}" aria-label="Show ${esc(l.name)}">
    <span class="sw" style="background:${l.color}"></span>
    <button data-term="${l.term}"><b>${esc(l.name)}</b><small>${esc(l.detail)}</small></button>
  </div>`).join('');
stackEl.addEventListener('change', (e) => {
  const cb = e.target.closest('[data-layer]');
  if (!cb) return;
  if (cb.checked) state.hidden.delete(cb.dataset.layer); else state.hidden.add(cb.dataset.layer);
  applyVisibility();
});
stackEl.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-term]');
  if (b) selectTerm(b.dataset.term, { fly: false });
});
const PRESETS = {
  all: { hidden: [] },
  bare: { hidden: ['maskT', 'silkT', 'comps'], view: { t: [0, 0], d: 70, az: 0, el: 70 } },
  gnd: { hidden: ['silkT', 'maskT', 'L1', 'ppT', 'comps'], view: { t: [0, 0], d: 70, az: 0, el: 70 }, term: 'ground-plane' },
  pwr: { hidden: ['silkT', 'maskT', 'L1', 'ppT', 'L2', 'core', 'comps'], view: { t: [0, 0], d: 70, az: 0, el: 70 }, term: 'power-plane' },
  bottom: { hidden: ['maskB', 'silkB'], view: VIEWS.bottom },
};
$('.presets').addEventListener('click', (e) => {
  const b = e.target.closest('[data-preset]');
  if (!b) return;
  const p = PRESETS[b.dataset.preset];
  setHidden(p.hidden);
  if (p.view) flyTo(p.view);
  if (p.term) selectTerm(p.term);
});
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), -14);
function applyClip() {
  if (!renderer) return;
  clipPlane.constant = -state.clipY;
  renderer.clippingPlanes = state.clipOn ? [clipPlane] : [];
}
$('#clip-on').addEventListener('change', (e) => {
  state.clipOn = e.target.checked;
  applyClip();
  if (state.clipOn) flyTo({ t: [10, state.clipY], d: 34, az: 12, el: 18 });
});
$('#clip-y').addEventListener('input', (e) => { state.clipY = +e.target.value; applyClip(); });

// ------------------------------------------------------------------ toolbar
$$('.toolbar [data-view]').forEach((b) => b.addEventListener('click', () => flyTo(VIEWS[b.dataset.view])));
$('#explode').addEventListener('input', (e) => setExplode(+e.target.value));
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') clearSelection();
});

// ------------------------------------------------------------------ main loop
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function tick(now) {
  requestAnimationFrame(tick);
  if (camAnim) {
    const k = Math.min(1, (now - camAnim.start) / camAnim.dur);
    const e = ease(k);
    camera.position.lerpVectors(camAnim.p0, camAnim.p1, e);
    controls.target.lerpVectors(camAnim.t0, camAnim.t1, e);
    if (k >= 1) camAnim = null;
  }
  controls.update();
  const pulse = 0.4 + 0.3 * Math.sin(now * 0.005);
  hiMats.forEach((m) => { if (m.emissive) m.emissiveIntensity = pulse; });
  updateParticles(now);
  if (pcbMain.hidden) return;
  doHover();
  renderer.render(scene, camera);
}

// ------------------------------------------------------------------ boot
renderLearn();
renderTechniques();
if (renderer) {
  rebuild();
  resize();
  const { pos, target } = viewToPose(VIEWS.iso);
  camera.position.copy(pos);
  controls.target.copy(target);
  requestAnimationFrame(tick);
}
renderGlossary();

// ------------------------------------------------------------------ lesson modules
const player = new LessonPlayer({ side: $('#lesson-side'), stage: $('#lesson-stage'), onBoard: (b) => showOnBoard(b) });
function openModule(id, step = 0) {
  const lesson = id !== 'pcb' && MODULES[id];
  $$('.modules [data-module]').forEach((b) => {
    if (b.dataset.module === (lesson ? id : 'pcb')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  if (!lesson) {
    player.close();
    lessonMain.hidden = true;
    pcbMain.hidden = false;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
  } else {
    pcbMain.hidden = true;
    lessonMain.hidden = false;
    player.open(lesson, step);
  }
  window.scrollTo(0, 0);
}
function showOnBoard(b) {
  openModule('pcb');
  deactivateTech();
  state.tourIdx = -1;
  renderLearn();
  setHidden([]);
  setExplode(0);
  selectTerm(b.terms[0], { fly: true });
  setHighlight(b.terms);
}
$$('.modules [data-module]').forEach((b) => b.addEventListener('click', () => openModule(b.dataset.module)));
player.onModule = (id) => openModule(id);
player.onStep = (id, i) => { try { history.replaceState(null, '', `#${id}/${i + 1}`); } catch (e) { /* ignore */ } };

const hash = decodeURIComponent(location.hash.slice(1));
const [hMod, hStep] = hash.split('/');
if (MODULES[hMod]) openModule(hMod, Math.max(0, (parseInt(hStep, 10) || 1) - 1));
else if (hash && TERMS[hash]) { setTab('glossary'); selectTerm(hash, { fly: true }); }
window.addEventListener('hashchange', () => {
  const [m, st] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (MODULES[m]) openModule(m, Math.max(0, (parseInt(st, 10) || 1) - 1));
});
