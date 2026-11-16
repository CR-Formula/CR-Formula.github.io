// Lesson player: shows one module (CAN, I²C, MCU…) as a list of steps.
// Each step has sidebar text and an animated SVG "scene".
//
// A scene is a function (ctx) => ({ tick?(dt, t), destroy?() }) where ctx gives:
//   ctx.svg        — an empty <g> inside a 1000 × 600 viewBox to draw into
//   ctx.controls   — an empty <div> in the sidebar for buttons/sliders
//   ctx.caption(h) — set the live caption under the animation (HTML)
//   ctx.speed      — current speed multiplier (read-only)

import { h } from './svg.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class LessonPlayer {
  constructor({ side, stage, onBoard }) {
    this.side = side;
    this.stage = stage;
    this.onBoard = onBoard;
    this.mod = null;
    this.idx = 0;
    this.scene = null;
    this.playing = true;
    this.speed = 1;
    this.time = 0;
    this.last = 0;
    this.active = false;

    stage.innerHTML = `
      <div class="stage-svg"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" role="img"></svg></div>
      <div class="stage-foot">
        <div class="stage-caption" aria-live="polite"></div>
        <div class="stage-bar" role="toolbar" aria-label="Animation controls">
          <button data-act="play" title="Pause / play (space)">❚❚</button>
          <button data-act="restart" title="Restart this animation">↺</button>
          <label>Speed <select data-act="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label>
        </div>
      </div>`;
    this.svg = stage.querySelector('svg');
    this.captionEl = stage.querySelector('.stage-caption');
    this.playBtn = stage.querySelector('[data-act=play]');
    stage.querySelector('.stage-bar').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'play') this.setPlaying(!this.playing);
      if (b.dataset.act === 'restart') this.go(this.idx);
    });
    stage.querySelector('[data-act=speed]').addEventListener('change', (e) => { this.speed = +e.target.value; });

    side.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'next') this.go(Math.min(this.mod.steps.length - 1, this.idx + 1));
      else if (act === 'prev') this.go(Math.max(0, this.idx - 1));
      else if (act === 'step') this.go(+a.dataset.step);
      else if (act === 'board') {
        const b = this.mod.steps[this.idx].board;
        if (b) this.onBoard(b);
      } else if (act === 'module') this.onModule?.(a.dataset.module);
    });

    window.addEventListener('keydown', (e) => {
      if (!this.active || e.target.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') this.go(Math.min(this.mod.steps.length - 1, this.idx + 1));
      if (e.key === 'ArrowLeft') this.go(Math.max(0, this.idx - 1));
      if (e.key === ' ') { e.preventDefault(); this.setPlaying(!this.playing); }
    });

    const loop = (now) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - (this.last || now)) / 1000);
      this.last = now;
      if (!this.active || !this.playing || !this.scene || !this.scene.tick) return;
      const sdt = dt * this.speed;
      this.time += sdt;
      try { this.scene.tick(sdt, this.time); } catch (err) { console.error(err); this.scene.tick = null; }
    };
    requestAnimationFrame(loop);
  }

  setPlaying(p) {
    this.playing = p;
    this.playBtn.textContent = p ? '❚❚' : '▶';
    this.playBtn.title = p ? 'Pause (space)' : 'Play (space)';
  }

  open(mod, idx = 0) {
    this.mod = mod;
    this.active = true;
    this.go(Math.max(0, Math.min(mod.steps.length - 1, idx)));
  }

  close() {
    this.active = false;
    this.teardown();
  }

  teardown() {
    if (this.scene && this.scene.destroy) { try { this.scene.destroy(); } catch (e) { console.error(e); } }
    this.scene = null;
    while (this.svg.firstChild) this.svg.firstChild.remove();
  }

  go(i) {
    const m = this.mod;
    this.idx = i;
    this.teardown();
    const s = m.steps[i];
    const n = m.steps.length;
    this.side.innerHTML = `
      <div class="lesson-kicker">${esc(m.title)}</div>
      <div class="tour-progress">${m.steps.map((_, k) => `<span class="${k <= i ? 'done' : ''}" data-act="step" data-step="${k}" title="${esc(m.steps[k].title)}"></span>`).join('')}</div>
      <div class="tour-step">Step ${i + 1} of ${n}</div>
      <h2 class="tour-title">${esc(s.title)}</h2>
      <div class="tour-body">${s.body}</div>
      <div class="lesson-controls"></div>
      ${s.board ? `<button class="btn board-btn" data-act="board">${esc(s.board.label || 'See it on the 3D board')} →</button>` : ''}
      <div class="tour-nav">
        <button class="btn" data-act="prev" ${i === 0 ? 'disabled' : ''}>← Back</button>
        ${i < n - 1 ? '<button class="btn primary" data-act="next">Next →</button>' : (m.next ? `<button class="btn primary" data-act="module" data-module="${m.next.id}">${esc(m.next.label)} →</button>` : '')}
      </div>
      <details class="lesson-outline"><summary>All steps in this module</summary><ol>
        ${m.steps.map((st, k) => `<li><button data-act="step" data-step="${k}" class="${k === i ? 'cur' : ''}">${esc(st.title)}</button></li>`).join('')}
      </ol></details>`;
    this.captionEl.innerHTML = '';
    this.time = 0;
    const root = h(this.svg, 'g');
    const player = this;
    let lastCap = null;
    const ctx = {
      svg: root,
      controls: this.side.querySelector('.lesson-controls'),
      caption: (html) => { if (lastCap !== html) { lastCap = html; this.captionEl.innerHTML = html; } },
      get speed() { return player.speed; },
    };
    try {
      this.scene = s.scene ? s.scene(ctx) || {} : {};
      // Draw the first frame immediately so a paused scene isn't blank.
      if (this.scene.tick) this.scene.tick(0, 0);
    } catch (err) {
      console.error(err);
      this.captionEl.textContent = 'This animation failed to load.';
    }
    this.side.scrollTop = 0;
    this.onStep?.(m.id, i);
  }
}
