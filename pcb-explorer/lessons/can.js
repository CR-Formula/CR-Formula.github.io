// CAN bus lesson module.
import { C, h, g, txt, rect, line, path, circle, chip, resistor, clamp, lerp, hex, bin, clickable } from './svg.js';

// ---------------------------------------------------------------- frame helpers
function crc15(bits) {
  let crc = 0;
  for (const b of bits) {
    const nxt = b ^ ((crc >> 14) & 1);
    crc = (crc << 1) & 0x7fff;
    if (nxt) crc ^= 0x4599;
  }
  return crc;
}
const toBits = (v, n) => Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1);

// Build a classic CAN 2.0A data frame. Returns [{ bit, field, stuff }].
export function buildFrame(id, data) {
  const fields = [];
  const push = (field, bits) => bits.forEach((b) => fields.push({ bit: b, field }));
  push('SOF', [0]);
  push('ID', toBits(id, 11));
  push('RTR', [0]);
  push('IDE', [0]);
  push('r0', [0]);
  push('DLC', toBits(data.length, 4));
  data.forEach((byte) => push('DATA', toBits(byte, 8)));
  const crc = crc15(fields.map((f) => f.bit));
  push('CRC', toBits(crc, 15));
  // Bit stuffing from SOF through the CRC sequence.
  const out = [];
  let run = 0, last = -1;
  for (const f of fields) {
    out.push(f);
    if (f.bit === last) run++; else { run = 1; last = f.bit; }
    if (run === 5) {
      const s = 1 - f.bit;
      out.push({ bit: s, field: f.field, stuff: true });
      last = s; run = 1;
    }
  }
  const tail = (field, bits) => bits.forEach((b) => out.push({ bit: b, field }));
  tail('CRC del', [1]);
  tail('ACK', [0]);
  tail('ACK del', [1]);
  tail('EOF', [1, 1, 1, 1, 1, 1, 1]);
  return { bits: out, crc };
}

const FIELD_INFO = {
  SOF: ['Start of frame', 'One dominant (0) bit. It tells every node a message is starting and lets them all line up their clocks.', '#9aa3b2'],
  ID: ['Identifier (11 bits)', 'Says <i>what</i> the message is (e.g. “motor speed”) and sets its priority: the lower the number, the higher the priority.', '#ffb020'],
  RTR: ['RTR bit', 'Remote Transmission Request. 0 means this is a normal data frame.', '#a78bfa'],
  IDE: ['IDE bit', 'Identifier Extension. 0 means a standard 11-bit ID (1 would mean a 29-bit extended ID).', '#a78bfa'],
  r0: ['Reserved bit', 'Reserved for future use. Sent as 0.', '#a78bfa'],
  DLC: ['Data Length Code (4 bits)', 'How many data bytes follow: 0 to 8.', '#36d6ff'],
  DATA: ['Data field', 'The actual payload: 0 to 8 bytes.', '#3fd38a'],
  CRC: ['CRC (15 bits)', 'A checksum calculated over everything sent so far. Every receiver recalculates it. A mismatch means the frame was corrupted.', '#ff4fd8'],
  'CRC del': ['CRC delimiter', 'Always recessive (1). Gives receivers a moment before the ACK slot.', '#5b6372'],
  ACK: ['ACK slot', 'The sender transmits a recessive 1 here, and <b>every</b> node that received the frame correctly overwrites it with a dominant 0. That 0 is the acknowledgement.', '#3fd38a'],
  'ACK del': ['ACK delimiter', 'Always recessive (1).', '#5b6372'],
  EOF: ['End of frame', 'Seven recessive bits. After 3 more idle bits (the “intermission”) the bus is free for the next message.', '#5b6372'],
};

// ---------------------------------------------------------------- scenes
function sceneBus(ctx) {
  const root = ctx.svg;
  const yH = 290, yL = 330, x0 = 80, x1 = 920;
  txt(root, 500, 40, 'Every controller in the car shares one pair of wires', { anchor: 'middle', size: 18, weight: 650 });
  // bus
  const busH = line(root, x0, yH, x1, yH, { stroke: C.canh, sw: 4 });
  const busL = line(root, x0, yL, x1, yL, { stroke: C.canl, sw: 4 });
  void busH; void busL;
  txt(root, x1 + 12, yH, 'CANH', { fill: C.canh, size: 13 });
  txt(root, x1 + 12, yL, 'CANL', { fill: C.canl, size: 13 });
  resistor(root, x0, yH, yL, '120 Ω', { left: true });
  resistor(root, x1, yH, yL, '120 Ω');
  txt(root, x0, yL + 40, 'termination', { anchor: 'middle', size: 12, fill: C.muted });
  txt(root, x1, yL + 40, 'termination', { anchor: 'middle', size: 12, fill: C.muted });

  const nodes = [
    { name: 'Dashboard', x: 190, up: true },
    { name: 'Inverter', sub: 'motor controller', x: 345, up: false },
    { name: 'BMS', sub: 'battery monitor', x: 500, up: true },
    { name: 'Telemetry', sub: 'data logger', x: 655, up: false },
    { name: 'Our board', sub: 'STM32F042', x: 810, up: true },
  ];
  nodes.forEach((n) => {
    const by = n.up ? 120 : 410;
    const sy = n.up ? by + 74 : by;
    line(root, n.x - 10, sy, n.x - 10, yH, { stroke: C.canh, sw: 2 });
    line(root, n.x + 10, sy, n.x + 10, yL, { stroke: C.canl, sw: 2 });
    const c = chip(root, n.x - 70, by, 140, 74, n.name, n.sub);
    n.box = c.box;
    n.status = txt(root, n.x, n.up ? by - 16 : by + 92, '', { anchor: 'middle', size: 13, weight: 600 });
  });
  const pulses = [circle(root, 0, 0, 12, { fill: C.accent, opacity: 0 }), circle(root, 0, 0, 12, { fill: C.accent, opacity: 0 })];
  const tag = g(root, { opacity: 0 });
  const tagBox = rect(tag, -58, -15, 116, 30, { rx: 15, fill: '#3a2a08', stroke: C.accent });
  void tagBox;
  const tagText = txt(tag, 0, 0, '', { anchor: 'middle', size: 13, weight: 700, fill: C.accent, mono: true });

  const msgs = [
    { from: 2, id: 0x150, name: 'Cell voltages', keep: [0, 3] },
    { from: 1, id: 0x0a0, name: 'Motor speed', keep: [0, 3] },
    { from: 0, id: 0x300, name: 'Driver pressed “Ready”', keep: [1, 2] },
    { from: 4, id: 0x123, name: 'Board temperature', keep: [3] },
  ];
  const PERIOD = 4.2, SPEED = 650;
  return {
    tick(dt, t) {
      const k = Math.floor(t / PERIOD) % msgs.length;
      const m = msgs[k];
      const lt = t % PERIOD;
      const src = nodes[m.from];
      const travel = Math.max(lt - 0.5, 0) * SPEED;
      const reached = (n) => Math.abs(n.x - src.x) <= travel;
      nodes.forEach((n, i) => {
        let stroke = C.line, status = '', col = C.muted;
        if (i === m.from) { stroke = C.accent; status = lt > 0.2 ? 'sending' : ''; col = C.accent; }
        else if (reached(n) && lt > 0.5) {
          if (m.keep.includes(i)) { stroke = C.green; status = '✓ keeps it'; col = C.green; }
          else { stroke = '#4a5160'; status = 'ignores it'; col = C.dim; }
        }
        n.box.setAttribute('stroke', stroke);
        n.box.setAttribute('stroke-width', stroke === C.line ? 1.5 : 3);
        n.status.textContent = status;
        n.status.setAttribute('fill', col);
      });
      const on = lt > 0.5 && travel < 900;
      [src.x - travel, src.x + travel].forEach((x, j) => {
        const p = pulses[j];
        const vis = on && x > x0 && x < x1;
        p.setAttribute('cx', clamp(x, x0, x1));
        p.setAttribute('cy', (yH + yL) / 2);
        p.setAttribute('opacity', vis ? 0.85 : 0);
      });
      tag.setAttribute('opacity', lt > 0.2 && lt < PERIOD - 0.3 ? 1 : 0);
      tag.setAttribute('transform', `translate(${src.x},${(yH + yL) / 2})`);
      tagText.textContent = `ID ${hex(m.id, 3)}`;
      ctx.caption(`<b>${src.name}</b> broadcasts message <code>${hex(m.id, 3)}</code>: “${m.name}”. Every node hears every message. Each node’s <i>acceptance filter</i> decides whether to keep it.`);
    },
  };
}

function sceneDifferential(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `
    <label class="toggle"><input type="checkbox" data-k="noise"><span class="state">Add electrical noise from the motor</span></label>
    <label class="toggle"><input type="checkbox" data-k="single"><span class="state">Also decode using CANH alone (one wire)</span></label>`;
  const opt = { noise: false, single: false };
  ctx.controls.addEventListener('change', (e) => { opt[e.target.dataset.k] = e.target.checked; });

  const X0 = 110, X1 = 950;
  const vy = (v) => 280 - v * 42;      // top plot, 0–5 V
  const dy = (v) => 440 - v * 42;      // differential plot
  // axes
  for (let v = 0; v <= 5; v++) {
    line(root, X0, vy(v), X1, vy(v), { stroke: C.grid, sw: 1 });
    txt(root, X0 - 10, vy(v), `${v} V`, { anchor: 'end', size: 12, fill: C.dim });
  }
  txt(root, X0, 40, 'Voltage on each wire', { size: 14, weight: 600, fill: C.muted });
  txt(root, 960, 40, '', { anchor: 'end' });
  line(root, X0, dy(0), X1, dy(0), { stroke: C.grid, sw: 1 });
  line(root, X0, dy(2), X1, dy(2), { stroke: C.grid, sw: 1 });
  txt(root, X0 - 10, dy(0), '0 V', { anchor: 'end', size: 12, fill: C.dim });
  txt(root, X0 - 10, dy(2), '2 V', { anchor: 'end', size: 12, fill: C.dim });
  line(root, X0, dy(0.9), X1, dy(0.9), { stroke: C.dim, sw: 1, dash: '5 5' });
  txt(root, X1, dy(0.9) - 10, 'receiver threshold 0.9 V', { anchor: 'end', size: 11.5, fill: C.dim });
  txt(root, X0, 335, 'CANH − CANL  (what the receiver measures)', { size: 14, weight: 600, fill: C.green });

  const pH = path(root, '', { stroke: C.canh, sw: 2.5 });
  const pL = path(root, '', { stroke: C.canl, sw: 2.5 });
  const pD = path(root, '', { stroke: C.green, sw: 2.5 });
  txt(root, X0 + 6, vy(3.5) - 14, 'CANH', { fill: C.canh, size: 13, weight: 650 });
  txt(root, X0 + 6, vy(1.5) + 16, 'CANL', { fill: C.canl, size: 13, weight: 650 });

  const rxG = g(root);
  txt(root, X0, 492, 'Bits decoded by the receiver', { size: 13, fill: C.muted });
  const seG = g(root);
  const seLabel = txt(root, X0, 552, 'Decoded from CANH alone (threshold 3 V)', { size: 13, fill: C.muted });

  const pattern = [1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0];
  const BW = 56;
  const bitAt = (s) => pattern[((Math.floor(s / BW) % pattern.length) + pattern.length) % pattern.length];
  const level = (s) => {
    const b = bitAt(s), frac = ((s % BW) + BW) % BW;
    const prev = bitAt(s - BW);
    const target = b === 0 ? 1 : 0;
    if (prev !== b && frac < 8) return lerp(prev === 0 ? 1 : 0, target, frac / 8);
    return target;
  };
  const noise = (s, t) => 0.75 * Math.sin(s * 0.029 + t * 0.7) + 0.35 * Math.sin(s * 0.19) + (Math.sin(s * 0.011) > 0.93 ? 1.1 : 0);
  let off = 0;
  return {
    tick(dt, t) {
      off += dt * 90;
      let dH = '', dL = '', dD = '';
      for (let x = X0; x <= X1; x += 3) {
        const s = x + off;
        const lv = level(s);
        const n = opt.noise ? noise(s, t) : 0;
        const vh = 2.5 + lv + n, vl = 2.5 - lv + n;
        const c = x === X0 ? 'M' : 'L';
        dH += `${c}${x},${vy(clamp(vh, -0.3, 5.2))}`;
        dL += `${c}${x},${vy(clamp(vl, -0.3, 5.2))}`;
        dD += `${c}${x},${dy(vh - vl)}`;
      }
      pH.setAttribute('d', dH); pL.setAttribute('d', dL); pD.setAttribute('d', dD);
      // decoded bit cells
      while (rxG.firstChild) rxG.firstChild.remove();
      while (seG.firstChild) seG.firstChild.remove();
      const first = Math.floor((X0 + off) / BW);
      let errs = 0;
      for (let k = first; ; k++) {
        const xs = k * BW - off, xe = xs + BW;
        if (xs > X1) break;
        const a = Math.max(xs, X0), b = Math.min(xe, X1);
        if (b - a < 4) continue;
        const bit = bitAt(k * BW + 1);
        const mid = k * BW + BW / 2;
        rect(rxG, a + 1, 505, b - a - 2, 26, { rx: 4, fill: bit ? '#232833' : '#3a2a08', stroke: bit ? C.line : C.accent, sw: 1 });
        if (b - a > 20) txt(rxG, (a + b) / 2, 518, bit ? '1' : '0', { anchor: 'middle', size: 13, fill: bit ? C.muted : C.accent, mono: true });
        if (opt.single) {
          const vh = 2.5 + level(mid) + (opt.noise ? noise(mid, t) : 0);
          const se = vh > 3 ? 0 : 1;
          const bad = se !== bit;
          if (bad) errs++;
          rect(seG, a + 1, 565, b - a - 2, 26, { rx: 4, fill: bad ? '#3d1518' : '#1d2129', stroke: bad ? C.red : C.line, sw: 1 });
          if (b - a > 20) txt(seG, (a + b) / 2, 578, se ? '1' : '0', { anchor: 'middle', size: 13, fill: bad ? C.red : C.muted, mono: true });
        }
      }
      seLabel.setAttribute('opacity', opt.single ? 1 : 0);
      let cap = '<b>Recessive (1):</b> both wires sit at about 2.5 V, so the difference is 0 V. <b>Dominant (0):</b> CANH rises to about 3.5 V and CANL falls to about 1.5 V, a 2 V difference.';
      if (opt.noise) cap = `Noise pushes <b>both</b> wires up and down together. The <b>difference</b> between them barely changes, so the receiver still decodes every bit correctly.${opt.single ? ` Decoding from one wire alone gives <b style="color:${C.red}">${errs} wrong bit${errs === 1 ? '' : 's'}</b> on screen right now.` : ''}`;
      ctx.caption(cap);
    },
  };
}

function sceneWiredAnd(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `<label class="toggle"><input type="checkbox" data-k="auto" checked><span class="state">Auto demo (click a node to take over)</span></label>`;
  let auto = true;
  const autoBox = ctx.controls.querySelector('input');
  autoBox.addEventListener('change', () => { auto = autoBox.checked; });

  txt(root, 500, 36, 'Click a node to make it send 0 (dominant) or 1 (recessive)', { anchor: 'middle', size: 17, weight: 650 });
  const nodes = ['Node A', 'Node B', 'Node C'].map((name, i) => {
    const y = 110 + i * 150;
    const grp = g(root);
    const c = chip(grp, 70, y, 220, 100, name, '');
    const val = txt(grp, 180, y + 64, '', { anchor: 'middle', size: 14, weight: 650 });
    const wire = path(grp, `M290,${y + 50} H520 V${300}`, { stroke: C.line, sw: 3 });
    const dot = circle(grp, 0, 0, 7, { fill: C.accent, opacity: 0 });
    const n = { bit: 1, c, val, wire, dot, y };
    clickable(grp, () => { auto = false; autoBox.checked = false; n.bit ^= 1; });
    return n;
  });
  // bus node
  rect(root, 520, 240, 150, 120, { fill: '#1b1f27', stroke: C.line, rx: 12 });
  txt(root, 595, 262, 'THE BUS', { anchor: 'middle', size: 12, fill: C.muted, weight: 650 });
  const busVal = txt(root, 595, 300, '', { anchor: 'middle', size: 34, weight: 800, mono: true });
  const busName = txt(root, 595, 337, '', { anchor: 'middle', size: 13, weight: 650 });
  // voltages
  const vH = txt(root, 760, 260, '', { size: 14, fill: C.canh, mono: true });
  const vL = txt(root, 760, 290, '', { size: 14, fill: C.canl, mono: true });
  const vD = txt(root, 760, 320, '', { size: 14, fill: C.green, mono: true });
  // truth table
  txt(root, 760, 410, 'A  B  C  →  bus', { size: 13, fill: C.muted, mono: true });
  const rows = [];
  for (let k = 0; k < 8; k++) {
    const a = (k >> 2) & 1, b = (k >> 1) & 1, c = k & 1;
    rows.push(txt(root, 760, 432 + k * 20, `${a}  ${b}  ${c}  →  ${a & b & c}`, { size: 13, fill: C.dim, mono: true }));
  }
  let acc = 0, combo = 0;
  return {
    tick(dt, t) {
      if (auto) {
        acc += dt;
        if (acc > 1.6) { acc = 0; combo = (combo + 1) % 8; nodes.forEach((n, i) => { n.bit = (combo >> (2 - i)) & 1; }); }
      }
      const bus = nodes.every((n) => n.bit === 1) ? 1 : 0;
      nodes.forEach((n) => {
        n.val.textContent = n.bit ? 'sends 1 (recessive)' : 'sends 0 (dominant)';
        n.val.setAttribute('fill', n.bit ? C.muted : C.accent);
        n.c.box.setAttribute('stroke', n.bit ? C.line : C.accent);
        n.wire.setAttribute('stroke', n.bit ? C.line : C.accent);
        const k = (t * 1.3) % 1;
        const pts = [[290, n.y + 50], [520, n.y + 50], [520, 300]];
        const len1 = 230, len2 = Math.abs(n.y + 50 - 300), tot = len1 + len2;
        const d = k * tot;
        const p = d < len1 ? [290 + d, n.y + 50] : [520, n.y + 50 + Math.sign(300 - (n.y + 50)) * (d - len1)];
        void pts;
        n.dot.setAttribute('cx', p[0]); n.dot.setAttribute('cy', p[1]);
        n.dot.setAttribute('opacity', n.bit ? 0 : 0.9);
      });
      busVal.textContent = String(bus);
      busVal.setAttribute('fill', bus ? C.muted : C.accent);
      busName.textContent = bus ? 'RECESSIVE' : 'DOMINANT';
      busName.setAttribute('fill', bus ? C.muted : C.accent);
      vH.textContent = `CANH = ${bus ? '2.5' : '3.5'} V`;
      vL.textContent = `CANL = ${bus ? '2.5' : '1.5'} V`;
      vD.textContent = `diff = ${bus ? '0.0' : '2.0'} V`;
      const idx = (nodes[0].bit << 2) | (nodes[1].bit << 1) | nodes[2].bit;
      rows.forEach((r, i) => { r.setAttribute('fill', i === idx ? C.text : C.dim); r.setAttribute('font-weight', i === idx ? 700 : 400); });
      ctx.caption(bus
        ? 'Nobody is driving, so the bus <b>rests</b> at recessive (1). Recessive is the “do nothing” state: the termination resistors pull CANH and CANL together.'
        : 'At least one node drives the bus, so it is <b>dominant (0)</b>, no matter what the others send. A 0 always beats a 1. This “wired-AND” rule is what makes arbitration and ACK work.');
    },
  };
}

function sceneFrame(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `
    <div class="calc">
      <div class="row">
        <label>Identifier (hex, max 7FF)<input class="search" data-k="id" value="123" maxlength="3" spellcheck="false"></label>
        <label>Data bytes (hex)<input class="search" data-k="data" value="0F A0" spellcheck="false"></label>
      </div>
      <button class="btn" data-k="build">Send this frame</button>
      <div class="small muted" data-k="err"></div>
    </div>`;
  let frame, cursor = 0, layer;
  const err = ctx.controls.querySelector('[data-k=err]');
  const build = () => {
    const id = parseInt(ctx.controls.querySelector('[data-k=id]').value, 16);
    const bytes = ctx.controls.querySelector('[data-k=data]').value.trim().split(/[\s,]+/).filter(Boolean).map((b) => parseInt(b, 16));
    if (!(id >= 0 && id <= 0x7ff) || bytes.some((b) => !(b >= 0 && b <= 255)) || bytes.length > 8) {
      err.textContent = 'Use an ID from 000 to 7FF and up to 8 data bytes, like “0F A0”.';
      return;
    }
    err.textContent = '';
    frame = buildFrame(id, bytes);
    frame.id = id; frame.data = bytes;
    cursor = 0;
    draw();
  };
  ctx.controls.querySelector('[data-k=build]').addEventListener('click', build);
  ctx.controls.addEventListener('keydown', (e) => { if (e.key === 'Enter') build(); });

  let cells = [], cur, bitW, X0 = 40;
  function draw() {
    if (layer) layer.remove();
    layer = g(root);
    const bits = frame.bits;
    bitW = Math.min(17, 920 / bits.length);
    X0 = 500 - (bits.length * bitW) / 2;
    txt(layer, 500, 34, `Standard CAN frame · ID ${hex(frame.id, 3)} · ${frame.data.length} data byte${frame.data.length === 1 ? '' : 's'} · ${bits.length} bits on the wire`, { anchor: 'middle', size: 16, weight: 650 });
    // waveform (bus level; 1 = recessive drawn low-ish for "logic" view)
    const wy = (b) => (b ? 95 : 145);
    let d = `M${X0},${wy(1)}`;
    bits.forEach((b, i) => { const x = X0 + i * bitW; d += `L${x},${wy(b.bit)}L${x + bitW},${wy(b.bit)}`; });
    txt(layer, X0 - 8, 95, '1', { anchor: 'end', size: 11, fill: C.dim, mono: true });
    txt(layer, X0 - 8, 145, '0', { anchor: 'end', size: 11, fill: C.dim, mono: true });
    path(layer, d, { stroke: C.accent, sw: 2 });
    // field bands
    let start = 0;
    for (let i = 1; i <= bits.length; i++) {
      if (i === bits.length || bits[i].field !== bits[start].field) {
        const f = bits[start].field, info = FIELD_INFO[f];
        const x = X0 + start * bitW, w = (i - start) * bitW;
        rect(layer, x + 0.5, 180, w - 1, 34, { rx: 4, fill: info[2], stroke: 'none', opacity: 0.22 });
        const short = { 'CRC del': 'DEL', 'ACK del': 'DEL' }[f] || f;
        if (w > short.length * 7 + 4) txt(layer, x + w / 2, 197, short, { anchor: 'middle', size: 11.5, weight: 650, fill: info[2] });
        start = i;
      }
    }
    cells = bits.map((b, i) => {
      const x = X0 + i * bitW;
      const r = rect(layer, x + 0.5, 225, bitW - 1, 30, { rx: 3, fill: b.stuff ? '#3b2333' : '#20242d', stroke: b.stuff ? C.pink : C.line, sw: 1 });
      const t = bitW >= 10 ? txt(layer, x + bitW / 2, 240, String(b.bit), { anchor: 'middle', size: 11, mono: true, fill: b.stuff ? C.pink : C.muted }) : null;
      return { r, t };
    });
    txt(layer, X0, 275, 'Pink cells are stuff bits', { size: 12, fill: C.pink });
    cur = rect(layer, X0, 82, bitW, 178, { rx: 3, fill: 'rgba(255,255,255,0.07)', stroke: C.text, sw: 1.5 });
    // description card
    layer.card = g(layer);
  }
  build();

  const card = () => layer.card;
  let lastField = null;
  return {
    tick(dt) {
      if (!frame) return;
      cursor += dt * 7;
      const n = frame.bits.length;
      const i = Math.floor(cursor) % (n + 14);
      const idx = Math.min(i, n - 1);
      cur.setAttribute('x', X0 + idx * bitW);
      cur.setAttribute('opacity', i < n ? 1 : 0.25);
      cells.forEach((c, k) => c.r.setAttribute('opacity', k <= idx ? 1 : 0.35));
      const b = frame.bits[idx];
      const key = b.stuff ? 'stuff' : b.field;
      if (key !== lastField) {
        lastField = key;
        const cd = card();
        while (cd.firstChild) cd.firstChild.remove();
        const [name, desc, col] = b.stuff ? ['Stuff bit', '', C.pink] : FIELD_INFO[b.field];
        rect(cd, 60, 320, 880, 230, { fill: C.panel, stroke: col, rx: 12 });
        txt(cd, 90, 355, name, { size: 20, weight: 700, fill: col });
        const fo = h(cd, 'foreignObject', { x: 90, y: 375, width: 820, height: 170 });
        const div = document.createElement('div');
        div.className = 'svg-html';
        let extra = '';
        if (b.field === 'ID' && !b.stuff) extra = `<p>This frame’s ID is <code>${hex(frame.id, 3)}</code> = <code>${bin(frame.id, 11)}</code> in binary.</p>`;
        if (b.field === 'DLC' && !b.stuff) extra = `<p>DLC = <code>${bin(frame.data.length, 4)}</code> = ${frame.data.length} byte${frame.data.length === 1 ? '' : 's'}.</p>`;
        if (b.field === 'DATA' && !b.stuff) extra = `<p>Bytes: ${frame.data.map((x) => `<code>${hex(x)}</code>`).join(' ')}</p>`;
        if (b.field === 'CRC' && !b.stuff) extra = `<p>For this frame the CRC is <code>${hex(frame.crc, 4)}</code>.</p>`;
        div.innerHTML = b.stuff
          ? '<p>After <b>5 identical bits in a row</b>, the sender adds one opposite bit. Without edges, receivers’ clocks would slowly drift out of sync. Receivers count five equal bits and simply throw the next one away.</p>'
          : `<p>${desc}</p>${extra}`;
        fo.appendChild(div);
      }
      ctx.caption(i >= n ? `Done: ${n} bits. At 500 kbit/s this frame takes ${(n * 2).toFixed(0)} µs on the bus.` : `Bit ${idx + 1} of ${n}: <b>${b.stuff ? 'stuff bit' : FIELD_INFO[b.field][0]}</b>`);
    },
  };
}

function sceneArbitration(ctx) {
  const root = ctx.svg;
  const defaults = [['Dashboard', '0B0'], ['BMS', '0A4'], ['Inverter', '0A0']];
  ctx.controls.innerHTML = `
    <div class="calc">
      <div class="small muted">Edit the IDs (hex) and replay. Lowest ID wins.</div>
      <div class="row3">${defaults.map(([n, id], i) => `<label>${n}<input class="search" data-i="${i}" value="${id}" maxlength="3" spellcheck="false"></label>`).join('')}</div>
      <button class="btn" data-k="go">Replay arbitration</button>
    </div>`;
  let layer, t0 = 0, state;
  const COLS = 12, CW = 52, X0 = 300;
  const rowsY = [150, 225, 300];
  const setup = () => {
    const ids = defaults.map((_, i) => parseInt(ctx.controls.querySelector(`[data-i="${i}"]`).value, 16) & 0x7ff);
    if (layer) layer.remove();
    layer = g(root);
    txt(layer, 500, 40, 'Three nodes start sending at the same moment…', { anchor: 'middle', size: 18, weight: 650 });
    for (let c = 0; c < COLS; c++) txt(layer, X0 + c * CW + CW / 2, 105, c === 0 ? 'SOF' : `ID${10 - (c - 1)}`, { anchor: 'middle', size: 11, fill: C.dim, mono: true });
    const rows = defaults.map(([name], i) => {
      const y = rowsY[i];
      txt(layer, 40, y, name, { size: 16, weight: 650 });
      txt(layer, 40, y + 20, `ID ${hex(ids[i], 3)}`, { size: 12.5, fill: C.muted, mono: true });
      const bits = [0, ...Array.from({ length: 11 }, (_, k) => (ids[i] >> (10 - k)) & 1)];
      const cells = bits.map((b, c) => {
        const r = rect(layer, X0 + c * CW + 3, y - 22, CW - 6, 44, { rx: 6, fill: '#20242d', stroke: C.line, sw: 1, opacity: 0 });
        const tt = txt(layer, X0 + c * CW + CW / 2, y, String(b), { anchor: 'middle', size: 18, weight: 700, mono: true, opacity: 0 });
        return { r, tt, b };
      });
      const note = txt(layer, X0 + COLS * CW + 14, y, '', { size: 13, weight: 650 });
      return { bits, cells, note, lostAt: -1, name, id: ids[i] };
    });
    line(layer, 40, 345, 960, 345, { stroke: C.grid, sw: 1 });
    txt(layer, 40, 390, 'Bus', { size: 16, weight: 650, fill: C.accent });
    txt(layer, 40, 410, 'what everyone reads', { size: 12, fill: C.muted });
    const bus = Array.from({ length: COLS }, (_, c) => ({
      r: rect(layer, X0 + c * CW + 3, 368, CW - 6, 44, { rx: 6, fill: '#3a2a08', stroke: C.accent, sw: 1, opacity: 0 }),
      tt: txt(layer, X0 + c * CW + CW / 2, 390, '', { anchor: 'middle', size: 18, weight: 800, mono: true, fill: C.accent }),
    }));
    // simulate
    let alive = [0, 1, 2];
    const busBits = [];
    for (let c = 0; c < COLS; c++) {
      const b = Math.min(...alive.map((i) => rows[i].bits[c]));
      busBits.push(b);
      alive.forEach((i) => { if (rows[i].bits[c] === 1 && b === 0) rows[i].lostAt = c; });
      alive = alive.filter((i) => rows[i].lostAt < 0);
    }
    const winners = rows.filter((r) => r.lostAt < 0);
    const result = txt(layer, 500, 470, '', { anchor: 'middle', size: 17, weight: 700, fill: C.green });
    const sub = txt(layer, 500, 500, '', { anchor: 'middle', size: 14, fill: C.muted });
    state = { rows, bus, busBits, winners, result, sub, dup: new Set(ids).size < 3 };
    t0 = 0;
  };
  ctx.controls.querySelector('[data-k=go]').addEventListener('click', setup);
  setup();
  return {
    tick(dt) {
      t0 += dt;
      const STEP = 0.75;
      const col = Math.floor(t0 / STEP);
      const { rows, bus, busBits, winners } = state;
      rows.forEach((r) => {
        r.cells.forEach((cell, c) => {
          const shown = c <= col;
          const lost = r.lostAt >= 0 && c > r.lostAt;
          cell.r.setAttribute('opacity', shown ? (lost ? 0.25 : 1) : 0);
          cell.tt.setAttribute('opacity', shown ? (lost ? 0.25 : 1) : 0);
          if (shown && c === r.lostAt) { cell.r.setAttribute('stroke', C.red); cell.r.setAttribute('stroke-width', 2.5); }
        });
        if (r.lostAt >= 0 && col >= r.lostAt) {
          r.note.textContent = `lost at ${r.lostAt === 0 ? 'SOF' : 'ID' + (11 - r.lostAt)} → stops & listens`;
          r.note.setAttribute('fill', C.red);
        } else if (col >= COLS - 1 && r.lostAt < 0) {
          r.note.textContent = '★ wins, keeps sending';
          r.note.setAttribute('fill', C.green);
        } else r.note.textContent = '';
      });
      bus.forEach((b, c) => {
        b.r.setAttribute('opacity', c <= col ? 1 : 0);
        b.tt.textContent = c <= col ? String(busBits[c]) : '';
      });
      if (col >= COLS) {
        state.result.textContent = state.dup ? 'Two nodes used the same ID: they both “win” and their data collides. IDs must be unique!' : `${winners[0].name} (${hex(winners[0].id, 3)}) wins: the lowest ID has the highest priority.`;
        state.result.setAttribute('fill', state.dup ? C.red : C.green);
        state.sub.textContent = 'Nothing was destroyed: the losers simply retry as soon as the bus is free.';
      } else { state.result.textContent = ''; state.sub.textContent = ''; }
      if (col < COLS) {
        const c = Math.min(col, COLS - 1);
        const sending1 = rows.filter((r) => (r.lostAt < 0 || r.lostAt >= c) && r.bits[c] === 1).map((r) => r.name);
        ctx.caption(busBits[c] === 0 && sending1.length
          ? `Bit ${c === 0 ? 'SOF' : 'ID' + (11 - c)}: ${sending1.join(' and ')} sent a <b>1</b> but read back a <b>0</b> from the bus, so ${sending1.length > 1 ? 'they lose' : 'it loses'} arbitration.`
          : `Every node sends a bit and <b>reads the bus back</b> at the same time. As long as the bus matches what it sent, a node keeps going.`);
      } else ctx.caption('This is called <b>non-destructive bitwise arbitration</b>. Use low IDs for the most urgent messages (e.g. a shutdown command).');
      if (t0 > STEP * COLS + 5) t0 = 0;
    },
  };
}

function sceneErrors(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `
    <label class="toggle"><input type="checkbox" data-k="rx" checked><span class="state">Other nodes connected (they send ACK)</span></label>
    <label class="toggle"><input type="checkbox" data-k="noise"><span class="state">Damaged wiring (bit errors)</span></label>
    <button class="btn" data-k="reset">Reset error counter</button>`;
  const opt = { rx: true, noise: false };
  ctx.controls.addEventListener('change', (e) => { if (e.target.dataset.k) opt[e.target.dataset.k] = e.target.checked; });
  let tec = 0, busOff = false;
  ctx.controls.querySelector('[data-k=reset]').addEventListener('click', () => { tec = 0; busOff = false; });

  txt(root, 500, 34, 'Every frame is acknowledged, and errors are counted', { anchor: 'middle', size: 18, weight: 650 });
  // frame progress bar
  const fields = [['SOF', 1], ['ID + control', 18], ['DATA', 16], ['CRC', 15], ['DEL', 1], ['ACK', 1], ['DEL', 1], ['EOF', 7]];
  const total = fields.reduce((a, f) => a + f[1], 0);
  const FX = 120, FW = 760;
  let x = FX;
  const ackX = [];
  fields.forEach(([n, w]) => {
    const ww = (w / total) * FW;
    const isAck = n === 'ACK';
    rect(root, x, 80, ww - 2, 36, { rx: 4, fill: isAck ? '#173525' : '#20242d', stroke: isAck ? C.green : C.line, sw: 1 });
    if (ww > 30) txt(root, x + ww / 2, 98, n, { anchor: 'middle', size: 11.5, fill: C.muted });
    if (isAck) { ackX.push(x, ww); txt(root, x + ww / 2, 135, 'ACK', { anchor: 'middle', size: 11.5, fill: C.green, weight: 650 }); }
    x += ww;
  });
  const prog = rect(root, FX, 80, 0, 36, { rx: 4, fill: 'rgba(255,176,32,0.25)', stroke: 'none' });
  const tx = chip(root, 120, 165, 200, 70, 'Transmitter', 'sends the frame');
  const rx1 = chip(root, 400, 165, 200, 70, 'Receiver 1', 'listening');
  const rx2 = chip(root, 680, 165, 200, 70, 'Receiver 2', 'listening');
  const result = txt(root, 500, 270, '', { anchor: 'middle', size: 16, weight: 700 });

  // TEC meter + states
  txt(root, 120, 320, 'Transmit Error Counter (TEC)', { size: 14, weight: 650, fill: C.muted });
  rect(root, 120, 335, 760, 26, { rx: 6, fill: '#20242d', stroke: C.line });
  const bar = rect(root, 120, 335, 0, 26, { rx: 6, fill: C.accent, stroke: 'none' });
  const tecText = txt(root, 890, 348, '', { size: 14, weight: 700, mono: true });
  const sx = (v) => 120 + (Math.min(v, 300) / 300) * 760;
  [128, 256].forEach((v) => { line(root, sx(v), 330, sx(v), 368, { stroke: C.text, sw: 1.5, dash: '3 3' }); txt(root, sx(v), 378, String(v), { anchor: 'middle', size: 11, fill: C.muted, mono: true }); });
  const states = [
    { name: 'Error Active', sub: 'TEC < 128 · normal', x: 120, col: C.green },
    { name: 'Error Passive', sub: '128–255 · stays quieter', x: 390, col: C.accent },
    { name: 'Bus Off', sub: 'TEC > 255 · disconnects itself', x: 660, col: C.red },
  ].map((s) => ({ ...s, c: chip(root, s.x, 410, 220, 80, s.name, s.sub) }));
  path(root, 'M340,450 H390', { stroke: C.muted }); path(root, 'M610,450 H660', { stroke: C.muted });
  txt(root, 500, 530, 'A good frame: TEC − 1.   A detected error: TEC + 8.', { anchor: 'middle', size: 13.5, fill: C.muted });

  let ft = 0, outcome = null, msg = '';
  return {
    tick(dt) {
      const state = busOff ? 2 : tec >= 128 ? 1 : 0;
      const PER = outcome === 'ok' || outcome === null ? 2.6 : 1.1;
      ft += dt;
      if (busOff) {
        prog.setAttribute('width', 0);
        result.textContent = 'BUS OFF: this node has stopped transmitting so it can’t disrupt the rest of the car.';
        result.setAttribute('fill', C.red);
      } else {
        const k = Math.min(1, ft / (PER * 0.8));
        prog.setAttribute('width', k * FW);
        if (ft >= PER) {
          ft = 0;
          // decide the outcome of this frame
          if (opt.noise && Math.random() < 0.85) { outcome = 'bit'; tec += 8; msg = 'Bit error: a receiver saw a corrupted bit and sent an <b>error frame</b>. The frame is resent and TEC goes up by 8.'; }
          else if (!opt.rx) {
            outcome = 'ack';
            if (state === 0) { tec += 8; msg = 'ACK error: nobody pulled the ACK slot dominant, so the transmitter assumes the frame was lost and resends it (TEC + 8).'; }
            else msg = 'Still no ACK, but a lone <b>error-passive</b> node doesn’t keep counting ACK errors, so it can’t knock itself off the bus just because it is alone (ISO 11898 rule).';
          } else { outcome = 'ok'; tec = Math.max(0, tec - 1); msg = 'The receivers wrote a dominant bit into the ACK slot: frame delivered (TEC − 1).'; }
          if (tec > 255) busOff = true;
        }
        const ok = outcome === 'ok';
        result.textContent = outcome === null ? '' : ok ? '✓ Acknowledged' : outcome === 'ack' ? '✗ No ACK, resending' : '✗ Error frame, resending';
        result.setAttribute('fill', ok ? C.green : C.red);
      }
      [rx1, rx2].forEach((r) => {
        r.box.setAttribute('opacity', opt.rx ? 1 : 0.3);
        r.sub.textContent = opt.rx ? (outcome === 'ok' && ft < 1 ? 'ACK! (drives 0)' : 'listening') : 'unplugged';
        r.sub.setAttribute('fill', opt.rx && outcome === 'ok' && ft < 1 ? C.green : C.muted);
      });
      tx.box.setAttribute('stroke', busOff ? C.red : C.accent);
      bar.setAttribute('width', sx(tec) - 120);
      bar.setAttribute('fill', [C.green, C.accent, C.red][busOff ? 2 : tec >= 128 ? 1 : 0]);
      tecText.textContent = String(tec);
      states.forEach((s, i) => { s.c.box.setAttribute('stroke', i === (busOff ? 2 : tec >= 128 ? 1 : 0) ? s.col : C.line); s.c.box.setAttribute('stroke-width', i === (busOff ? 2 : tec >= 128 ? 1 : 0) ? 3 : 1.5); });
      ctx.caption(busOff ? 'In <b>bus-off</b> the node goes silent. It may rejoin only after seeing 128 × 11 recessive bits (and usually after your firmware restarts it). Press “Reset error counter” to try again.' : (msg || 'Watch the ACK slot near the end of each frame.'));
    },
  };
}

function sceneTermination(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `<label class="toggle"><input type="checkbox" data-k="term" checked><span class="state">120 Ω termination at both ends</span></label>`;
  let term = true;
  ctx.controls.querySelector('input').addEventListener('change', (e) => { term = e.target.checked; t0 = 0; });
  txt(root, 500, 34, 'A fast edge travels down the cable…', { anchor: 'middle', size: 18, weight: 650 });
  const L0 = 170, L1 = 830, Y = 150;
  chip(root, 30, Y - 40, 120, 80, 'Sender', '');
  chip(root, 850, Y - 40, 120, 80, 'Far end', '');
  line(root, L0, Y - 10, L1, Y - 10, { stroke: '#4a3b1a', sw: 6 });
  line(root, L0, Y + 10, L1, Y + 10, { stroke: '#163a47', sw: 6 });
  const fillH = line(root, L0, Y - 10, L0, Y - 10, { stroke: C.canh, sw: 6 });
  const fillL = line(root, L0, Y + 10, L0, Y + 10, { stroke: C.canl, sw: 6 });
  const refl = g(root);
  const rl = rect(refl, 0, Y - 22, 18, 44, { rx: 6, fill: C.red, stroke: 'none', opacity: 0.0 });
  const termA = resistor(root, L0 + 6, Y - 10, Y + 10, '');
  const termB = resistor(root, L1 - 6, Y - 10, Y + 10, '');
  const termLabel = txt(root, L1 - 6, Y + 40, '', { anchor: 'middle', size: 12.5 });
  // scope
  const SX0 = 120, SX1 = 900, SY = (v) => 520 - v * 110;
  rect(root, SX0 - 20, 300, SX1 - SX0 + 40, 260, { fill: '#12151b', stroke: C.line });
  txt(root, SX0, 320, 'Differential voltage at the far end', { size: 13.5, weight: 650, fill: C.muted });
  line(root, SX0, SY(0), SX1, SY(0), { stroke: C.grid, sw: 1 });
  line(root, SX0, SY(1), SX1, SY(1), { stroke: C.grid, sw: 1, dash: '4 4' });
  txt(root, SX0 - 6, SY(0), '0', { anchor: 'end', size: 11, fill: C.dim });
  txt(root, SX0 - 6, SY(1), '2 V', { anchor: 'end', size: 11, fill: C.dim });
  const trace = path(root, '', { stroke: C.green, sw: 2.5 });
  const v = (tt) => {
    if (tt < 1) return 0;
    const u = tt - 1;
    return term ? 1 - Math.exp(-u * 18) : 1 + 0.75 * Math.exp(-u * 1.1) * Math.cos(u * 11);
  };
  let t0 = 0;
  return {
    tick(dt) {
      t0 += dt;
      const T = 5;
      if (t0 > T) t0 = 0;
      termA.setAttribute('opacity', term ? 1 : 0.15);
      termB.setAttribute('opacity', term ? 1 : 0.15);
      termLabel.textContent = term ? '120 Ω' : 'missing!';
      termLabel.setAttribute('fill', term ? C.muted : C.red);
      const k = Math.min(1, t0 / 1);
      const x = L0 + (L1 - L0) * k;
      fillH.setAttribute('x2', x); fillL.setAttribute('x2', x);
      // reflection blob
      if (!term && t0 > 1 && t0 < 3) {
        const kk = ((t0 - 1) % 1);
        const back = Math.floor(t0 - 1) % 2 === 0;
        const xr = back ? L1 - (L1 - L0) * kk : L0 + (L1 - L0) * kk;
        rl.setAttribute('x', xr - 9);
        rl.setAttribute('opacity', 0.75 * (1 - (t0 - 1) / 2.2));
      } else rl.setAttribute('opacity', 0);
      let d = '';
      const span = Math.min(t0, T);
      for (let i = 0; i <= 200; i++) {
        const tt = (i / 200) * span;
        d += `${i ? 'L' : 'M'}${SX0 + (tt / T) * (SX1 - SX0)},${SY(v(tt))}`;
      }
      trace.setAttribute('d', d);
      ctx.caption(term
        ? 'With a <b>120 Ω</b> resistor at each end (matching the cable’s impedance), the edge is absorbed when it arrives. The far end sees one clean step.'
        : 'Without termination, the edge <b>reflects</b> off the open end and bounces back and forth. The receiver sees ringing that can be misread as extra bits. Tip: with power off, CANH–CANL should measure about <b>60 Ω</b> (two 120 Ω in parallel).');
    },
  };
}

function sceneTiming(ctx) {
  const root = ctx.svg;
  const RATES = [[125, 24, '≈ 500 m'], [250, 12, '≈ 250 m'], [500, 6, '≈ 100 m'], [1000, 3, '≈ 40 m']];
  ctx.controls.innerHTML = `<div class="calc"><label>Bit rate<select data-k="rate">${RATES.map(([r]) => `<option value="${r}" ${r === 500 ? 'selected' : ''}>${r >= 1000 ? r / 1000 + ' Mbit/s' : r + ' kbit/s'}</option>`).join('')}</select></label></div>`;
  let rate = 500;
  ctx.controls.querySelector('select').addEventListener('change', (e) => { rate = +e.target.value; });
  txt(root, 500, 34, 'Inside one bit: 16 time quanta (tq)', { anchor: 'middle', size: 18, weight: 650 });
  const X0 = 100, W = 800, tq = W / 16;
  const segs = [['SYNC', 1, C.muted], ['Bit Segment 1 (BS1)', 13, C.blue], ['BS2', 2, C.green]];
  let xx = X0;
  segs.forEach(([n, k, col]) => {
    rect(root, xx, 110, k * tq, 60, { rx: 6, fill: col, stroke: 'none', opacity: 0.22 });
    txt(root, xx + (k * tq) / 2, 140, n, { anchor: 'middle', size: 14, weight: 650, fill: col });
    xx += k * tq;
  });
  for (let i = 0; i <= 16; i++) line(root, X0 + i * tq, 175, X0 + i * tq, 185, { stroke: C.dim, sw: 1 });
  const spX = X0 + 14 * tq;
  line(root, spX, 95, spX, 200, { stroke: C.accent, sw: 2.5 });
  txt(root, spX, 215, 'sample point (87.5 %)', { anchor: 'middle', size: 13, fill: C.accent, weight: 650 });
  const head = line(root, X0, 100, X0, 190, { stroke: C.text, sw: 2 });
  const flash = circle(root, spX, 95, 10, { fill: C.accent, opacity: 0 });
  const calc = g(root);
  const tableY = 400;
  const rows = RATES.map(([r, , len], i) => {
    const y = tableY + i * 34;
    const bg = rect(root, 560, y - 15, 360, 30, { rx: 6, fill: 'transparent', stroke: 'none' });
    txt(root, 580, y, r >= 1000 ? '1 Mbit/s' : `${r} kbit/s`, { size: 14, mono: true });
    txt(root, 900, y, len, { anchor: 'end', size: 14, mono: true, fill: C.muted });
    return { bg, r };
  });
  txt(root, 580, tableY - 40, 'Rough max. bus length', { size: 13.5, weight: 650, fill: C.muted });
  let t0 = 0;
  return {
    tick(dt) {
      t0 += dt * 0.5;
      const k = t0 % 1;
      head.setAttribute('x1', X0 + k * W); head.setAttribute('x2', X0 + k * W);
      const near = Math.abs(k - 14 / 16) < 0.03;
      flash.setAttribute('opacity', near ? 0.9 : 0);
      const [, brp, len] = RATES.find(([r]) => r === rate);
      while (calc.firstChild) calc.firstChild.remove();
      const bitUs = 1000 / rate;
      const lines = [
        ['CAN peripheral clock (PCLK)', '48 MHz'],
        ['÷ prescaler (BRP)', String(brp)],
        ['= time quantum clock', `${(48 / brp).toFixed(0)} MHz → tq = ${((brp / 48) * 1000).toFixed(1)} ns`],
        ['× 16 tq per bit', `= ${bitUs.toFixed(bitUs < 1 ? 2 : 0)} µs per bit`],
        ['bit rate', rate >= 1000 ? '1 Mbit/s' : `${rate} kbit/s`],
      ];
      lines.forEach(([a, b], i) => {
        txt(calc, 80, 300 + i * 36, a, { size: 14, fill: C.muted });
        txt(calc, 480, 300 + i * 36, b, { size: 14, mono: true, anchor: 'end', weight: i === 4 ? 700 : 400, fill: i === 4 ? C.accent : C.text });
      });
      rows.forEach((r) => r.bg.setAttribute('fill', r.r === rate ? 'rgba(255,176,32,0.15)' : 'transparent'));
      ctx.caption(`Every node must use the <b>same bit rate</b>. The controller samples each bit late (at ~87.5 %) so the signal has time to settle across the whole bus: max length at this speed is ${len}. SYNC lets nodes re-align their clock on every recessive→dominant edge.`);
    },
  };
}

function sceneOurBoard(ctx) {
  const root = ctx.svg;
  txt(root, 500, 34, 'From firmware to wire: CAN on our board', { anchor: 'middle', size: 18, weight: 650 });
  const mcu = chip(root, 40, 150, 220, 200, 'STM32F042K6', 'U1');
  rect(root, 70, 230, 160, 60, { fill: '#2f2a1a', stroke: C.accent });
  txt(root, 150, 252, 'bxCAN controller', { anchor: 'middle', size: 13, weight: 650, fill: C.accent });
  txt(root, 150, 272, 'frames · filters · errors', { anchor: 'middle', size: 11, fill: C.muted });
  void mcu;
  const xc = chip(root, 420, 170, 160, 160, 'Transceiver', 'U3');
  void xc;
  // TX / RX wires
  txt(root, 268, 205, 'PA12 · CAN_TX', { size: 12, fill: C.muted, mono: true });
  txt(root, 268, 300, 'PA11 · CAN_RX', { size: 12, fill: C.muted, mono: true });
  txt(root, 412, 205, 'TXD', { size: 12, fill: C.muted, anchor: 'end' });
  txt(root, 412, 300, 'RXD', { size: 12, fill: C.muted, anchor: 'end' });
  const TXY = 220, RXY = 285;
  line(root, 260, TXY, 420, TXY, { stroke: C.line, sw: 2 });
  line(root, 260, RXY, 420, RXY, { stroke: C.line, sw: 2 });
  // bus pair to connector
  line(root, 580, 225, 940, 225, { stroke: C.canh, sw: 3 });
  line(root, 580, 275, 940, 275, { stroke: C.canl, sw: 3 });
  resistor(root, 700, 225, 275, 'R3 120 Ω');
  rect(root, 820, 195, 60, 110, { rx: 6, fill: '#1b3a6b', stroke: '#2f6fd0' });
  txt(root, 850, 320, 'J3', { anchor: 'middle', size: 13, weight: 650 });
  txt(root, 945, 225, 'CANH', { size: 12, fill: C.canh });
  txt(root, 945, 275, 'CANL', { size: 12, fill: C.canl });
  txt(root, 880, 345, 'twisted pair → rest of the car', { anchor: 'middle', size: 12, fill: C.muted });
  // waveforms
  const bits = [1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1];
  const wTX = path(root, '', { stroke: C.accent, sw: 2 });
  const wRX = path(root, '', { stroke: C.green, sw: 2 });
  const wH = path(root, '', { stroke: C.canh, sw: 2 });
  const wL = path(root, '', { stroke: C.canl, sw: 2 });
  txt(root, 40, 420, 'TX (3.3 V logic from the STM32)', { size: 12.5, fill: C.accent });
  txt(root, 40, 482, 'CANH / CANL on the cable', { size: 12.5, fill: C.muted });
  txt(root, 40, 548, 'RX (echoed back to the STM32)', { size: 12.5, fill: C.green });
  const dot = circle(root, 0, 0, 6, { fill: C.accent });
  let off = 0;
  const BW = 46, X0 = 300, X1 = 960;
  return {
    tick(dt, t) {
      off += dt * 60;
      const bitAt = (s) => bits[((Math.floor(s / BW) % bits.length) + bits.length) % bits.length];
      let dT = '', dR = '', dHH = '', dLL = '';
      for (let x = X0; x <= X1; x += 4) {
        const b = bitAt(x + off);
        const c = x === X0 ? 'M' : 'L';
        dT += `${c}${x},${b ? 405 : 435}`;
        dR += `${c}${x},${b ? 535 : 565}`;
        dHH += `${c}${x},${b ? 480 : 465}`;
        dLL += `${c}${x},${b ? 486 : 501}`;
      }
      wTX.setAttribute('d', dT); wRX.setAttribute('d', dR); wH.setAttribute('d', dHH); wL.setAttribute('d', dLL);
      const k = (t * 0.45) % 1;
      const pts = k < 0.33 ? [260 + (k / 0.33) * 160, TXY] : k < 0.66 ? [580 + ((k - 0.33) / 0.33) * 300, 250] : [420 - ((k - 0.66) / 0.34) * 160, RXY];
      dot.setAttribute('cx', pts[0]); dot.setAttribute('cy', pts[1]);
      dot.setAttribute('fill', k < 0.33 ? C.accent : k < 0.66 ? C.canh : C.green);
      ctx.caption('The STM32’s <b>bxCAN</b> peripheral builds frames and sends 3.3 V logic bits on TX. The <b>transceiver</b> converts them to the differential CANH/CANL signal, and also <b>echoes the bus back on RX</b>. That echo is how the controller checks every bit it sends, which arbitration and ACK both depend on.');
    },
  };
}

// ---------------------------------------------------------------- module
export const CAN_MODULE = {
  id: 'can',
  title: 'CAN Bus',
  subtitle: 'How the car’s controllers talk to each other',
  next: { id: 'i2c', label: 'Next module: I²C' },
  steps: [
    {
      title: 'What is CAN?',
      body: `<p><b>CAN</b> (Controller Area Network) is a communication bus invented by Bosch for cars. Almost every controller in our car, such as the inverter, BMS, dashboard and data logger, is connected to the same two wires.</p>
<ul><li>It’s a <b>broadcast</b> bus: there are no addresses, and every node hears every message.</li><li>Each message has an <b>identifier</b> (ID) saying what it contains, like “motor speed”.</li><li>It’s <b>robust</b>: it was designed for electrically noisy vehicles.</li></ul>`,
      scene: sceneBus,
    },
    {
      title: 'Differential signaling: CANH & CANL',
      body: `<p>CAN uses two wires, <b style="color:${C.canh}">CANH</b> and <b style="color:${C.canl}">CANL</b>. The receiver doesn’t look at either wire alone. It measures the <b>difference</b> between them.</p>
<p>The two wires are twisted together, so any noise (for example from the 80 kW motor) hits both wires almost equally and cancels out in the difference.</p>
<p>Turn on the noise and see what happens. Then compare with decoding from a single wire.</p>`,
      scene: sceneDifferential,
    },
    {
      title: 'Dominant beats recessive',
      body: `<p>A CAN bit is either <b>dominant (0)</b> or <b>recessive (1)</b>.</p>
<ul><li>To send a 0, a node actively drives the wires apart.</li><li>To send a 1, a node does nothing and lets the termination pull the wires back together.</li></ul>
<p>So if <i>any</i> node sends 0, the whole bus reads 0. This is called a <b>wired-AND</b>. It sounds like a small detail, but arbitration, acknowledgement and error signalling are all built on it.</p>`,
      scene: sceneWiredAnd,
    },
    {
      title: 'Anatomy of a CAN frame',
      body: `<p>A message is sent as a <b>frame</b>: a fixed sequence of fields. The cursor walks through a real frame bit by bit, and the card below the animation explains each field.</p>
<p>The CRC and stuff bits are calculated for real. Try your own ID and data in the boxes below the text.</p>
<p class="muted small">Shown: a classic CAN 2.0A frame with an 11-bit ID. CAN FD and 29-bit extended IDs follow the same ideas.</p>`,
      scene: sceneFrame,
    },
    {
      title: 'Arbitration: who gets to talk?',
      body: `<p>What if two nodes start sending at exactly the same time? CAN resolves this <b>without losing any data</b>.</p>
<p>Every node reads the bus back while it transmits its ID. If a node sends a 1 (recessive) but reads a 0 (dominant), someone with a lower ID is also talking. That node silently stops and becomes a receiver.</p>
<p>The result: the message with the <b>lowest ID always wins</b>. Lower IDs mean higher priority.</p>`,
      scene: sceneArbitration,
    },
    {
      title: 'ACK & error handling',
      body: `<p>CAN checks for errors all the time:</p>
<ul><li><b>ACK:</b> every receiver writes a 0 into the ACK slot of a good frame. If nobody does, the sender knows the frame wasn’t received.</li>
<li><b>CRC, bit, stuff and form checks:</b> any node that spots a problem sends an <b>error frame</b>, and the message is automatically resent.</li></ul>
<p>Each node keeps error counters. A node that keeps causing errors becomes <b>error passive</b>, then <b>bus off</b>, removing itself so one faulty controller can’t take down the whole car.</p>`,
      scene: sceneErrors,
    },
    {
      title: 'Termination & reflections',
      body: `<p>At CAN speeds, the cable behaves like a <b>transmission line</b> with about 120 Ω characteristic impedance. If the far end isn’t terminated, the signal edge reflects back and causes ringing.</p>
<ul><li>Put one <b>120 Ω resistor at each physical end</b> of the bus, not on every node.</li><li>Keep the stubs (branches off the main bus) short.</li></ul>`,
      scene: sceneTermination,
    },
    {
      title: 'Bit timing & bus speed',
      body: `<p>All nodes must agree on the <b>bit rate</b>. Common rates are 125, 250, 500 kbit/s and 1 Mbit/s. Faster rates allow shorter buses, because a bit has to reach the far end and come back before it is sampled.</p>
<p>The CAN controller divides each bit into small <b>time quanta</b> and samples near the end of the bit. On the STM32F042 you set this with the prescaler and the BS1/BS2 lengths. STM32CubeMX can calculate them for you.</p>`,
      scene: sceneTiming,
    },
    {
      title: 'CAN on our board',
      body: `<p>On the 3D board, the STM32F042’s CAN pins (PA12 = TX, PA11 = RX) go to the transceiver <b>U3</b>, which drives CANH/CANL to the connector <b>J3</b>. <b>R3</b> is the 120 Ω terminator, because this board sits at one end of the bus.</p>
<p>Sending a frame with ST’s HAL library:</p>
<pre><code>CAN_TxHeaderTypeDef tx = {
  .StdId = 0x123, .IDE = CAN_ID_STD,
  .RTR = CAN_RTR_DATA, .DLC = 2 };
uint8_t data[2] = { 0x0F, 0xA0 };
uint32_t mailbox;
HAL_CAN_Start(&amp;hcan);
HAL_CAN_AddTxMessage(&amp;hcan, &amp;tx, data, &amp;mailbox);</code></pre>
<p><b>Layout tips:</b> route CANH/CANL as a tight pair, keep the transceiver close to the connector, add ESD protection on connectors that leave the enclosure, and make sure every node shares a common ground.</p>
<p class="muted small">Note: on the STM32F042, CAN and USB share pins PA11/PA12. That’s why this board uses USB for power only.</p>`,
      scene: sceneOurBoard,
      board: { terms: ['can'], label: 'See the CAN circuit on the 3D board' },
    },
  ],
};
