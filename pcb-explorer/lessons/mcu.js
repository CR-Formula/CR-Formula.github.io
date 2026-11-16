// Microcontroller lesson module: the STM32F042K6.
// Pinout and peripheral facts follow ST's STM32F042x4/x6 datasheet (DS10152) — check it before a real design.
import { C, h, g, txt, rect, line, path, circle, chip, resistor, clamp, lerp, hex, clickable, along, polyD } from './svg.js';
import { U1_PINS } from '../board.js';

// ---------------------------------------------------------------- pin data
const PIN_INFO = {
  1: ['power', 'Main digital supply (2.0–3.6 V). Needs a 100 nF decoupling cap right at the pin.', 'C1 decouples it; connected to the 3V3 plane.'],
  2: ['clock', 'PF0 · OSC_IN: crystal input for the external high-speed oscillator (HSE). Can also be a GPIO.', 'Y1 (8 MHz) + load cap C5.'],
  3: ['clock', 'PF1 · OSC_OUT: crystal output for HSE. Can also be a GPIO.', 'Y1 (8 MHz) + load cap C6.'],
  4: ['reset', 'NRST: active-low reset. Pull it low and the chip restarts.', 'Goes to pin 4 of the debug header J2, so the programmer can reset the chip.'],
  5: ['power', 'VDDA: analog supply for the ADC, internal oscillators and reset circuitry.', 'C2 decouples it.'],
  6: ['gpio', 'PA0: GPIO · ADC_IN0 · USART2_CTS · TIM2_CH1 · wake-up pin', 'Unused.'],
  7: ['gpio', 'PA1: GPIO · ADC_IN1 · USART2_RTS · TIM2_CH2', 'Unused.'],
  8: ['gpio', 'PA2: GPIO · ADC_IN2 · USART2_TX · TIM2_CH3', 'Unused (a good choice for a debug UART).'],
  9: ['gpio', 'PA3: GPIO · ADC_IN3 · USART2_RX · TIM2_CH4', 'Unused (a good choice for a debug UART).'],
  10: ['led', 'PA4: GPIO · ADC_IN4 · SPI1_NSS · USART2_CK', 'Drives the green LED D2 through R2.'],
  11: ['led', 'PA5: GPIO · ADC_IN5 · SPI1_SCK', 'Drives the red LED D1 through R1.'],
  12: ['gpio', 'PA6: GPIO · ADC_IN6 · SPI1_MISO · TIM3_CH1', 'Unused.'],
  13: ['gpio', 'PA7: GPIO · ADC_IN7 · SPI1_MOSI · TIM3_CH2', 'Unused.'],
  14: ['gpio', 'PB0: GPIO · ADC_IN8 · TIM3_CH3', 'Unused.'],
  15: ['gpio', 'PB1: GPIO · ADC_IN9 · TIM3_CH4', 'Unused.'],
  16: ['power', 'VSS: ground.', 'Via to the ground plane.'],
  17: ['power', 'VDDIO2: separate supply for some I/O pins (including the USB/CAN pins PA11/PA12).', 'C3 decouples it.'],
  18: ['gpio', 'PA8: GPIO · MCO (clock output) · TIM1_CH1', 'Unused.'],
  19: ['gpio', 'PA9: GPIO · USART1_TX · TIM1_CH2', 'Unused.'],
  20: ['gpio', 'PA10: GPIO · USART1_RX · TIM1_CH3', 'Unused.'],
  21: ['can', 'PA11: GPIO · CAN_RX · USB_DM · TIM1_CH4', 'CAN_RX from the transceiver U3. (So USB can’t be used.)'],
  22: ['can', 'PA12: GPIO · CAN_TX · USB_DP · TIM1_ETR', 'CAN_TX to the transceiver U3.'],
  23: ['swd', 'PA13: SWDIO, the debug data line (GPIO if debug is disabled).', 'To J2 pin 3.'],
  24: ['swd', 'PA14: SWCLK, the debug clock (GPIO if debug is disabled).', 'To J2 pin 2.'],
  25: ['gpio', 'PA15: GPIO · SPI1_NSS · USART2_RX', 'Unused.'],
  26: ['gpio', 'PB3: GPIO · SPI1_SCK · TIM2_CH2', 'Unused.'],
  27: ['gpio', 'PB4: GPIO · SPI1_MISO · TIM3_CH1', 'Unused.'],
  28: ['gpio', 'PB5: GPIO · SPI1_MOSI · TIM3_CH2', 'Unused.'],
  29: ['i2c', 'PB6: GPIO · I2C1_SCL · USART1_TX · TIM16_CH1N', 'I²C clock to the temperature sensor U4 (pull-up R7).'],
  30: ['i2c', 'PB7: GPIO · I2C1_SDA · USART1_RX · TIM17_CH1N', 'I²C data to U4 (pull-up R8).'],
  31: ['boot', 'BOOT0: chooses what runs after reset: 0 = your program in Flash, 1 = ST’s built-in bootloader.', 'Pulled down by R6, so it always boots your program.'],
  32: ['power', 'VSS: ground.', 'Blind via to the ground plane.'],
};
const PIN_COL = { power: C.red, clock: C.blue, reset: C.pink, boot: C.pink, gpio: C.dim, led: C.lime, can: C.accent, swd: C.purple, i2c: C.green };
const PIN_GROUP = { power: 'Power', clock: 'Clock', reset: 'Reset / boot', boot: 'Reset / boot', gpio: 'Unused GPIO', led: 'LEDs', can: 'CAN', swd: 'Debug (SWD)', i2c: 'I²C' };

// ---------------------------------------------------------------- scenes
function sceneBlock(ctx) {
  const root = ctx.svg;
  txt(root, 500, 30, 'STM32F042K6: a computer on one chip', { anchor: 'middle', size: 18, weight: 650 });
  rect(root, 30, 50, 940, 530, { rx: 18, fill: '#171a21', stroke: '#2e3442', sw: 2 });
  const B = {};
  const blk = (id, x, y, w, hh, t, s, col, info) => {
    const c = chip(root, x, y, w, hh, t, s, { stroke: col, fill: '#20242e', size: 15 });
    B[id] = { ...c, x, y, w, h: hh, col, info, t };
    clickable(c.g, () => { sel = id; });
    return B[id];
  };
  blk('cpu', 70, 80, 220, 110, 'Arm Cortex-M0', 'CPU core · up to 48 MHz', C.accent, 'The <b>CPU</b> fetches instructions from Flash and executes them one after another: maths, comparisons, reading and writing memory. The Cortex-M0 is a 32-bit core, Arm’s smallest and most power-efficient.');
  blk('nvic', 70, 205, 105, 60, 'NVIC', 'interrupts', C.pink, 'The <b>Nested Vectored Interrupt Controller</b> lets hardware events (a CAN message arrived, a timer expired, a pin changed) interrupt the CPU and run a handler function immediately.');
  blk('dbg', 185, 205, 105, 60, 'SWD', 'debug', C.purple, '<b>Serial Wire Debug</b>: two pins (SWDIO/SWCLK) let a programmer like the ST-LINK write Flash, pause the CPU, and inspect variables.');
  blk('flash', 340, 80, 180, 90, 'Flash 32 KB', 'your program', C.blue, '<b>Flash memory</b> holds your compiled program and constants. It keeps its contents with the power off, and it is written by the programmer over SWD (or by the bootloader).');
  blk('sram', 540, 80, 180, 90, 'SRAM 6 KB', 'variables & stack', C.green, '<b>SRAM</b> is the working memory: variables, the stack and buffers. It is fast, but it is lost when power is removed. 6 KB is small, so watch out for big arrays!');
  blk('dma', 740, 80, 180, 90, 'DMA', 'copies data for you', C.muted, '<b>Direct Memory Access</b> moves data between peripherals and memory without the CPU, e.g. filling a buffer from the ADC in the background.');
  rect(root, 70, 295, 850, 34, { rx: 8, fill: '#2a2f3b', stroke: C.line });
  txt(root, 495, 312, 'Bus matrix  ·  AHB  ·  APB bridge', { anchor: 'middle', size: 13, weight: 650, fill: C.muted });
  blk('rcc', 70, 360, 150, 70, 'RCC', 'clocks & reset', C.blue, '<b>Reset & Clock Control</b>: picks the clock source (internal RC, crystal, PLL) and turns each peripheral’s clock on or off. Peripherals do nothing until you enable their clock!');
  blk('gpio', 240, 360, 150, 70, 'GPIO A/B/F', 'pins', C.lime, '<b>General-purpose I/O</b>: each pin can be an input, an output, an analog input, or handed to a peripheral (alternate function).');
  const per = [
    ['can', 'bxCAN', 'CAN 2.0B', C.accent, '<b>bxCAN</b>: the CAN controller. It builds and checks frames, arbitrates, filters incoming IDs and counts errors. It needs an external transceiver (U3 on our board).'],
    ['i2c', 'I²C', 'I2C1', C.green, 'The <b>I²C</b> peripheral generates START/STOP, clocks bytes out and in, and checks ACKs (up to 1 MHz).'],
    ['usart', 'USART ×2', 'serial', C.muted, '<b>USART</b>: classic serial ports (UART). Great for printing debug messages to a PC through a USB-serial adapter.'],
    ['spi', 'SPI', 'fast serial', C.muted, '<b>SPI</b>: a fast 4-wire bus for displays, SD cards, ADCs…'],
    ['usb', 'USB FS', 'crystal-less', C.muted, '<b>USB 2.0 Full-Speed</b> device. The F042 can run USB without a crystal using its HSI48 oscillator. On our board its pins are used for CAN instead.'],
    ['adc', 'ADC', '12-bit', C.muted, 'The <b>analog-to-digital converter</b> measures voltages (e.g. a sensor output) as a number from 0 to 4095.'],
    ['tim', 'Timers', 'PWM · capture', C.muted, '<b>Timers</b> count clock ticks: generate PWM for motors and LEDs, measure pulse widths, or trigger periodic interrupts.'],
  ];
  per.forEach(([id, t, s, col, info], i) => blk(id, 410 + (i % 4) * 128, 360 + Math.floor(i / 4) * 90, 118, 70, t, s, col, info));
  txt(root, 495, 560, 'Click any block to learn what it does', { anchor: 'middle', size: 12.5, fill: C.muted });
  // traffic paths
  const routes = [
    { pts: [[400, 170], [400, 230], [230, 230], [230, 190]], col: C.blue, speed: 1.0, label: 'instruction fetch' },
    { pts: [[180, 190], [180, 312], [630, 312], [630, 170]], col: C.green, speed: 0.7 },
    { pts: [[260, 190], [260, 312], [315, 312], [315, 360]], col: C.lime, speed: 0.45 },
    { pts: [[470, 360], [470, 312], [122, 312], [122, 265]], col: C.pink, speed: 0.3 },
  ];
  routes.forEach((r) => { path(root, polyD(r.pts), { stroke: r.col, sw: 1.5, opacity: 0.25, dash: '4 4' }); r.dot = circle(root, 0, 0, 6, { fill: r.col }); });
  let sel = 'cpu';
  return {
    tick(dt, t) {
      routes.forEach((r) => {
        const k = (t * r.speed) % 1;
        const [x, y] = along(r.pts, k);
        r.dot.setAttribute('cx', x); r.dot.setAttribute('cy', y);
      });
      Object.entries(B).forEach(([id, b]) => { b.box.setAttribute('stroke-width', id === sel ? 3.5 : 1.5); b.box.setAttribute('fill', id === sel ? '#2a2f3c' : '#20242e'); });
      ctx.caption(`<b>${B[sel].t}</b>: ${B[sel].info} <span class="muted">Moving dots: <span style="color:${C.blue}">instructions from Flash</span>, <span style="color:${C.green}">data to/from SRAM</span>, <span style="color:${C.lime}">GPIO writes</span>, <span style="color:${C.pink}">a CAN interrupt</span>.</span>`);
    },
  };
}

function scenePinout(ctx) {
  const root = ctx.svg;
  const groups = ['all', 'power', 'clock', 'reset', 'can', 'i2c', 'swd', 'led', 'gpio'];
  ctx.controls.innerHTML = `<div class="presets">${groups.map((k) => `<button class="chip" data-f="${k}">${k === 'all' ? 'All pins' : PIN_GROUP[k]}</button>`).join('')}</div>`;
  let filter = 'all', sel = 21;
  ctx.controls.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) filter = b.dataset.f; });
  const S = 260, CX = 390, CY = 315;
  rect(root, CX - S / 2, CY - S / 2, S, S, { rx: 10, fill: '#22252c', stroke: '#3c4250', sw: 2 });
  circle(root, CX - S / 2 + 24, CY - S / 2 + 24, 9, { fill: '#2f333c' });
  txt(root, CX, CY - 20, 'STM32F042K6', { anchor: 'middle', size: 19, weight: 700 });
  txt(root, CX, CY + 10, 'LQFP-32 · top view', { anchor: 'middle', size: 13, fill: C.muted });
  txt(root, CX, CY + 34, 'pin 1 = dot', { anchor: 'middle', size: 12, fill: C.dim });
  const pins = [];
  for (let n = 1; n <= 32; n++) {
    const k = (n - 1) % 8, side = Math.floor((n - 1) / 8), o = (-3.5 + k) * 30;
    let px, py, lx, ly, anchor, rot = 0, w = 26, hh = 14;
    if (side === 0) { px = CX - S / 2 - 26; py = CY + o; lx = px - 8; ly = py; anchor = 'end'; }
    else if (side === 1) { px = CX + o - 7; py = CY + S / 2; lx = px + 7; ly = py + 32; anchor = 'end'; rot = -90; w = 14; hh = 26; }
    else if (side === 2) { px = CX + S / 2; py = CY - o; lx = px + 34; ly = py; anchor = 'start'; }
    else { px = CX - o - 7; py = CY - S / 2 - 26; lx = px + 7; ly = py - 6; anchor = 'start'; rot = -90; w = 14; hh = 26; }
    const pyy = side === 0 || side === 2 ? py - 7 : py;
    const [kind] = PIN_INFO[n];
    const grp = g(root);
    const r = rect(grp, px, pyy, w, hh, { rx: 2, fill: PIN_COL[kind], stroke: 'none' });
    const num = txt(grp, side % 2 === 0 ? (side === 0 ? px + 13 : px + 13) : px + 7, side % 2 === 0 ? py : pyy + 13, String(n), { anchor: 'middle', size: 9, weight: 700, fill: '#0f1115' });
    const lab = txt(grp, lx, ly, U1_PINS[n].replace(' / ', '/'), { anchor, size: 12, fill: C.muted });
    if (rot) lab.setAttribute('transform', `rotate(${rot} ${lx} ${ly})`);
    clickable(grp, () => { sel = n; });
    pins.push({ n, r, lab, kind, num });
  }
  // legend
  const lg = g(root);
  Object.entries({ power: 'Power', clock: 'Clock', reset: 'Reset/boot', can: 'CAN', i2c: 'I²C', swd: 'Debug', led: 'LEDs', gpio: 'Unused' }).forEach(([k, l], i) => {
    rect(lg, 740, 60 + i * 26, 16, 16, { rx: 3, fill: PIN_COL[k], stroke: 'none' });
    txt(lg, 764, 68 + i * 26, l, { size: 13, fill: C.muted });
  });
  const card = g(root);
  return {
    tick(dt, t) {
      pins.forEach((p) => {
        const match = filter === 'all' || p.kind === filter || (filter === 'reset' && p.kind === 'boot');
        const isSel = p.n === sel;
        p.r.setAttribute('opacity', match ? 1 : 0.18);
        p.lab.setAttribute('opacity', match ? 1 : 0.25);
        p.lab.setAttribute('fill', isSel ? C.text : C.muted);
        p.lab.setAttribute('font-weight', isSel ? 700 : 400);
        p.r.setAttribute('stroke', isSel ? '#fff' : 'none');
        p.r.setAttribute('stroke-width', isSel ? 2 + Math.sin(t * 6) : 0);
      });
      while (card.firstChild) card.firstChild.remove();
      const [kind, desc, board] = PIN_INFO[sel];
      rect(card, 690, 300, 290, 270, { fill: C.panel, stroke: PIN_COL[kind], rx: 12 });
      txt(card, 710, 328, `Pin ${sel} · ${U1_PINS[sel]}`, { size: 15, weight: 700, fill: PIN_COL[kind] === C.dim ? C.text : PIN_COL[kind] });
      const fo = h(card, 'foreignObject', { x: 708, y: 345, width: 258, height: 220 });
      const div = document.createElement('div');
      div.className = 'svg-html small';
      div.innerHTML = `<p>${desc}</p><p><b>On our board:</b> ${board}</p>`;
      fo.appendChild(div);
      ctx.caption('Click any pin. Most pins can do several jobs (<b>alternate functions</b>); you choose one per pin in your firmware. Planning this in STM32CubeMX before drawing the schematic avoids nasty surprises, like CAN and USB both needing PA11/PA12.');
    },
  };
}

function scenePower(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `<label class="toggle"><input type="checkbox" data-k="cap" checked><span class="state">100 nF decoupling cap fitted next to the pin</span></label>`;
  let cap = true;
  ctx.controls.querySelector('input').addEventListener('change', (e) => { cap = e.target.checked; });
  txt(root, 500, 34, 'Why every power pin gets its own capacitor', { anchor: 'middle', size: 18, weight: 650 });
  chip(root, 40, 120, 130, 90, 'Regulator', '3.3 V (U2)');
  // long trace with inductance
  line(root, 170, 165, 300, 165, { stroke: C.copper, sw: 4 });
  path(root, 'M300,165 q10,-22 20,0 q10,-22 20,0 q10,-22 20,0 q10,-22 20,0', { stroke: C.copper, sw: 3 });
  line(root, 380, 165, 520, 165, { stroke: C.copper, sw: 4 });
  txt(root, 340, 130, 'trace / via inductance', { anchor: 'middle', size: 12.5, fill: C.muted });
  const mcu = chip(root, 560, 105, 200, 130, 'STM32', 'VDD pin');
  void mcu;
  const capG = g(root);
  line(capG, 500, 165, 500, 230, { stroke: C.copper, sw: 3 });
  line(capG, 480, 232, 520, 232, { stroke: C.text, sw: 3 }); line(capG, 480, 244, 520, 244, { stroke: C.text, sw: 3 });
  line(capG, 500, 246, 500, 290, { stroke: C.copper, sw: 3 });
  txt(capG, 530, 240, '100 nF', { size: 12.5, fill: C.muted });
  line(root, 470, 290, 530, 290, { stroke: C.muted }); line(root, 480, 297, 520, 297, { stroke: C.muted });
  const spikes = txt(root, 660, 270, '', { anchor: 'middle', size: 13, weight: 650, fill: C.accent });
  const dotsCap = Array.from({ length: 4 }, () => circle(root, 0, 0, 4.5, { fill: C.green, opacity: 0 }));
  const dotsFar = Array.from({ length: 4 }, () => circle(root, 0, 0, 4.5, { fill: C.red, opacity: 0 }));
  // plot
  const PX0 = 100, PX1 = 940, PY = (v) => 470 - (v - 3.3) * 380;
  rect(root, PX0 - 20, 330, PX1 - PX0 + 40, 240, { fill: '#12151b', stroke: C.line });
  txt(root, PX0, 350, 'Voltage at the VDD pin', { size: 13.5, weight: 650, fill: C.muted });
  [3.3, 3.1, 3.0].forEach((v) => { line(root, PX0, PY(v), PX1, PY(v), { stroke: C.grid, sw: 1 }); txt(root, PX0 - 6, PY(v), `${v.toFixed(1)} V`, { anchor: 'end', size: 11, fill: C.dim }); });
  const trace = path(root, '', { stroke: C.green, sw: 2.2 });
  const hist = [];
  let tt = 0, v = 3.3, dv = 0;
  return {
    tick(dt) {
      tt += dt;
      // current spikes on "clock edges": bursts every 0.25 s
      const phase = tt % 0.5;
      const spike = phase < 0.05 ? 1 : 0;
      spikes.textContent = spike ? 'CPU switching: current spike!' : '';
      capG.setAttribute('opacity', cap ? 1 : 0.15);
      // tiny 2nd-order model: dip and ring when no cap
      const steps = 6;
      for (let s = 0; s < steps; s++) {
        const h2 = dt / steps;
        const target = 3.3 - (spike ? (cap ? 0.025 : 0.32) : 0);
        const k = cap ? 400 : 90, damp = cap ? 40 : 3.5;
        const acc = k * (target - v) - damp * dv;
        dv += acc * h2; v += dv * h2;
      }
      hist.push(v);
      while (hist.length > 360) hist.shift();
      let d = '';
      hist.forEach((vv, i) => { d += `${i ? 'L' : 'M'}${PX0 + (i / 360) * (PX1 - PX0)},${PY(clamp(vv, 2.9, 3.45))}`; });
      trace.setAttribute('d', d);
      trace.setAttribute('stroke', cap ? C.green : C.red);
      const show = phase < 0.15;
      dotsCap.forEach((dd, i) => {
        const k = ((tt * 4 + i / 4) % 1);
        dd.setAttribute('cx', 500 + k * 60); dd.setAttribute('cy', lerp(200, 165, Math.min(1, k * 3)));
        dd.setAttribute('opacity', cap && show ? 0.9 : 0);
      });
      dotsFar.forEach((dd, i) => {
        const k = ((tt * 1.5 + i / 4) % 1);
        dd.setAttribute('cx', 175 + k * 380); dd.setAttribute('cy', 165);
        dd.setAttribute('opacity', !cap && show ? 0.9 : 0);
      });
      ctx.caption(cap
        ? 'Each time the CPU switches, it draws a short burst of current. The <b>capacitor right next to the pin</b> supplies it instantly, so the voltage barely moves.'
        : 'Without the local capacitor, the current must come all the way from the regulator through the trace’s <b>inductance</b>, which resists fast changes. The voltage dips and rings. That can cause glitches, ADC errors and radio noise (EMI).');
    },
  };
}

function sceneClocks(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `
    <div class="calc">
      <label>System clock (SYSCLK) source<select data-k="sys"><option value="hsi">HSI · internal 8 MHz RC</option><option value="hse">HSE · 8 MHz crystal (Y1)</option><option value="pll" selected>PLL</option><option value="hsi48">HSI48 · internal 48 MHz RC</option></select></label>
      <div class="row">
        <label>PLL input<select data-k="psrc"><option value="hsi">HSI ÷ 2 = 4 MHz</option><option value="hse" selected>HSE = 8 MHz</option></select></label>
        <label>PLL multiplier<select data-k="mul">${Array.from({ length: 15 }, (_, i) => i + 2).map((m) => `<option ${m === 6 ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
      </div>
      <label>AHB prescaler (CPU clock)<select data-k="ahb"><option>1</option><option>2</option><option>4</option><option>8</option></select></label>
    </div>`;
  const q = (k) => ctx.controls.querySelector(`[data-k=${k}]`).value;
  txt(root, 500, 30, 'The clock tree: where the heartbeat comes from', { anchor: 'middle', size: 18, weight: 650 });
  const box = (x, y, w, hh, t, s, col) => chip(root, x, y, w, hh, t, s, { stroke: col, size: 14, subSize: 11.5 });
  const HSI = box(30, 70, 170, 64, 'HSI 8 MHz', 'internal RC, ±1 %', C.blue);
  const HSE = box(30, 170, 170, 64, 'HSE 8 MHz', 'crystal Y1, very accurate', C.blue);
  const H48 = box(30, 270, 170, 64, 'HSI48', 'internal 48 MHz (USB)', C.blue);
  box(30, 400, 170, 54, 'LSI 40 kHz', 'watchdog', C.dim);
  box(30, 470, 170, 54, 'LSE 32.768 kHz', 'RTC (not fitted)', C.dim);
  const PLL = box(300, 150, 150, 90, 'PLL', '× N', C.accent);
  const MUX = box(530, 150, 110, 150, 'SYSCLK', 'mux', C.text);
  const AHB = box(700, 150, 110, 64, 'AHB ÷', '', C.text);
  const CPU = box(860, 100, 120, 64, 'CPU', 'HCLK', C.accent);
  const APB = box(860, 230, 120, 64, 'APB', 'PCLK', C.green);
  box(860, 330, 120, 70, 'Peripherals', 'CAN · I²C · USART', C.green);
  const wires = {
    hsiPll: [[200, 102], [250, 102], [250, 180], [300, 180]],
    hsePll: [[200, 202], [250, 202], [250, 210], [300, 210]],
    hsiMux: [[200, 92], [500, 92], [500, 170], [530, 170]],
    hseMux: [[200, 190], [230, 190], [230, 260], [500, 260], [500, 235], [530, 235]],
    pllMux: [[450, 195], [530, 195]],
    h48Mux: [[200, 302], [500, 302], [500, 280], [530, 280]],
    muxAhb: [[640, 182], [700, 182]],
    ahbCpu: [[810, 170], [835, 170], [835, 132], [860, 132]],
    ahbApb: [[810, 195], [835, 195], [835, 262], [860, 262]],
    apbPer: [[920, 294], [920, 330]],
  };
  const W = {};
  Object.entries(wires).forEach(([k, pts]) => { W[k] = { pts, p: path(root, polyD(pts), { stroke: C.line, sw: 2.5 }), dots: [circle(root, 0, 0, 4, { fill: C.accent, opacity: 0 }), circle(root, 0, 0, 4, { fill: C.accent, opacity: 0 })] }; });
  const fLabel = (x, y) => txt(root, x, y, '', { anchor: 'middle', size: 13, weight: 700, mono: true, fill: C.accent });
  const fPll = fLabel(375, 262), fSys = fLabel(585, 322), fCpu = fLabel(920, 85), fPer = fLabel(920, 418);
  const warn = txt(root, 500, 560, '', { anchor: 'middle', size: 15, weight: 700, fill: C.red });
  void HSI; void HSE; void H48; void PLL; void MUX; void AHB; void CPU; void APB;
  return {
    tick(dt, t) {
      const sys = q('sys'), psrc = q('psrc'), mul = +q('mul'), ahb = +q('ahb');
      const pin = psrc === 'hsi' ? 4 : 8;
      const pll = pin * mul;
      const fs = { hsi: 8, hse: 8, pll, hsi48: 48 }[sys];
      const hclk = fs / ahb;
      const active = new Set(['muxAhb', 'ahbCpu', 'ahbApb', 'apbPer']);
      if (sys === 'hsi') active.add('hsiMux');
      if (sys === 'hse') active.add('hseMux');
      if (sys === 'hsi48') active.add('h48Mux');
      if (sys === 'pll') { active.add('pllMux'); active.add(psrc === 'hsi' ? 'hsiPll' : 'hsePll'); }
      const speed = 0.25 + (Math.log2(Math.max(1, hclk)) / 6) * 0.8;
      Object.entries(W).forEach(([k, w]) => {
        const on = active.has(k);
        w.p.setAttribute('stroke', on ? C.accent : C.line);
        w.p.setAttribute('opacity', on ? 1 : 0.4);
        w.dots.forEach((d, i) => {
          const [x, y] = along(w.pts, (t * speed + i / 2) % 1);
          d.setAttribute('cx', x); d.setAttribute('cy', y); d.setAttribute('opacity', on ? 0.95 : 0);
        });
      });
      fPll.textContent = sys === 'pll' ? `${pin} × ${mul} = ${pll} MHz` : '';
      fSys.textContent = `${fs} MHz`;
      fCpu.textContent = `${+hclk.toFixed(2)} MHz`;
      fPer.textContent = `${+hclk.toFixed(2)} MHz`;
      const tooFast = fs > 48;
      warn.textContent = tooFast ? `✗ ${fs} MHz is over the STM32F042’s 48 MHz limit: the chip may crash.` : '';
      [fSys, fCpu].forEach((e) => e.setAttribute('fill', tooFast ? C.red : C.accent));
      ctx.caption(sys === 'hsi'
        ? 'After reset the chip runs from <b>HSI</b>, an internal 8 MHz RC oscillator. It’s convenient but only accurate to about 1 %, which is fine for blinking LEDs but marginal for CAN.'
        : sys === 'hse' ? 'The external crystal (<b>HSE</b>) is accurate to a few ppm. Use it whenever timing matters, e.g. for CAN bit timing.'
          : sys === 'hsi48' ? '<b>HSI48</b> is an internal 48 MHz oscillator meant for USB (it can trim itself using USB traffic). It can also clock the whole chip.'
            : `The <b>PLL</b> multiplies a slow, clean clock up to a fast one: ${pin} MHz × ${mul} = ${pll} MHz. Our board uses HSE 8 MHz × 6 = <b>48 MHz</b>, the F042’s maximum. CubeMX’s clock-tree tab does this maths for you.`);
    },
  };
}

function sceneBoot(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `<label class="toggle"><input type="checkbox" data-k="b0"><span class="state">Hold BOOT0 high (e.g. a jumper to 3.3 V)</span></label>`;
  let boot0 = false;
  ctx.controls.querySelector('input').addEventListener('change', (e) => { boot0 = e.target.checked; tt = 0; });
  txt(root, 500, 30, 'What happens in the first millisecond after power-on', { anchor: 'middle', size: 18, weight: 650 });
  // timeline steps
  const steps = [
    ['Power rises', 'VDD climbs from 0 to 3.3 V.'],
    ['Reset released', 'The internal power-on reset holds the chip in reset until VDD is high enough, then lets go (NRST goes high).'],
    ['BOOT0 sampled', 'The chip checks the BOOT0 pin to decide what memory to start from.'],
    ['Load stack pointer', 'The CPU reads the first word of the vector table: the initial stack pointer (top of SRAM).'],
    ['Load reset vector', 'It reads the second word: the address of Reset_Handler, and jumps there.'],
    ['Startup code', 'Reset_Handler copies initialised variables (.data) to SRAM, zeroes the rest (.bss), and calls SystemInit().'],
    ['main()', 'Finally, your main() function runs.'],
  ];
  const list = steps.map(([t], i) => {
    const y = 80 + i * 66;
    const c = circle(root, 60, y, 13, { fill: '#20242d', stroke: C.line, sw: 2 });
    const n = txt(root, 60, y, String(i + 1), { anchor: 'middle', size: 12, weight: 700, fill: C.muted });
    const l = txt(root, 86, y, t, { size: 15, weight: 650, fill: C.muted });
    if (i < steps.length - 1) line(root, 60, y + 14, 60, y + 52, { stroke: C.line, sw: 2 });
    return { c, n, l };
  });
  // VDD mini graph
  const vg = path(root, '', { stroke: C.red, sw: 2.5 });
  txt(root, 260, 70, 'VDD', { size: 12, fill: C.red });
  // memory map
  const MX = 560, MW = 360;
  txt(root, MX + MW / 2, 60, 'Memory map', { anchor: 'middle', size: 14, weight: 650, fill: C.muted });
  const regions = [
    ['0x4000 0000', 'Peripherals', 'registers for GPIO, CAN, I²C…', C.muted, 90],
    ['0x2000 0000', 'SRAM · 6 KB', 'variables, stack', C.green, 165],
    ['0x1FFF C400', 'System memory', 'ST’s built-in bootloader', C.purple, 240],
    ['0x0800 0000', 'Flash · 32 KB', 'vector table + your program', C.blue, 315],
    ['0x0000 0000', 'Boot alias', 'mirrors Flash or system memory', C.accent, 470],
  ];
  const R = {};
  regions.forEach(([addr, n, s, col, y]) => {
    const hh = y === 315 ? 120 : 60;
    R[n] = rect(root, MX, y, MW, hh, { fill: '#1f232c', stroke: col, rx: 8 });
    txt(root, MX + 14, y + 20, n, { size: 14, weight: 650, fill: col });
    txt(root, MX + 14, y + 40, s, { size: 12, fill: C.muted });
    txt(root, MX - 10, y + hh - 6, addr, { anchor: 'end', size: 11, mono: true, fill: C.dim });
  });
  // vector table rows inside flash
  const vt = [['+0x00', 'initial SP = 0x2000 1800'], ['+0x04', 'Reset_Handler = 0x0800 00C1']];
  vt.forEach(([o, v], i) => { rect(root, MX + 14, 365 + i * 30, MW - 28, 26, { rx: 4, fill: '#16233a', stroke: '#2a4a73' }); txt(root, MX + 24, 378 + i * 30, `${o}  ${v}`, { size: 12, mono: true, fill: C.blue }); });
  const arrow = path(root, '', { stroke: C.accent, sw: 3 });
  const aHead = circle(root, 0, 0, 6, { fill: C.accent, opacity: 0 });
  let tt = 0;
  return {
    tick(dt) {
      tt += dt * 0.7;
      const N = steps.length;
      const cur = Math.min(N - 1, Math.floor(tt));
      if (tt > N + 1.5) tt = 0;
      list.forEach((s, i) => {
        const on = i <= cur;
        s.c.setAttribute('fill', on ? (i === cur ? C.accent : '#3a2a08') : '#20242d');
        s.c.setAttribute('stroke', on ? C.accent : C.line);
        s.n.setAttribute('fill', on ? (i === cur ? '#1a1405' : C.accent) : C.muted);
        s.l.setAttribute('fill', on ? C.text : C.muted);
      });
      // vdd graph
      let d = '';
      for (let i = 0; i <= 60; i++) {
        const x = 260 + i * 4, k = Math.min(1, (Math.min(tt, 1) * 60) / Math.max(i, 1));
        const v = i / 60 < Math.min(tt, 1) ? 1 - Math.exp(-(i / 60) * 5) : NaN;
        void k;
        if (!isNaN(v)) d += `${d ? 'L' : 'M'}${x},${110 - v * 30}`;
      }
      vg.setAttribute('d', d);
      // memory arrows
      const target = boot0 ? 'System memory' : 'Flash · 32 KB';
      Object.entries(R).forEach(([n, r]) => r.setAttribute('stroke-width', (cur >= 2 && n === target) || (cur >= 5 && n === 'SRAM · 6 KB' && !boot0) ? 3.5 : 1.5));
      let pts = null;
      if (cur === 2) pts = [[MX + MW + 20, 500], [MX + MW + 40, 500], [MX + MW + 40, boot0 ? 270 : 375], [MX + MW, boot0 ? 270 : 375]];
      if (cur === 3 && !boot0) pts = [[MX + MW - 20, 378], [MX + MW + 30, 378], [MX + MW + 30, 195], [MX + MW, 195]];
      if (cur === 4 && !boot0) pts = [[MX + MW - 20, 408], [MX + MW + 30, 408], [MX + MW + 30, 425], [MX + MW, 425]];
      if (pts) { arrow.setAttribute('d', polyD(pts)); const [x, y] = along(pts, (tt % 1)); aHead.setAttribute('cx', x); aHead.setAttribute('cy', y); aHead.setAttribute('opacity', 1); arrow.setAttribute('opacity', 0.8); }
      else { arrow.setAttribute('opacity', 0); aHead.setAttribute('opacity', 0); }
      let cap = steps[cur][1];
      if (cur >= 2 && boot0) cap = cur === 2 ? 'BOOT0 is <b>high</b>, so address 0 now mirrors <b>system memory</b>: ST’s factory bootloader starts instead of your program. You can use it to load firmware over USB (DFU) or a serial port with no programmer. Useful for recovery, but you don’t want it to happen by accident!' : 'The bootloader is running and waiting for commands. Your program does <b>not</b> run until BOOT0 is low again and the chip is reset.';
      if (cur === 2 && !boot0) cap = 'BOOT0 is <b>low</b> (pulled down by R6), so address 0 mirrors <b>main Flash</b>: your program will run.';
      ctx.caption(cap);
    },
  };
}

function sceneExecute(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `<button class="btn" data-k="step">Step one clock cycle</button> <span class="small muted">(pause first with the ❚❚ button)</span>`;
  const prog = [
    { a: 0x0100, asm: 'LDR  r0, =0x48000014', c: 'r0 = address of GPIOA->ODR', run: (s) => { s.r0 = 0x48000014; } },
    { a: 0x0102, asm: 'LDR  r1, [r0]', c: 'r1 = current ODR value', run: (s) => { s.r1 = s.odr; } },
    { a: 0x0104, asm: 'MOVS r2, #0x10', c: 'r2 = bit 4 mask (PA4)', run: (s) => { s.r2 = 0x10; } },
    { a: 0x0106, asm: 'EORS r1, r2', c: 'flip bit 4', run: (s) => { s.r1 ^= s.r2; } },
    { a: 0x0108, asm: 'STR  r1, [r0]', c: 'write ODR → LED changes!', run: (s) => { s.odr = s.r1; } },
    { a: 0x010A, asm: 'BL   delay', c: 'wait about 0.5 s', run: () => {}, branch: true },
    { a: 0x010E, asm: 'B    loop', c: 'back to the top', run: () => {}, branch: true, to: 0 },
  ];
  txt(root, 40, 40, 'C:  while (1) { GPIOA->ODR ^= (1 << 4);  delay(); }', { size: 14, mono: true, fill: C.muted });
  txt(root, 40, 72, 'compiles to these Thumb instructions:', { size: 13, fill: C.dim });
  const rows = prog.map((p, i) => {
    const y = 105 + i * 38;
    const bg = rect(root, 30, y - 16, 590, 32, { rx: 6, fill: 'transparent', stroke: 'none' });
    const tag = txt(root, 40, y, '', { size: 10.5, weight: 700 });
    txt(root, 112, y, `…${p.a.toString(16).toUpperCase().padStart(4, '0')}`, { size: 12, mono: true, fill: C.dim });
    txt(root, 170, y, p.asm, { size: 14, mono: true, weight: 600 });
    txt(root, 400, y, `; ${p.c}`, { size: 12, fill: C.muted });
    return { bg, tag };
  });
  // pipeline
  txt(root, 40, 400, '3-stage pipeline', { size: 14, weight: 650, fill: C.muted });
  const stages = ['Fetch', 'Decode', 'Execute'].map((n, i) => {
    const x = 40 + i * 190;
    const c = chip(root, x, 415, 175, 70, n, '', { size: 14 });
    const s = txt(root, x + 87, 467, '', { anchor: 'middle', size: 12.5, mono: true, fill: C.accent });
    return { c, s };
  });
  // registers
  txt(root, 650, 105, 'Registers', { size: 14, weight: 650, fill: C.muted });
  const regs = ['r0', 'r1', 'r2', 'pc'].map((r, i) => {
    rect(root, 650, 120 + i * 44, 300, 36, { rx: 6, fill: '#1f232c', stroke: C.line });
    txt(root, 665, 138 + i * 44, r.toUpperCase(), { size: 13, weight: 700, fill: C.muted, mono: true });
    return txt(root, 935, 138 + i * 44, '', { anchor: 'end', size: 14, mono: true });
  });
  // ODR + LED
  txt(root, 650, 320, 'GPIOA->ODR (output data register)', { size: 13, fill: C.muted });
  const odrBits = Array.from({ length: 8 }, (_, i) => {
    const x = 650 + i * 37;
    rect(root, x, 335, 33, 34, { rx: 4, fill: '#1f232c', stroke: C.line });
    txt(root, x + 16, 382, String(7 - i), { anchor: 'middle', size: 10, fill: C.dim });
    return txt(root, x + 16, 352, '0', { anchor: 'middle', size: 14, mono: true });
  });
  const led = circle(root, 760, 470, 26, { fill: '#123020', stroke: C.green, sw: 2 });
  const glow = circle(root, 760, 470, 44, { fill: C.green, opacity: 0 });
  txt(root, 800, 465, 'D2 on PA4', { size: 13, weight: 650 });
  txt(root, 800, 485, '(green LED)', { size: 12, fill: C.muted });
  const s = { r0: 0, r1: 0, r2: 0, odr: 0, pc: 0, cyc: 0, flush: 0, delay: 0 };
  let acc = 0;
  const step = () => {
    if (s.delay > 0) { s.delay--; return; }
    const ex = s.pc;
    const p = prog[ex];
    if (s.flush > 0) { s.flush--; s.exec = null; return; }
    p.run(s);
    s.exec = ex;
    if (p.branch) {
      s.flush = 2; // pipeline refills after a branch
      if (p.asm.startsWith('BL')) { s.delay = 3; s.pc = ex + 1; } else s.pc = p.to;
    } else s.pc = ex + 1;
  };
  ctx.controls.querySelector('[data-k=step]').addEventListener('click', step);
  return {
    tick(dt) {
      acc += dt;
      if (acc > 0.9) { acc = 0; step(); }
      const ex = s.exec;
      rows.forEach((r, i) => {
        const isEx = i === ex, isDe = s.flush === 0 && i === s.pc, isFe = s.flush === 0 && i === (s.pc + 1) % prog.length;
        r.bg.setAttribute('fill', isEx ? 'rgba(255,176,32,0.18)' : 'transparent');
        r.tag.textContent = isEx ? 'EXECUTE' : isDe ? 'decode' : isFe ? 'fetch' : '';
        r.tag.setAttribute('fill', isEx ? C.accent : C.muted);
      });
      stages[2].s.textContent = s.delay > 0 ? 'in delay()…' : ex != null ? prog[ex].asm.split(/\s+/)[0] : s.flush ? '(refilling)' : '';
      stages[1].s.textContent = s.flush ? '(flushed)' : prog[s.pc].asm.split(/\s+/)[0];
      stages[0].s.textContent = s.flush ? '(flushed)' : prog[(s.pc + 1) % prog.length].asm.split(/\s+/)[0];
      regs[0].textContent = hex(s.r0, 8); regs[1].textContent = hex(s.r1, 8); regs[2].textContent = hex(s.r2, 8);
      regs[3].textContent = '0x0800' + prog[s.pc].a.toString(16).toUpperCase().padStart(4, '0');
      odrBits.forEach((b, i) => { const bit = (s.odr >> (7 - i)) & 1; b.textContent = String(bit); b.setAttribute('fill', bit ? C.green : C.muted); b.setAttribute('font-weight', 7 - i === 4 ? 800 : 400); });
      const on = (s.odr >> 4) & 1;
      led.setAttribute('fill', on ? C.green : '#123020');
      glow.setAttribute('opacity', on ? 0.25 : 0);
      ctx.caption(s.delay > 0 ? 'Inside <code>delay()</code>: the CPU is busy counting down. (A timer interrupt would be a better way to wait.)'
        : s.flush ? 'A <b>branch</b> changes the program counter, so the instructions already fetched behind it are thrown away and the pipeline refills. Branches cost extra cycles.'
          : 'The Cortex-M0 works on three instructions at once: while one <b>executes</b>, the next is being <b>decoded</b> and the one after is being <b>fetched</b> from Flash. Watch bit 4 of ODR: when STR writes it, the LED pin changes.');
    },
  };
}

function sceneGpio(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `
    <div class="calc">
      <label>MODER: pin mode<select data-k="mode"><option value="out" selected>01 · General-purpose output</option><option value="in">00 · Input</option><option value="af">10 · Alternate function</option><option value="an">11 · Analog</option></select></label>
      <div class="row">
        <label>OTYPER: output type<select data-k="ot"><option value="pp">Push-pull</option><option value="od">Open-drain</option></select></label>
        <label>PUPDR: pull resistor<select data-k="pu"><option value="none">None</option><option value="up">Pull-up</option><option value="down">Pull-down</option></select></label>
      </div>
      <div class="row">
        <label class="toggle" style="margin:0"><input type="checkbox" data-k="odr" checked><span class="state">ODR bit 4 = 1</span></label>
        <label class="toggle" style="margin:0"><input type="checkbox" data-k="btn"><span class="state">External button pressed</span></label>
      </div>
    </div>`;
  const q = (k) => ctx.controls.querySelector(`[data-k=${k}]`);
  txt(root, 500, 30, 'Inside one GPIO pin: PA4', { anchor: 'middle', size: 18, weight: 650 });
  // registers panel
  const regsT = g(root);
  // pin circuit
  rect(root, 330, 70, 330, 420, { rx: 14, fill: '#171a21', stroke: '#2e3442' });
  txt(root, 345, 90, 'inside the STM32', { size: 12, fill: C.dim });
  line(root, 400, 110, 600, 110, { stroke: C.red, sw: 2 }); txt(root, 610, 110, 'VDD', { size: 12, fill: C.red });
  line(root, 400, 450, 600, 450, { stroke: C.muted, sw: 2 }); txt(root, 610, 450, 'VSS', { size: 12, fill: C.muted });
  const pmos = chip(root, 420, 150, 110, 50, 'P-MOS', 'drives high', { size: 13, subSize: 10.5 });
  const nmos = chip(root, 420, 360, 110, 50, 'N-MOS', 'drives low', { size: 13, subSize: 10.5 });
  line(root, 475, 110, 475, 150, { stroke: C.line }); line(root, 475, 410, 475, 450, { stroke: C.line });
  line(root, 475, 200, 475, 360, { stroke: C.line, sw: 2 });
  const padLine = line(root, 475, 280, 680, 280, { stroke: C.line, sw: 3 });
  const pu = resistor(root, 580, 110, 230, 'pull-up');
  const pd = resistor(root, 560, 330, 450, 'pull-down');
  line(root, 560, 280, 560, 330, { stroke: C.line }); line(root, 580, 230, 580, 280, { stroke: C.line });
  const inBuf = chip(root, 350, 255, 90, 50, 'Input', '→ IDR', { size: 12.5, subSize: 10.5 });
  void inBuf;
  rect(root, 668, 266, 28, 28, { rx: 4, fill: '#c9ccd1', stroke: 'none' });
  txt(root, 682, 312, 'pin', { anchor: 'middle', size: 12, fill: C.muted });
  // external
  line(root, 696, 280, 780, 280, { stroke: C.copper, sw: 3 });
  resistor(root, 780, 280, 360, 'R2 1 kΩ');
  const led = circle(root, 780, 395, 18, { fill: '#123020', stroke: C.green, sw: 2 });
  const glow = circle(root, 780, 395, 34, { fill: C.green, opacity: 0 });
  txt(root, 810, 395, 'LED D2', { size: 12.5 });
  line(root, 780, 413, 780, 450, { stroke: C.copper, sw: 3 });
  line(root, 760, 450, 800, 450, { stroke: C.muted }); line(root, 768, 457, 792, 457, { stroke: C.muted });
  // button to ground on the same pin (for input demo)
  line(root, 730, 280, 730, 220, { stroke: C.copper, sw: 2 });
  const btnLever = line(root, 730, 220, 760, 195, { stroke: C.text, sw: 3 });
  txt(root, 770, 175, 'button to GND', { size: 12, fill: C.muted });
  line(root, 760, 220, 860, 220, { stroke: C.muted }); line(root, 860, 220, 860, 236, { stroke: C.muted });
  line(root, 846, 236, 874, 236, { stroke: C.muted }); line(root, 852, 242, 868, 242, { stroke: C.muted });
  const dots = Array.from({ length: 5 }, () => circle(root, 0, 0, 4, { fill: C.accent, opacity: 0 }));
  const pinV = txt(root, 682, 248, '', { anchor: 'middle', size: 13, weight: 700, mono: true });
  return {
    tick(dt, t) {
      const mode = q('mode').value, ot = q('ot').value, pud = q('pu').value, odr = q('odr').checked, btn = q('btn').checked;
      pu.setAttribute('opacity', pud === 'up' ? 1 : 0.15); pd.setAttribute('opacity', pud === 'down' ? 1 : 0.15);
      btnLever.setAttribute('y2', btn ? 220 : 195); btnLever.setAttribute('x2', btn ? 760 : 760);
      // resolve pin level
      let driveHigh = false, driveLow = false;
      if (mode === 'out') { if (odr) driveHigh = ot === 'pp'; else driveLow = true; }
      let level; let desc;
      if (btn) { level = 0; }
      else if (driveHigh) level = 1;
      else if (driveLow) level = 0;
      else if (pud === 'up') level = 1;
      else if (pud === 'down') level = 0;
      else level = mode === 'an' ? 0.5 : (mode === 'out' ? 0.2 : 'float');
      const ledOn = mode === 'out' && driveHigh && !btn;
      pmos.box.setAttribute('stroke', driveHigh ? C.accent : C.line); pmos.box.setAttribute('stroke-width', driveHigh ? 3 : 1.5);
      nmos.box.setAttribute('stroke', driveLow ? C.accent : C.line); nmos.box.setAttribute('stroke-width', driveLow ? 3 : 1.5);
      led.setAttribute('fill', ledOn ? C.green : '#123020');
      glow.setAttribute('opacity', ledOn ? 0.25 + 0.05 * Math.sin(t * 8) : 0);
      padLine.setAttribute('stroke', level === 1 ? C.accent : C.line);
      pinV.textContent = level === 'float' ? '? floating' : level === 1 ? '3.3 V' : level === 0 ? '0 V' : 'analog';
      pinV.setAttribute('fill', level === 'float' ? C.red : level === 1 ? C.accent : C.muted);
      dots.forEach((d, i) => {
        const k = (t * 0.8 + i / dots.length) % 1;
        const pts = [[475, 200], [475, 280], [780, 280], [780, 450]];
        const [x, y] = along(pts, k);
        d.setAttribute('cx', x); d.setAttribute('cy', y); d.setAttribute('opacity', ledOn ? 0.9 : 0);
      });
      const idr = level === 'float' ? (Math.sin(t * 5) > 0 ? 1 : 0) : level === 1 ? 1 : 0;
      while (regsT.firstChild) regsT.firstChild.remove();
      const regRows = [
        ['MODER[9:8]', { out: '01', in: '00', af: '10', an: '11' }[mode]],
        ['OTYPER[4]', ot === 'pp' ? '0' : '1'],
        ['PUPDR[9:8]', { none: '00', up: '01', down: '10' }[pud]],
        ['ODR[4]', odr ? '1' : '0'],
        ['IDR[4]', mode === 'an' ? '0' : String(idr)],
      ];
      txt(regsT, 40, 90, 'GPIOA registers', { size: 13.5, weight: 650, fill: C.muted });
      regRows.forEach(([n, v], i) => {
        rect(regsT, 40, 106 + i * 50, 250, 40, { rx: 6, fill: '#1f232c', stroke: i === 4 && level === 'float' ? C.red : C.line });
        txt(regsT, 54, 126 + i * 50, n, { size: 13.5, mono: true, fill: C.muted });
        txt(regsT, 276, 126 + i * 50, v, { anchor: 'end', size: 16, mono: true, weight: 700, fill: i === 4 ? C.green : C.text });
      });
      if (mode === 'out' && ot === 'od' && odr && !btn) desc = '<b>Open-drain</b> can only pull low. Writing 1 just <i>lets go</i>, so with the LED wired to ground nothing lights it. Open-drain is for shared lines like I²C.';
      else if (mode === 'out') desc = btn ? 'The button shorts the pin to ground while the chip drives it. In real life that is a short circuit: never wire a button straight onto an output!' : `<b>Output mode</b>: writing ODR bit 4 turns the P-MOS (1 → 3.3 V) or N-MOS (0 → 0 V) on. ${odr ? 'The LED is on.' : 'The LED is off.'}`;
      else if (mode === 'in') desc = level === 'float' ? '<b>Input mode</b> with nothing driving the pin and no pull resistor: it <b>floats</b> and IDR reads random noise. Turn on a pull-up or pull-down!' : `<b>Input mode</b>: the input buffer copies the pin level into <b>IDR</b> (${idr}). Press the button to pull it low.`;
      else if (mode === 'af') desc = '<b>Alternate function</b>: a peripheral drives the pin instead of ODR. On our board PA12 is handed to CAN (AF4) and PB6/PB7 to I²C1 (AF1).';
      else desc = '<b>Analog mode</b>: digital buffers off, the pin goes straight to the ADC (PA4 = ADC_IN4). It is also the lowest-power state for unused pins.';
      ctx.caption(desc);
    },
  };
}

function sceneInterrupts(ctx) {
  const root = ctx.svg;
  ctx.controls.innerHTML = `
    <div class="presets">
      <button class="chip" data-irq="can">CAN message arrives</button>
      <button class="chip" data-irq="btn">Button pressed (EXTI)</button>
      <button class="chip" data-irq="tick">SysTick timer</button>
    </div>
    <p class="small muted">Lower priority number = more urgent. SysTick (0) can interrupt the CAN handler (1), which can interrupt the button handler (2).</p>`;
  const IRQ = {
    can: { name: 'CAN RX ISR', col: C.accent, prio: 1, dur: 1.6 },
    btn: { name: 'Button ISR', col: C.lime, prio: 2, dur: 1.4 },
    tick: { name: 'SysTick ISR', col: C.blue, prio: 0, dur: 0.6 },
  };
  const pending = [];
  ctx.controls.addEventListener('click', (e) => { const b = e.target.closest('[data-irq]'); if (b) pending.push(b.dataset.irq); });
  txt(root, 500, 30, 'Interrupts: hardware taps the CPU on the shoulder', { anchor: 'middle', size: 18, weight: 650 });
  const TX0 = 60, TX1 = 940, TY = 110;
  rect(root, TX0, TY - 30, TX1 - TX0, 60, { rx: 6, fill: '#12151b', stroke: C.line });
  txt(root, TX0, TY - 45, 'What the CPU is doing (time →)', { size: 12.5, fill: C.muted });
  const tl = g(root);
  // NVIC + sources
  const srcY = { can: 230, btn: 300, tick: 370 };
  Object.entries(IRQ).forEach(([k, v]) => {
    chip(root, 60, srcY[k] - 25, 200, 50, k === 'can' ? 'bxCAN' : k === 'btn' ? 'EXTI (pin)' : 'SysTick timer', `priority ${v.prio}`, { stroke: v.col, size: 13.5, subSize: 11 });
    line(root, 260, srcY[k], 380, srcY[k], { stroke: C.line, sw: 2 });
  });
  const nvic = chip(root, 380, 205, 150, 190, 'NVIC', 'decides who runs', { stroke: C.pink });
  line(root, 530, 300, 600, 300, { stroke: C.line, sw: 2 });
  const cpu = chip(root, 600, 250, 140, 100, 'CPU', '', { stroke: C.accent });
  const cpuNow = txt(root, 670, 320, '', { anchor: 'middle', size: 12.5, weight: 650 });
  // stack
  txt(root, 790, 190, 'Stack (SRAM)', { size: 12.5, fill: C.muted });
  const stackG = g(root);
  const regsList = ['xPSR', 'PC', 'LR', 'R12', 'R3', 'R2', 'R1', 'R0'];
  const flashes = {};
  Object.keys(IRQ).forEach((k) => { flashes[k] = circle(root, 380, srcY[k], 7, { fill: IRQ[k].col, opacity: 0 }); });
  const segs = [];
  const active = []; // stack of { k, left, stack }
  let now = 0, lastSys = 0;
  return {
    tick(dt) {
      now += dt;
      if (now - lastSys > 6) { lastSys = now; pending.push('tick'); }
      // accept pending interrupts (by priority)
      pending.sort((a, b) => IRQ[a].prio - IRQ[b].prio);
      for (let i = 0; i < pending.length; i++) {
        const k = pending[i];
        const top = active[active.length - 1];
        if (!top || IRQ[k].prio < IRQ[top.k].prio) {
          active.push({ k, left: IRQ[k].dur, stacking: 0.25 });
          flashes[k].setAttribute('opacity', 1);
          pending.splice(i, 1); i--;
        }
      }
      Object.values(flashes).forEach((f) => f.setAttribute('opacity', Math.max(0, +f.getAttribute('opacity') - dt * 1.5)));
      const top = active[active.length - 1];
      let doing = 'main', col = C.dim;
      if (top) {
        if (top.stacking > 0) { top.stacking -= dt; doing = 'stacking'; col = C.pink; }
        else { top.left -= dt; doing = top.k; col = IRQ[top.k].col; if (top.left <= 0) active.pop(); }
      }
      const last = segs[segs.length - 1];
      if (last && last.doing === doing) last.t1 = now; else segs.push({ doing, col, t0: now, t1: now });
      while (segs.length && segs[0].t1 < now - 9) segs.shift();
      while (tl.firstChild) tl.firstChild.remove();
      const tx = (t) => TX1 - ((now - t) / 9) * (TX1 - TX0);
      segs.forEach((s) => {
        const a = Math.max(TX0, tx(s.t0)), b = tx(s.t1);
        if (b <= a) return;
        rect(tl, a, TY - 22, b - a, 44, { rx: 3, fill: s.col, stroke: 'none', opacity: s.doing === 'main' ? 0.35 : 0.85 });
        if (b - a > 70) txt(tl, (a + b) / 2, TY, s.doing === 'main' ? 'main loop' : s.doing === 'stacking' ? 'save' : IRQ[s.doing].name, { anchor: 'middle', size: 12, weight: 650, fill: s.doing === 'main' ? C.text : '#0f1115' });
      });
      cpu.box.setAttribute('stroke', col);
      cpuNow.textContent = doing === 'main' ? 'running main()' : doing === 'stacking' ? 'saving registers' : IRQ[doing].name;
      nvic.box.setAttribute('stroke-width', active.length ? 3 : 1.5);
      // stack frames
      while (stackG.firstChild) stackG.firstChild.remove();
      active.forEach((a, depth) => {
        regsList.forEach((r, i) => {
          const y = 520 - depth * 120 - i * 14;
          if (y < 200) return;
          rect(stackG, 790, y, 170, 13, { rx: 2, fill: IRQ[a.k].col, stroke: 'none', opacity: 0.55 });
          txt(stackG, 800, y + 7, r, { size: 10, mono: true, fill: '#0f1115', weight: 700 });
        });
      });
      ctx.caption(doing === 'main'
        ? 'The CPU is running <code>main()</code>. Click a button to fire an interrupt (SysTick also fires on its own).'
        : doing === 'stacking'
          ? 'The hardware automatically <b>saves 8 registers</b> onto the stack (12 cycles), so the interrupted code can resume exactly where it left off.'
          : `Running <b>${IRQ[doing].name}</b>. Keep handlers short: grab the data, set a flag, and return. ${active.length > 1 ? 'This one <b>pre-empted</b> a less urgent handler: that’s the “nested” in NVIC.' : ''}`);
    },
  };
}

function sceneSwd(ctx) {
  const root = ctx.svg;
  txt(root, 500, 30, 'Programming & debugging over SWD', { anchor: 'middle', size: 18, weight: 650 });
  chip(root, 30, 90, 170, 110, 'Laptop', 'STM32CubeIDE');
  line(root, 200, 145, 270, 145, { stroke: C.muted, sw: 4 });
  txt(root, 235, 128, 'USB', { anchor: 'middle', size: 11.5, fill: C.muted });
  chip(root, 270, 100, 150, 90, 'ST-LINK', 'debug probe', { stroke: C.purple });
  const wires = [['3V3', C.red], ['SWCLK', C.purple], ['SWDIO', C.purple], ['NRST', C.pink], ['GND', C.muted]];
  wires.forEach(([n, c], i) => {
    const y = 108 + i * 16;
    line(root, 420, y, 560, y, { stroke: c, sw: 2.5 });
    txt(root, 490, y - 6, n, { anchor: 'middle', size: 10, fill: c });
  });
  rect(root, 560, 98, 30, 90, { rx: 4, fill: '#111', stroke: C.line });
  txt(root, 575, 205, 'J2', { anchor: 'middle', size: 12, weight: 650 });
  line(root, 590, 125, 650, 125, { stroke: C.purple, sw: 2.5 }); line(root, 590, 140, 650, 140, { stroke: C.purple, sw: 2.5 }); line(root, 590, 156, 650, 156, { stroke: C.pink, sw: 2.5 });
  chip(root, 650, 80, 300, 140, 'STM32F042K6', 'PA14 SWCLK · PA13 SWDIO · NRST');
  // flash grid
  txt(root, 650, 255, 'Flash memory (32 KB = 32 pages of 1 KB)', { size: 13, fill: C.muted });
  const cells = Array.from({ length: 32 }, (_, i) => rect(root, 650 + (i % 8) * 37, 270 + Math.floor(i / 8) * 37, 33, 33, { rx: 4, fill: '#1f232c', stroke: C.line }));
  const led = circle(root, 600, 440, 16, { fill: '#123020', stroke: C.green, sw: 2 });
  txt(root, 600, 474, 'LED', { anchor: 'middle', size: 12, fill: C.muted });
  // phases
  const phases = [
    ['Connect', 'The probe talks to the chip’s debug port over SWCLK/SWDIO and reads its ID code.'],
    ['Erase', 'The Flash pages that will hold the program are erased (all bits set to 1).'],
    ['Program', 'The compiled program (.elf/.bin) is streamed over SWDIO and written page by page.'],
    ['Verify', 'The probe reads the Flash back and compares it with the file.'],
    ['Reset & run', 'NRST is pulsed and your program starts: the LED blinks.'],
    ['Debug', 'In a debug session you can pause at a breakpoint, step line by line and watch variables, all over the same two wires.'],
  ];
  const phaseEls = phases.map(([n], i) => {
    const x = 40 + i * 98;
    const r = rect(root, x, 300, 90, 36, { rx: 18, fill: '#1f232c', stroke: C.line });
    const t = txt(root, x + 45, 318, n, { anchor: 'middle', size: 12, weight: 650, fill: C.muted });
    return { r, t };
  });
  const pkt = circle(root, 0, 0, 6, { fill: C.purple, opacity: 0 });
  const prog = rect(root, 40, 370, 0, 10, { rx: 5, fill: C.purple, stroke: 'none' });
  let tt = 0;
  const USED = 11; // pages used by the program
  return {
    tick(dt, t) {
      tt += dt;
      const DUR = [1.2, 1.2, 4, 1.5, 2.5, 3];
      const total = DUR.reduce((a, b) => a + b, 0);
      if (tt > total) tt = 0;
      let p = 0, acc = 0;
      while (p < DUR.length - 1 && tt > acc + DUR[p]) { acc += DUR[p]; p++; }
      const k = (tt - acc) / DUR[p];
      phaseEls.forEach((e, i) => { e.r.setAttribute('fill', i === p ? '#2d2546' : i < p ? '#1f2a24' : '#1f232c'); e.r.setAttribute('stroke', i === p ? C.purple : i < p ? C.green : C.line); e.t.setAttribute('fill', i === p ? C.text : i < p ? C.green : C.muted); });
      prog.setAttribute('width', ((p + k) / DUR.length) * 550);
      cells.forEach((c, i) => {
        let fill = '#1f232c', stroke = C.line;
        if (p === 1 && i < USED && i / USED < k) { fill = '#2a2f3b'; stroke = C.muted; }
        if (p >= 2 && i < USED) { fill = '#2a2f3b'; stroke = C.muted; }
        if ((p === 2 && i / USED < k) || p > 2) { if (i < USED) { fill = '#24365a'; stroke = C.blue; } }
        if (p === 3 && i < USED && i / USED < k) { stroke = C.green; }
        if (p > 3 && i < USED) stroke = C.green;
        c.setAttribute('fill', fill); c.setAttribute('stroke', stroke);
      });
      const moving = p <= 3;
      const kk = (t * 2) % 1;
      pkt.setAttribute('cx', 420 + kk * 230); pkt.setAttribute('cy', 140);
      pkt.setAttribute('opacity', moving ? 0.9 : 0);
      const on = p === 4 && Math.sin(t * 7) > 0;
      led.setAttribute('fill', on ? C.green : p === 5 ? '#3a2a08' : '#123020');
      ctx.caption(`<b>${phases[p][0]}:</b> ${phases[p][1]}`);
    },
  };
}

function sceneChecklist(ctx) {
  const root = ctx.svg;
  txt(root, 500, 30, 'The STM32’s support circuit on our board', { anchor: 'middle', size: 18, weight: 650 });
  chip(root, 380, 190, 240, 220, 'STM32F042K6', 'U1');
  const items = [
    { t: 'Decoupling caps', s: 'C1 · C2 · C3 (100 nF)', x: 60, y: 90, to: [380, 230], col: C.red, d: '100 nF on every VDD pin (VDD, VDDA, VDDIO2), as close as possible.' },
    { t: 'Crystal', s: 'Y1 8 MHz + C5/C6', x: 60, y: 210, to: [380, 290], col: C.blue, d: 'Accurate clock for CAN. Short traces, ground underneath.' },
    { t: 'BOOT0 pull-down', s: 'R6 10 kΩ', x: 60, y: 330, to: [380, 360], col: C.pink, d: 'Never leave BOOT0 floating, or the chip may start the bootloader instead of your code.' },
    { t: 'SWD header', s: 'J2: 3V3 SWCLK SWDIO NRST GND', x: 690, y: 90, to: [620, 230], col: C.purple, d: 'Always break out SWD and NRST so you can program and debug.' },
    { t: 'CAN transceiver', s: 'U3 on PA11/PA12', x: 690, y: 210, to: [620, 300], col: C.accent, d: 'The bxCAN peripheral needs a transceiver to drive the bus.' },
    { t: 'I²C + pull-ups', s: 'U4, R7/R8 on PB6/PB7', x: 690, y: 330, to: [620, 370], col: C.green, d: 'Pull-ups on SDA/SCL. Check device addresses.' },
    { t: 'Status LEDs', s: 'D1/D2 on PA5/PA4', x: 380, y: 470, to: [500, 410], col: C.lime, d: 'A blinking LED is the simplest proof your code is running.' },
  ];
  const els = items.map((it) => {
    const w = 250;
    const p = path(root, polyD([[it.x + (it.x < 380 ? w : it.x > 600 ? 0 : w / 2), it.y + 35], it.to]), { stroke: C.line, sw: 2, dash: '5 5' });
    const c = chip(root, it.x, it.y, w, 70, it.t, it.s, { size: 14.5, subSize: 11.5 });
    const tick = txt(root, it.x + w - 18, it.y + 18, '', { anchor: 'middle', size: 16, weight: 800, fill: C.green });
    return { ...it, p, c, tick };
  });
  let tt = 0;
  return {
    tick(dt) {
      tt += dt * 0.6;
      const n = items.length;
      const cur = Math.floor(tt) % (n + 2);
      els.forEach((e, i) => {
        const done = i < cur, now = i === cur;
        e.c.box.setAttribute('stroke', now ? e.col : done ? '#3d4a3f' : C.line);
        e.c.box.setAttribute('stroke-width', now ? 3 : 1.5);
        e.p.setAttribute('stroke', now ? e.col : done ? '#3d4a3f' : C.line);
        e.tick.textContent = done || now ? '✓' : '';
      });
      ctx.caption(cur < n ? `<b>${items[cur].t}:</b> ${items[cur].d}` : 'That’s a complete, debuggable STM32 circuit. Most of it is the same for any STM32 you’ll use on the car.');
    },
  };
}

export const MCU_MODULE = {
  id: 'mcu',
  title: 'Microcontroller · STM32F042K6',
  subtitle: 'How the brain of the board works',
  next: { id: 'pcb', label: 'Back to the 3D board' },
  steps: [
    {
      title: 'What is a microcontroller?',
      body: `<p>A <b>microcontroller</b> (MCU) is a complete small computer on a single chip: a CPU, memory, a clock, and lots of hardware <b>peripherals</b> that talk to the outside world.</p>
<p>Our board uses the <b>STM32F042K6</b> from ST:</p>
<ul><li>Arm <b>Cortex-M0</b> core, up to <b>48 MHz</b></li><li><b>32 KB</b> Flash (program), <b>6 KB</b> SRAM (variables)</li><li>CAN, I²C, SPI, USART, USB, 12-bit ADC, timers</li><li>2.0–3.6 V supply, 32-pin LQFP package</li></ul>
<p>Click the blocks in the diagram to explore.</p>`,
      scene: sceneBlock,
      board: { terms: ['mcu'], label: 'Find U1 on the 3D board' },
    },
    {
      title: 'The pinout',
      body: `<p>The LQFP-32 package has 8 pins per side, numbered counter-clockwise from the dot (pin 1).</p>
<p>A few pins have fixed jobs: power, ground, reset, BOOT0 and the oscillator. Most are <b>GPIOs</b> named by port and number (PA4 = port A, pin 4). Each GPIO can also be connected to one of several peripherals.</p>
<p>Use the buttons below to filter by function, and click a pin for details.</p>
<p class="muted small">Pin data from ST’s datasheet DS10152. Always check the datasheet for your exact part number before laying out a board.</p>`,
      scene: scenePinout,
      board: { terms: ['mcu'], label: 'See U1’s footprint on the 3D board' },
    },
    {
      title: 'Power pins & decoupling',
      body: `<p>The F042 has three supply pins: <b>VDD</b> (main), <b>VDDA</b> (analog: ADC and oscillators) and <b>VDDIO2</b> (some I/O pins), plus two grounds (<b>VSS</b>).</p>
<p>Every one needs a <b>100 nF capacitor</b> right next to it, plus a larger bulk capacitor (1–10 µF) nearby. The animation shows why.</p>`,
      scene: scenePower,
      board: { terms: ['decap'], label: 'See the decoupling caps on the 3D board' },
    },
    {
      title: 'Clocks',
      body: `<p>Everything in the chip, from the CPU to every peripheral, is driven by a <b>clock</b>. The <b>RCC</b> (reset & clock control) lets you pick and multiply clock sources.</p>
<p>Try building the 48 MHz clock our board uses: <b>HSE (8 MHz crystal) × 6 with the PLL</b>.</p>
<p class="muted small">Remember: in STM32 firmware, each peripheral’s clock must be turned on (e.g. <code>__HAL_RCC_CAN1_CLK_ENABLE()</code>) before you can use it.</p>`,
      scene: sceneClocks,
      board: { terms: ['crystal'], label: 'See the crystal Y1 on the 3D board' },
    },
    {
      title: 'Reset & boot',
      body: `<p>After power-on the chip follows the same sequence every time, ending in your <code>main()</code>.</p>
<p>The <b>BOOT0</b> pin decides where it boots from. Our board pulls it low with R6 so it always runs your program. Toggle BOOT0 to see what happens if it’s high.</p>`,
      scene: sceneBoot,
      board: { terms: ['pull-up', 'mcu'], label: 'See the BOOT0 resistor R6 on the board' },
    },
    {
      title: 'Running code: fetch, decode, execute',
      body: `<p>Your C code is compiled into <b>machine instructions</b> stored in Flash. The CPU’s <b>program counter (PC)</b> points to the next one.</p>
<p>Here is the classic “blink an LED” loop. Watch how the instructions flow through the 3-stage pipeline, update the registers, and finally flip the output bit that drives the LED.</p>
<p class="muted small">The instructions are simplified for clarity, but they are real Thumb instructions and the real register address.</p>`,
      scene: sceneExecute,
    },
    {
      title: 'GPIO: talking to the outside world',
      body: `<p>Each GPIO pin is controlled by a handful of <b>registers</b>. Your code (or HAL) simply writes bits into them:</p>
<pre><code>// make PA4 an output and switch it on
GPIOA-&gt;MODER |=  (1 &lt;&lt; (4 * 2));
GPIOA-&gt;ODR   |=  (1 &lt;&lt; 4);
// or with HAL:
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, GPIO_PIN_SET);</code></pre>
<p>Change the settings below and watch what the pin does.</p>`,
      scene: sceneGpio,
      board: { terms: ['mcu'], label: 'Find the LEDs’ pins on U1' },
    },
    {
      title: 'Interrupts',
      body: `<p>Instead of constantly checking (“polling”) whether something happened, peripherals can raise an <b>interrupt</b>. The CPU pauses <code>main()</code>, runs a short <b>interrupt service routine (ISR)</b>, then continues where it left off.</p>
<p>The <b>NVIC</b> decides which interrupt runs first based on priority. A more urgent interrupt can even interrupt a less urgent ISR.</p>
<p>Fire some interrupts with the buttons below.</p>`,
      scene: sceneInterrupts,
    },
    {
      title: 'Programming & debugging (SWD)',
      body: `<p>To get your program into the chip, an <b>ST-LINK</b> probe (or a Nucleo board’s built-in one) connects to the 5-pin header <b>J2</b>: 3V3, SWCLK, SWDIO, NRST and GND.</p>
<p>The same connection lets you <b>debug</b>: set breakpoints, step through code and read variables while the chip runs. This is the most valuable tool you have when something doesn’t work.</p>`,
      scene: sceneSwd,
      board: { terms: ['connector', 'mcu'], label: 'See the SWD header J2 on the board' },
    },
    {
      title: 'Checklist: an STM32 on your PCB',
      body: `<p>Every STM32 board you design for the car needs the same basic support circuit:</p>
<ol><li>100 nF decoupling on every supply pin, plus bulk capacitance</li><li>A crystal (HSE) if you use CAN or need accurate timing</li><li>BOOT0 pulled down</li><li>An SWD header with NRST</li><li>Pin assignments checked in STM32CubeMX</li><li>A status LED and test points on the power rails</li></ol>
<p>Then use the <b>CAN</b> and <b>I²C</b> modules to connect it to the rest of the car.</p>`,
      scene: sceneChecklist,
      board: { terms: ['mcu', 'decap', 'crystal'], label: 'See the whole circuit on the 3D board' },
    },
  ],
};
