// I²C lesson module.
import { C, h, g, txt, rect, line, path, circle, chip, resistor, clamp, hex, bin, clickable } from './svg.js';

const DRV = { ctrl: C.accent, tgt: C.green, rel: C.muted, idle: C.muted };

// Build an I²C waveform. Time unit = one bit (one SCL period).
function i2cSeq(items) {
  let t = 0;
  const scl = [[0, 1, 'idle']], sda = [[0, 1, 'idle']];
  const marks = [], bits = [], samples = [], notes = [];
  const set = (arr, tt, lv, drv) => arr.push([tt, lv, drv]);
  const bit = (b, by) => {
    set(sda, t + 0.12, b, by);
    set(scl, t + 0.5, 1, 'rel');
    set(scl, t + 1, 0, 'ctrl');
    samples.push(t + 0.75);
    bits.push({ t: t + 0.5, b, by });
    t += 1;
  };
  for (const it of items) {
    switch (it.type) {
      case 'idle': t += it.units || 1; break;
      case 'start':
        set(sda, t + 0.5, 0, 'ctrl'); set(scl, t + 1, 0, 'ctrl');
        marks.push({ t0: t, t1: t + 1, label: 'START', col: C.blue, kind: 'cond' });
        notes.push({ t: t + 0.5, kind: 'start' });
        t += 1; break;
      case 'rstart':
        set(sda, t + 0.15, 1, 'rel'); set(scl, t + 0.4, 1, 'rel'); set(sda, t + 0.7, 0, 'ctrl'); set(scl, t + 1, 0, 'ctrl');
        marks.push({ t0: t, t1: t + 1, label: 'Sr', col: C.blue, kind: 'cond', long: 'Repeated START' });
        t += 1; break;
      case 'stop':
        set(sda, t + 0.12, 0, 'ctrl'); set(scl, t + 0.45, 1, 'rel'); set(sda, t + 0.75, 1, 'rel');
        marks.push({ t0: t, t1: t + 1, label: 'STOP', col: C.blue, kind: 'cond' });
        notes.push({ t: t + 0.75, kind: 'stop' });
        t += 1; break;
      case 'bits': {
        const t0 = t;
        it.bits.forEach((b) => bit(b, it.by));
        if (it.label) marks.push({ t0, t1: t, label: it.label, col: DRV[it.by], kind: 'data' });
        break;
      }
      case 'byte': {
        const t0 = t;
        for (let i = 7; i >= 0; i--) bit((it.v >> i) & 1, it.by);
        marks.push({ t0, t1: t, label: it.label, col: DRV[it.by], kind: 'byte', v: it.v });
        break;
      }
      case 'ack': {
        const t0 = t;
        bit(it.ack ? 0 : 1, it.ack ? it.by : 'rel');
        marks.push({ t0, t1: t, label: it.ack ? 'ACK' : 'NACK', col: it.ack ? DRV[it.by] : C.red, kind: 'ack' });
        break;
      }
      case 'stretch':
        set(scl, t, 0, 'tgt');
        marks.push({ t0: t, t1: t + it.units, label: 'clock stretch', col: C.green, kind: 'stretch' });
        t += it.units;
        set(scl, t, 0, 'ctrl');
        break;
      default: break;
    }
  }
  set(sda, t, sda[sda.length - 1][1], 'idle');
  set(scl, t, 1, 'idle');
  return { T: t, scl, sda, marks, bits, samples, notes };
}

// Draw one signal (scl or sda) between time w0..w1 into group grp, coloured by driver.
function drawSignal(grp, steps, w0, w1, X0, X1, yHi, yLo) {
  const tx = (tt) => X0 + ((tt - w0) / (w1 - w0)) * (X1 - X0);
  const ly = (lv) => (lv ? yHi : yLo);
  for (let i = 0; i < steps.length; i++) {
    const [t, lv, drv] = steps[i];
    const tn = i + 1 < steps.length ? steps[i + 1][0] : w1;
    if (tn < w0 || t > w1) continue;
    const a = Math.max(t, w0), b = Math.min(tn, w1);
    const prev = i > 0 ? steps[i - 1][1] : lv;
    let d = `M${tx(a)},${ly(t >= w0 ? prev : lv)}`;
    if (t >= w0 && prev !== lv) d += `L${tx(a) + 3},${ly(lv)}`;
    d += `L${tx(b)},${ly(lv)}`;
    path(grp, d, { stroke: DRV[drv] || C.muted, sw: 2.5 });
  }
}

// ---------------------------------------------------------------- scenes
function sceneOverview(ctx) {
  const root = ctx.svg;
  txt(root, 500, 34, 'One controller, many targets, two wires', { anchor: 'middle', size: 18, weight: 650 });
  const ySDA = 300, ySCL = 345, X0 = 250, X1 = 940;
  line(root, 160, 90, 300, 90, { stroke: C.red, sw: 2 });
  txt(root, 160, 72, '3.3 V', { size: 13, fill: C.red });
  resistor(root, 200, 90, ySDA, 'Rp', { left: true });
  resistor(root, 270, 90, ySCL, 'Rp');
  line(root, 200, ySDA, X1, ySDA, { stroke: C.sda, sw: 4 });
  line(root, 160, ySCL, X1, ySCL, { stroke: C.scl, sw: 4 });
  txt(root, X1 + 8, ySDA, 'SDA', { size: 13, fill: C.sda, weight: 650 });
  txt(root, X1 + 8, ySCL, 'SCL', { size: 13, fill: C.scl, weight: 650 });
  const ctrl = chip(root, 20, 260, 140, 120, 'STM32', 'controller');
  line(root, 160, ySDA, 200, ySDA, { stroke: C.sda, sw: 4 });
  void ctrl;
  const targets = [
    { name: 'Temp sensor', addr: 0x48, x: 430, up: true },
    { name: 'IMU', addr: 0x68, x: 620, up: false },
    { name: 'EEPROM', addr: 0x50, x: 800, up: true },
  ].map((tg) => {
    const by = tg.up ? 140 : 420;
    line(root, tg.x - 15, tg.up ? by + 80 : by, tg.x - 15, ySDA, { stroke: C.sda, sw: 2 });
    line(root, tg.x + 15, tg.up ? by + 80 : by, tg.x + 15, ySCL, { stroke: C.scl, sw: 2 });
    const c = chip(root, tg.x - 80, by, 160, 80, tg.name, `address ${hex(tg.addr)}`);
    const st = txt(root, tg.x, tg.up ? by - 16 : by + 98, '', { anchor: 'middle', size: 13, weight: 650 });
    return { ...tg, c, st };
  });
  const bubble = g(root);
  rect(bubble, -62, -16, 124, 32, { rx: 16, fill: '#3a2a08', stroke: C.accent });
  const bt = txt(bubble, 0, 0, '', { anchor: 'middle', size: 13, weight: 700, mono: true, fill: C.accent });
  const PER = 3.6;
  return {
    tick(dt, t) {
      const k = Math.floor(t / PER) % targets.length;
      const lt = t % PER;
      const tg = targets[k];
      const x = clamp(170 + (lt / 1.4) * 760, 170, 930);
      bubble.setAttribute('transform', `translate(${x},${ySDA - 30})`);
      bubble.setAttribute('opacity', lt < 1.6 ? 1 : 0);
      bt.textContent = `${hex(tg.addr)}, are you there?`;
      bt.textContent = `call ${hex(tg.addr)}`;
      targets.forEach((o) => {
        const passed = x >= o.x - 20 || lt > 1.4;
        const me = o === tg;
        o.c.box.setAttribute('stroke', passed ? (me ? C.green : '#4a5160') : C.line);
        o.c.box.setAttribute('stroke-width', passed && me ? 3 : 1.5);
        o.st.textContent = passed ? (me ? (lt > 1.6 ? 'ACK ✓ replying…' : 'that’s me!') : 'not me') : '';
        o.st.setAttribute('fill', me ? C.green : C.dim);
      });
      ctx.caption(`The STM32 sends address <code>${hex(tg.addr)}</code> on SDA, clocked by SCL. Every target compares it with its own address. Only the <b>${tg.name}</b> answers. The others ignore the rest of the conversation.`);
    },
  };
}

function sceneOpenDrain(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `
    <div class="calc">
      <label><span>Pull-up resistor R<sub>p</sub>: <b data-o="r"></b></span><input type="range" min="0.5" max="10" step="0.1" value="2.2" data-k="r"></label>
      <label><span>Bus capacitance C<sub>bus</sub>: <b data-o="c"></b></span><input type="range" min="20" max="400" step="5" value="100" data-k="c"></label>
      <label>Bus speed<select data-k="mode"><option value="100">Standard mode · 100 kHz</option><option value="400" selected>Fast mode · 400 kHz</option><option value="1000">Fast-mode Plus · 1 MHz</option></select></label>
    </div>`;
  const q = (k) => ctx.controls.querySelector(`[data-k=${k}]`);
  const o = (k) => ctx.controls.querySelector(`[data-o=${k}]`);
  txt(root, 500, 34, 'Devices can only pull the line LOW. The resistor pulls it HIGH.', { anchor: 'middle', size: 18, weight: 650 });
  // circuit
  const BUSY = 230;
  line(root, 80, 90, 420, 90, { stroke: C.red, sw: 2 });
  txt(root, 80, 72, '3.3 V', { size: 13, fill: C.red });
  resistor(root, 200, 90, BUSY, 'Rp');
  const bus = line(root, 120, BUSY, 440, BUSY, { stroke: C.sda, sw: 5 });
  txt(root, 445, BUSY, 'SDA', { size: 13, fill: C.sda });
  // capacitor
  line(root, 130, BUSY, 130, 300, { stroke: C.muted }); line(root, 112, 300, 148, 300, { stroke: C.muted, sw: 3 }); line(root, 112, 310, 148, 310, { stroke: C.muted, sw: 3 }); line(root, 130, 310, 130, 380, { stroke: C.muted });
  txt(root, 100, 305, 'C', { anchor: 'end', size: 13, fill: C.muted });
  const gnd = (x) => { line(root, x - 16, 380, x + 16, 380, { stroke: C.muted }); line(root, x - 10, 387, x + 10, 387, { stroke: C.muted }); line(root, x - 4, 394, x + 4, 394, { stroke: C.muted }); };
  gnd(130);
  const sw = [280, 380].map((x, i) => {
    line(root, x, BUSY, x, 300, { stroke: C.muted });
    const lever = line(root, x, 300, x + 22, 340, { stroke: C.text, sw: 3 });
    circle(root, x, 300, 4, { fill: C.text });
    circle(root, x, 345, 4, { fill: C.text });
    line(root, x, 345, x, 380, { stroke: C.muted });
    gnd(x);
    txt(root, x, 418, i === 0 ? 'STM32' : 'sensor', { anchor: 'middle', size: 12.5, fill: C.muted });
    return { x, lever };
  });
  const dots = Array.from({ length: 6 }, () => circle(root, 0, 0, 4, { fill: C.accent, opacity: 0 }));
  // plot
  const PX0 = 500, PX1 = 960, PY = (v) => 380 - (v / 3.3) * 250;
  rect(root, PX0 - 10, 110, PX1 - PX0 + 20, 290, { fill: '#12151b', stroke: C.line });
  [0, 0.3, 0.7, 1].forEach((f) => {
    line(root, PX0, PY(3.3 * f), PX1, PY(3.3 * f), { stroke: f === 0.3 || f === 0.7 ? C.dim : C.grid, sw: 1, dash: f === 0.3 || f === 0.7 ? '4 4' : null });
    txt(root, PX0 - 14, PY(3.3 * f), f === 0 ? '0' : f === 1 ? '3.3 V' : `${f * 100}%`, { anchor: 'end', size: 11, fill: C.dim });
  });
  const wave = path(root, '', { stroke: C.sda, sw: 2.5 });
  const head = line(root, PX0, 115, PX0, 395, { stroke: C.text, sw: 1.5, opacity: 0.6 });
  const tlabel = txt(root, PX1, 410, '', { anchor: 'end', size: 11.5, fill: C.dim });
  const out = g(root);
  let t0 = 0;
  return {
    tick(dt) {
      const R = +q('r').value * 1000, Cb = +q('c').value * 1e-12, f = +q('mode').value * 1000;
      o('r').textContent = `${(+q('r').value).toFixed(1)} kΩ`; o('c').textContent = `${q('c').value} pF`;
      const P = 1 / f, tau = R * Cb, tr = 0.8473 * tau;
      const limit = f <= 100e3 ? 1000e-9 : f <= 400e3 ? 300e-9 : 120e-9;
      const rmin = (3.3 - 0.4) / (f > 400e3 ? 0.02 : 0.003);
      // simulate two periods: low for first half (device pulls), released second half.
      const N = 240, span = 2 * P;
      let v = 3.3, d = '';
      const vs = [];
      for (let i = 0; i <= N; i++) {
        const tt = (i / N) * span, ph = (tt % P) / P;
        const dtt = span / N;
        if (ph < 0.5) v = v * Math.exp(-dtt / (40 * Cb + 1e-12)); else v = 3.3 - (3.3 - v) * Math.exp(-dtt / tau);
        vs.push(v);
        d += `${i ? 'L' : 'M'}${PX0 + (i / N) * (PX1 - PX0)},${PY(v)}`;
      }
      wave.setAttribute('d', d);
      tlabel.textContent = `2 clock periods = ${(span * 1e6).toFixed(span < 4e-6 ? 1 : 0)} µs`;
      t0 = (t0 + dt * 0.35) % 1;
      const hx = PX0 + t0 * (PX1 - PX0);
      head.setAttribute('x1', hx); head.setAttribute('x2', hx);
      const pulling = ((t0 * 2) % 1) < 0.5;
      const vnow = vs[Math.round(t0 * N)];
      sw[0].lever.setAttribute('x2', sw[0].x + (pulling ? 0 : 22));
      sw[0].lever.setAttribute('y2', pulling ? 345 : 340);
      bus.setAttribute('opacity', 0.35 + 0.65 * (vnow / 3.3));
      dots.forEach((dot, i) => {
        const k = ((t0 * 6 + i / dots.length) % 1);
        if (pulling) {
          const pts = k < 0.5 ? [200, 90 + k * 2 * (BUSY - 90)] : [200 + (k - 0.5) * 2 * 80, BUSY];
          dot.setAttribute('cx', pts[0]); dot.setAttribute('cy', pts[1]); dot.setAttribute('opacity', 0.9);
        } else dot.setAttribute('opacity', 0);
      });
      while (out.firstChild) out.firstChild.remove();
      const ok = tr <= limit, rOk = R >= rmin;
      const rows = [
        ['Time constant τ = Rp × C', `${(tau * 1e9).toFixed(0)} ns`],
        ['Rise time (30 % → 70 %) ≈ 0.85 τ', `${(tr * 1e9).toFixed(0)} ns`],
        [`Max allowed at this speed`, `${(limit * 1e9).toFixed(0)} ns`],
      ];
      rows.forEach(([a, b], i) => { txt(out, 60, 460 + i * 28, a, { size: 14, fill: C.muted }); txt(out, 460, 460 + i * 28, b, { size: 14, mono: true, anchor: 'end' }); });
      txt(out, 520, 460, ok ? '✓ Rise time OK' : '✗ Too slow: lower Rp or capacitance', { size: 15, weight: 700, fill: ok ? C.green : C.red });
      txt(out, 520, 492, rOk ? `✓ Rp ≥ ${(rmin / 1000).toFixed(2)} kΩ` : `✗ Rp too small (< ${(rmin / 1000).toFixed(2)} kΩ)`, { size: 15, weight: 700, fill: rOk ? C.green : C.red });
      txt(out, 520, 518, rOk ? 'devices can still pull the line low enough' : 'devices can’t sink enough current to reach a valid LOW', { size: 12.5, fill: C.muted });
      ctx.caption('When a device switches <b>on</b> it pulls the line to ground almost instantly. When everyone lets go, only the pull-up resistor charges the bus capacitance back up, so the rising edge is a slow curve. A bigger R or more capacitance (longer wires, more devices) makes it slower.');
    },
  };
}

function waveScene(ctx, seq, opts = {}) {
  // Generic animated timing diagram that scrolls if the transaction is longer than the window.
  const root = ctx.svg;
  const X0 = 110, X1 = 960, WIN = opts.win || seq.T + 0.5;
  const ySclH = opts.y || 150, ySclL = ySclH + 50, ySdaH = ySclH + 120, ySdaL = ySdaH + 50;
  txt(root, X0 - 14, (ySclH + ySclL) / 2, 'SCL', { anchor: 'end', size: 14, weight: 700, fill: C.scl });
  txt(root, X0 - 14, (ySdaH + ySdaL) / 2, 'SDA', { anchor: 'end', size: 14, weight: 700, fill: C.sda });
  const legend = g(root);
  [['STM32 drives', C.accent], ['sensor drives', C.green], ['released (pull-up)', C.muted]].forEach(([l, c], i) => {
    line(legend, 600 + i * 130, 60, 620 + i * 130, 60, { stroke: c, sw: 4 });
    txt(legend, 626 + i * 130, 60, l, { size: 12, fill: C.muted });
  });
  const layer = g(root);
  const headLine = line(root, 0, ySclH - 30, 0, ySdaL + 20, { stroke: C.text, sw: 1.5, opacity: 0.7 });
  let tt = 0;
  return {
    seq, ySclH, ySclL, ySdaH, ySdaL,
    tick(dt) {
      tt += dt * (opts.rate || 1.6);
      const T = seq.T + 1.5;
      if (tt > T) tt = 0;
      const p = Math.min(tt, seq.T);
      let w0 = 0;
      if (WIN < seq.T) w0 = clamp(p - WIN * 0.45, 0, seq.T - WIN);
      const w1 = w0 + WIN;
      const tx = (t) => X0 + ((t - w0) / WIN) * (X1 - X0);
      while (layer.firstChild) layer.firstChild.remove();
      // byte / condition boxes
      seq.marks.forEach((m) => {
        if (m.t1 < w0 || m.t0 > w1) return;
        const a = tx(Math.max(m.t0, w0)), b = tx(Math.min(m.t1, w1));
        const shown = m.t0 <= p;
        rect(layer, a + 1, ySclH - 50, b - a - 2, 26, { rx: 5, fill: m.col, stroke: 'none', opacity: shown ? 0.25 : 0.07 });
        const label = (b - a) > m.label.length * 7 ? m.label : (m.kind === 'ack' ? (m.label === 'ACK' ? 'A' : 'N') : m.label === 'STOP' ? 'P' : m.label === 'START' ? 'S' : '');
        if (label) txt(layer, (a + b) / 2, ySclH - 37, label, { anchor: 'middle', size: 12, weight: 700, fill: m.col, opacity: shown ? 1 : 0.3 });
        if (m.kind === 'ack' || m.kind === 'stretch') rect(layer, a, ySclH - 6, b - a, ySdaL - ySclH + 14, { rx: 4, fill: 'none', stroke: m.col, sw: 1.5, dash: '4 4', opacity: shown ? 0.8 : 0.2 });
      });
      drawSignal(layer, seq.scl, w0, w1, X0, X1, ySclH, ySclL);
      drawSignal(layer, seq.sda, w0, w1, X0, X1, ySdaH, ySdaL);
      // bit values
      seq.bits.forEach((b) => {
        if (b.t < w0 || b.t > w1) return;
        txt(layer, tx(b.t + 0.25), ySdaL + 22, String(b.b), { anchor: 'middle', size: 12.5, mono: true, fill: b.t <= p ? DRV[b.by] : C.dim });
      });
      if (opts.samples) seq.samples.forEach((s) => {
        if (s < w0 || s > w1 || s > p) return;
        circle(layer, tx(s), ySdaH - 12, 4, { fill: C.text });
      });
      // hide future (dim overlay)
      const hx = tx(p);
      rect(layer, hx, ySclH - 54, Math.max(0, X1 - hx + 2), ySdaL - ySclH + 84, { rx: 0, fill: C.bg, stroke: 'none', opacity: 0.55 });
      headLine.setAttribute('x1', hx); headLine.setAttribute('x2', hx);
      opts.onTick?.(p, tx, layer);
    },
  };
}

function sceneRules(ctx) {
  const seq = i2cSeq([{ type: 'idle', units: 0.8 }, { type: 'start' }, { type: 'bits', bits: [1, 0, 1], by: 'ctrl', label: 'data bits' }, { type: 'stop' }, { type: 'idle', units: 0.8 }]);
  txt(ctx.svg, 500, 34, 'The three rules of the I²C bus', { anchor: 'middle', size: 18, weight: 650 });
  const W = waveScene(ctx, seq, {
    y: 170, rate: 0.9, samples: true,
    onTick(p, tx, layer) {
      const st = seq.notes.find((n) => n.kind === 'start'), sp = seq.notes.find((n) => n.kind === 'stop');
      const note = (x, y, s, col) => txt(layer, x, y, s, { anchor: 'middle', size: 13, weight: 650, fill: col });
      if (p >= st.t) note(tx(st.t), 455, 'START: SDA falls while SCL is HIGH', C.blue);
      if (p >= 2.5) note(tx(3.1), 490, 'SDA only changes while SCL is LOW', C.accent);
      if (p >= 2.9) note(tx(3.6), 525, '• receiver reads SDA while SCL is HIGH', C.text);
      if (p >= sp.t) note(tx(sp.t) - 30, 455, 'STOP: SDA rises while SCL is HIGH', C.blue);
      let cap = 'The bus is idle: both lines are released and pulled high.';
      if (p >= st.t) cap = '<b>START</b>: the controller pulls SDA low <i>while SCL is still high</i>. This is the only time (besides STOP) that SDA may change while SCL is high, so everyone recognises it.';
      if (p >= 1.9) cap = '<b>Data bits</b>: SDA changes only while SCL is <b>low</b>. When SCL goes high, the receiver reads (samples) SDA. Each white dot is a sample point.';
      if (p >= sp.t - 0.3) cap = '<b>STOP</b>: SDA goes high <i>while SCL is high</i>. The bus is free again.';
      ctx.caption(cap);
    },
  });
  return W;
}

function sceneTransaction(ctx) {
  const items = [
    { type: 'idle', units: 0.5 }, { type: 'start' },
    { type: 'byte', v: 0x90, by: 'ctrl', label: 'Address 0x48 + Write' }, { type: 'ack', ack: true, by: 'tgt' },
    { type: 'byte', v: 0x00, by: 'ctrl', label: 'Register 0x00 (temp)' }, { type: 'ack', ack: true, by: 'tgt' },
    { type: 'rstart' },
    { type: 'byte', v: 0x91, by: 'ctrl', label: 'Address 0x48 + Read' }, { type: 'ack', ack: true, by: 'tgt' },
    { type: 'byte', v: 0x19, by: 'tgt', label: 'Temp high byte 0x19' }, { type: 'ack', ack: true, by: 'ctrl' },
    { type: 'byte', v: 0x80, by: 'tgt', label: 'Temp low byte 0x80' }, { type: 'ack', ack: false, by: 'ctrl' },
    { type: 'stop' }, { type: 'idle', units: 0.5 },
  ];
  const seq = i2cSeq(items);
  const root = ctx.svg;
  txt(root, 60, 60, 'Reading the temperature from U4', { size: 17, weight: 650 });
  // mini-map
  const MX0 = 60, MX1 = 940, MY = 430;
  const mm = g(root);
  const mx = (t) => MX0 + (t / seq.T) * (MX1 - MX0);
  seq.marks.forEach((m) => {
    rect(mm, mx(m.t0) + 0.5, MY, mx(m.t1) - mx(m.t0) - 1, 22, { rx: 3, fill: m.col, stroke: 'none', opacity: 0.45 });
  });
  txt(root, MX0, MY - 12, 'Whole transaction', { size: 12, fill: C.muted });
  const mHead = rect(root, MX0, MY - 4, 3, 30, { rx: 1, fill: C.text, stroke: 'none' });
  const result = txt(root, 500, 520, '', { anchor: 'middle', size: 17, weight: 700, fill: C.green });
  const resSub = txt(root, 500, 552, '', { anchor: 'middle', size: 13.5, fill: C.muted, mono: true });
  const DESCR = {
    START: 'The STM32 claims the bus with a <b>START</b>.',
    'Address 0x48 + Write': 'It sends the 7-bit address <code>1001000</code> (0x48) followed by <b>W = 0</b>: “sensor 0x48, I want to <i>write</i>”.',
    ACK: 'The receiver pulls SDA low during the 9th clock: <b>ACK</b>, “got it”.',
    'Register 0x00 (temp)': 'It writes the register number it wants to read: <code>0x00</code>, the temperature register.',
    Sr: 'A <b>repeated START</b> lets it change direction without releasing the bus.',
    'Address 0x48 + Read': 'Address again, now with <b>R = 1</b>: “now I want to <i>read</i>”.',
    'Temp high byte 0x19': 'Now the <b>sensor</b> drives SDA (green) and sends the first data byte. The STM32 still drives the clock.',
    'Temp low byte 0x80': 'Second data byte from the sensor.',
    NACK: 'The STM32 answers with <b>NACK</b> (leaves SDA high) to say “that’s enough data”.',
    STOP: 'A <b>STOP</b> releases the bus.',
  };
  const W = waveScene(ctx, seq, {
    y: 170, win: 14, rate: 1.9,
    onTick(p) {
      mHead.setAttribute('x', mx(p) - 1);
      const m = [...seq.marks].reverse().find((mk) => mk.t0 <= p) || seq.marks[0];
      const done = p >= seq.T - 0.5;
      result.textContent = done ? 'Temperature = 25.5 °C' : '';
      resSub.textContent = done ? '0x19 0x80 → (0x1980 >> 7) × 0.5 °C = 51 × 0.5 = 25.5 °C' : '';
      ctx.caption(DESCR[m.label] || '');
    },
  });
  return W;
}

function sceneAck(ctx) {
  ctx.controls.innerHTML = `
    <div class="presets">
      <button class="chip" data-a="72">Call 0x48 (the sensor on our board)</button>
      <button class="chip" data-a="74">Call 0x4A (nobody has this address)</button>
    </div>`;
  let addr = 0x48, W;
  const build = () => {
    while (ctx.svg.firstChild) ctx.svg.firstChild.remove();
    const present = addr === 0x48;
    const items = [{ type: 'idle', units: 0.5 }, { type: 'start' }, { type: 'byte', v: (addr << 1) | 0, by: 'ctrl', label: `Address ${hex(addr)} + W` }, { type: 'ack', ack: present, by: 'tgt' }];
    if (present) items.push({ type: 'byte', v: 0x01, by: 'ctrl', label: 'Register 0x01' }, { type: 'ack', ack: true, by: 'tgt' });
    items.push({ type: 'stop' }, { type: 'idle', units: 0.5 });
    const seq = i2cSeq(items);
    txt(ctx.svg, 500, 34, present ? 'A device answers: ACK' : 'Nobody answers: NACK', { anchor: 'middle', size: 18, weight: 650, fill: present ? C.green : C.red });
    W = waveScene(ctx, seq, {
      y: 170, rate: 1.4,
      onTick(p, tx, layer) {
        const ack = seq.marks.find((m) => m.kind === 'ack');
        if (p >= ack.t0) {
          txt(layer, tx((ack.t0 + ack.t1) / 2), 470, present ? 'Sensor pulls SDA LOW = ACK' : 'SDA stays HIGH = NACK', { anchor: 'middle', size: 14, weight: 700, fill: present ? C.green : C.red });
          txt(layer, tx((ack.t0 + ack.t1) / 2), 495, '9th clock pulse', { anchor: 'middle', size: 12.5, fill: C.muted });
        }
        ctx.caption(present
          ? 'After every 8 bits, the <b>receiver</b> answers in a 9th clock. The sensor recognised its address, so it pulls SDA low: <b>ACK</b>. The transfer continues.'
          : 'No device has address 0x4A, so nobody pulls SDA low during the 9th clock. The pull-up keeps it high: <b>NACK</b>. The STM32 gives up and sends STOP. In firmware, <code>HAL_I2C_…</code> returns <code>HAL_ERROR</code>. This is the #1 clue when an I²C device “doesn’t work”: wrong address, wiring or power.');
      },
    });
  };
  ctx.controls.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) { addr = +b.dataset.a; build(); } });
  build();
  return { tick: (dt, t) => W.tick(dt, t) };
}

function sceneStretch(ctx) {
  const seq = i2cSeq([
    { type: 'idle', units: 0.5 }, { type: 'start' },
    { type: 'byte', v: 0x91, by: 'ctrl', label: 'Address 0x48 + Read' }, { type: 'ack', ack: true, by: 'tgt' },
    { type: 'stretch', units: 2.5 },
    { type: 'byte', v: 0x19, by: 'tgt', label: 'Data 0x19' }, { type: 'ack', ack: false, by: 'ctrl' },
    { type: 'stop' }, { type: 'idle', units: 0.5 },
  ]);
  const root = ctx.svg;
  txt(root, 500, 34, 'Clock stretching: “wait, I’m not ready yet”', { anchor: 'middle', size: 18, weight: 650 });
  const t0 = 380;
  txt(root, 60, t0 + 85, 'I²C speed grades', { size: 14, weight: 650, fill: C.muted });
  [['Standard mode', '100 kHz', 'the default, very forgiving'], ['Fast mode', '400 kHz', 'common for sensors'], ['Fast-mode Plus', '1 MHz', 'needs stronger pull-ups']].forEach(([a, b, c], i) => {
    const y = t0 + 115 + i * 28;
    txt(root, 60, y, a, { size: 14 }); txt(root, 300, y, b, { size: 14, mono: true, fill: C.accent }); txt(root, 400, y, c, { size: 13, fill: C.muted });
  });
  return waveScene(ctx, seq, {
    y: 150, rate: 1.5,
    onTick(p) {
      const st = seq.marks.find((m) => m.kind === 'stretch');
      ctx.caption(p >= st.t0 && p < st.t1 + 0.3
        ? 'The <b>sensor</b> is holding SCL low (green). The STM32 releases SCL but sees it stay low, so it waits. Once the sensor lets go, the clock continues.'
        : 'Only the controller generates the clock. But because SCL is also open-drain, a slow target can hold it low to pause the transfer. The STM32’s I²C peripheral handles this automatically.');
    },
  });
}

function sceneBoard(ctx) {
  const root = ctx.svg;
  txt(root, 500, 34, 'I²C on our board: STM32 ↔ temperature sensor U4', { anchor: 'middle', size: 18, weight: 650 });
  chip(root, 40, 180, 200, 180, 'STM32F042K6', 'U1 · I2C1');
  txt(root, 248, 236, 'PB7 · SDA (pin 30)', { size: 12, mono: true, fill: C.muted });
  txt(root, 248, 306, 'PB6 · SCL (pin 29)', { size: 12, mono: true, fill: C.muted });
  const ySDA = 250, ySCL = 320;
  line(root, 240, ySDA, 640, ySDA, { stroke: C.sda, sw: 4 });
  line(root, 240, ySCL, 640, ySCL, { stroke: C.scl, sw: 4 });
  line(root, 380, 110, 540, 110, { stroke: C.red, sw: 2 });
  txt(root, 380, 92, '3.3 V', { size: 13, fill: C.red });
  resistor(root, 420, 110, ySDA, 'R8 4.7 kΩ', { left: true });
  resistor(root, 500, 110, ySCL, 'R7 4.7 kΩ');
  rect(root, 640, 170, 220, 230, { fill: C.chip, stroke: C.line, rx: 10 });
  txt(root, 750, 194, 'U4', { anchor: 'middle', size: 16, weight: 650 });
  txt(root, 750, 214, 'temperature sensor', { anchor: 'middle', size: 12.5, fill: C.muted });
  txt(root, 650, ySDA, 'SDA', { size: 12, fill: C.muted }); txt(root, 650, ySCL, 'SCL', { size: 12, fill: C.muted });
  const pins = ['A2', 'A1', 'A0'].map((n, i) => {
    const y = 210 + i * 0;
    const x = 690 + i * 60;
    const grp = g(root);
    line(grp, x, 400, x, 450, { stroke: C.muted, sw: 2 });
    const lab = txt(grp, x, 388, n, { anchor: 'middle', size: 12, fill: C.muted });
    const boxEl = rect(grp, x - 26, 450, 52, 34, { rx: 6, fill: '#20242d', stroke: C.line });
    const val = txt(grp, x, 467, 'GND', { anchor: 'middle', size: 12.5, weight: 700, mono: true });
    const p = { v: 0, boxEl, val, lab, y };
    clickable(grp, () => { p.v ^= 1; });
    return p;
  });
  txt(root, 750, 510, 'click A2 / A1 / A0 to change the address', { anchor: 'middle', size: 12, fill: C.muted });
  const addrBits = txt(root, 750, 300, '', { anchor: 'middle', size: 17, mono: true, weight: 700 });
  const addrHex = txt(root, 750, 334, '', { anchor: 'middle', size: 22, weight: 800, fill: C.accent, mono: true });
  txt(root, 750, 268, '7-bit address', { anchor: 'middle', size: 12, fill: C.muted });
  const bubble = g(root);
  rect(bubble, -40, -14, 80, 28, { rx: 14, fill: '#3a2a08', stroke: C.accent });
  const bt = txt(bubble, 0, 0, '', { anchor: 'middle', size: 12.5, weight: 700, mono: true, fill: C.accent });
  return {
    tick(dt, t) {
      const a = (pins[0].v << 2) | (pins[1].v << 1) | pins[2].v;
      const addr = 0x48 | a;
      pins.forEach((p) => { p.val.textContent = p.v ? '3V3' : 'GND'; p.val.setAttribute('fill', p.v ? C.red : C.text); p.boxEl.setAttribute('stroke', p.v ? C.red : C.line); });
      addrBits.innerHTML = '';
      h(addrBits, 'tspan', { fill: C.muted }, '1001');
      h(addrBits, 'tspan', { fill: C.accent }, bin(a, 3));
      addrHex.textContent = hex(addr);
      const k = (t * 0.4) % 1;
      bubble.setAttribute('transform', `translate(${260 + k * 360},${ySDA + 34})`);
      bubble.setAttribute('opacity', k < 0.95 ? 1 : 0);
      bt.textContent = hex(addr);
      ctx.caption(`The sensor’s address is <code>1001</code> followed by the levels on its A2, A1 and A0 pins. On our board all three are tied to GND, so it answers to <b>0x48</b>. Changing them lets up to 8 of these sensors share one bus. Current address: <b>${hex(addr)}</b>.`);
    },
  };
}

export const I2C_MODULE = {
  id: 'i2c',
  title: 'I²C',
  subtitle: 'The two-wire bus for sensors and small chips',
  next: { id: 'mcu', label: 'Next module: Microcontroller' },
  steps: [
    {
      title: 'What is I²C?',
      body: `<p><b>I²C</b> (“I-squared-C”, Inter-Integrated Circuit) connects chips on the same board using just two wires:</p>
<ul><li><b style="color:${C.sda}">SDA</b> carries the data, in both directions.</li><li><b style="color:${C.scl}">SCL</b> carries the clock, generated by the controller.</li></ul>
<p>One <b>controller</b> (our STM32) talks to many <b>targets</b> (sensors, EEPROMs, displays). Each target has its own 7-bit <b>address</b>, and the controller starts every conversation by calling an address.</p>
<p class="muted small">Older documents say “master/slave”. The current spec uses controller/target.</p>`,
      scene: sceneOverview,
    },
    {
      title: 'Open-drain lines & pull-up resistors',
      body: `<p>I²C devices never drive a line <i>high</i>. They can only pull it <b>low</b> or let go (“open drain”). A <b>pull-up resistor</b> pulls each line back up to 3.3 V when nobody is pulling down.</p>
<p>That’s why two devices can never fight (one driving high while the other drives low), and why clock stretching and ACK work. The catch: the rising edge is only as fast as the resistor can charge the wiring’s capacitance.</p>
<p>Try different resistor values. Too big is too slow. Too small and the chips can’t pull the line low enough.</p>`,
      scene: sceneOpenDrain,
    },
    {
      title: 'START, STOP and the data rule',
      body: `<p>Three simple rules make I²C work:</p>
<ol><li><b>START</b>: SDA falls while SCL is high.</li><li><b>Data</b>: SDA only changes while SCL is low, and is read while SCL is high.</li><li><b>STOP</b>: SDA rises while SCL is high.</li></ol>
<p>Because data never changes while SCL is high, a START or STOP can never be confused with a data bit.</p>`,
      scene: sceneRules,
    },
    {
      title: 'A complete transaction',
      body: `<p>Here is a real conversation: the STM32 reads the temperature from the sensor U4 on our board.</p>
<ol><li>START, then the address with the <b>write</b> bit, to pick which register to read</li><li>Repeated START, then the address with the <b>read</b> bit</li><li>The sensor sends two data bytes</li><li>The STM32 NACKs the last byte and sends STOP</li></ol>
<p>Every byte is 8 bits, MSB first, followed by an ACK bit from whoever is receiving.</p>`,
      scene: sceneTransaction,
    },
    {
      title: 'ACK and NACK',
      body: `<p>After every byte, the receiver has to confirm it during a 9th clock pulse:</p>
<ul><li><b>ACK</b> (SDA pulled low): “received, keep going”</li><li><b>NACK</b> (SDA left high): “no one’s here”, “I can’t accept that”, or, from the controller while reading, “that was the last byte”</li></ul>
<p>Try calling an address that doesn’t exist.</p>`,
      scene: sceneAck,
    },
    {
      title: 'Clock stretching & speed',
      body: `<p>Because SCL is open-drain too, a target that needs more time can <b>hold SCL low</b> to pause the controller. This is called clock stretching.</p>
<p>I²C is meant for short connections on one board. The total bus capacitance is limited to <b>400 pF</b>, which is roughly a few tens of centimetres of wiring. For anything leaving the board, use CAN or another robust bus.</p>`,
      scene: sceneStretch,
    },
    {
      title: 'I²C on our board',
      body: `<p>The STM32F042’s <b>I2C1</b> peripheral uses <b>PB6 (SCL)</b> and <b>PB7 (SDA)</b>. R7 and R8 (4.7 kΩ) are the pull-ups, and U4 is an LM75-style temperature sensor at address <b>0x48</b>.</p>
<p>Reading it with ST’s HAL library (note that HAL wants the address shifted left by one):</p>
<pre><code>uint8_t buf[2];
HAL_I2C_Mem_Read(&amp;hi2c1, 0x48 &lt;&lt; 1, 0x00,
                 I2C_MEMADD_SIZE_8BIT, buf, 2, 100);
int16_t raw = (int16_t)((buf[0] &lt;&lt; 8) | buf[1]) &gt;&gt; 7;
float tempC = raw * 0.5f;   // 0.5 °C per bit</code></pre>
<p><b>Layout tips:</b> keep the bus short, put the pull-ups near the controller, give every sensor its own decoupling cap (C4 here), and add test points on SDA/SCL so you can clip on a logic analyzer.</p>`,
      scene: sceneBoard,
      board: { terms: ['i2c'], label: 'See the I²C circuit on the 3D board' },
    },
  ],
};
