/**
 * محاكاة جسيمات مرتبطة بدرجة الحرارة (Canvas) — مكمّلة لـ particleSim.js
 *
 * الأوضاع:
 *  solid / liquid / gas : حالة ثابتة، والحرارة تغيّر سرعة الحركة فقط.
 *  auto                 : الحالة تتحدد من الحرارة، ولكل جسيم عتبة انصهار وغليان
 *                         خاصة به، فيحدث التحول تدريجيًا أمام الطالب.
 *
 * الشكل نفسه في الموقع (كرات مضيئة على خلفية داكنة)، مع روابط بين جسيمات الصلب
 * تُظهر الترتيب، وذيول خلف جسيمات الغاز تُظهر السرعة (لا اعتماد على اللون وحده).
 * الأداء: رسوم مسبقة، توقف عند الخروج من الشاشة، وتباطؤ عند «تقليل الحركة».
 */
import { prefersReducedMotion } from '../core/dom.js';

const HUE = { solid: 192, liquid: 212, gas: 262 };
const MELT = [30, 40];
const BOIL = [64, 74];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

function sprite(r, hue, dpr) {
  const pad = r * 0.8;
  const size = Math.ceil((r + pad) * 2);
  const c = document.createElement('canvas');
  c.width = c.height = Math.ceil(size * dpr);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const m = size / 2;
  const glow = g.createRadialGradient(m, m, r * 0.6, m, m, r + pad);
  glow.addColorStop(0, `hsla(${hue}, 95%, 65%, .45)`);
  glow.addColorStop(1, `hsla(${hue}, 95%, 65%, 0)`);
  g.fillStyle = glow;
  g.fillRect(0, 0, size, size);
  const body = g.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r);
  body.addColorStop(0, `hsl(${hue}, 100%, 92%)`);
  body.addColorStop(0.35, `hsl(${hue}, 92%, 62%)`);
  body.addColorStop(0.85, `hsl(${hue + 6}, 85%, 42%)`);
  body.addColorStop(1, `hsl(${hue + 10}, 80%, 32%)`);
  g.fillStyle = body;
  g.beginPath(); g.arc(m, m, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,.75)';
  g.beginPath(); g.ellipse(m - r * 0.35, m - r * 0.42, r * 0.28, r * 0.18, -0.6, 0, Math.PI * 2); g.fill();
  return { c, size };
}

export class ThermoSim {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cols = opts.cols || 7;
    this.rows = opts.rows || 5;
    this.mode = opts.mode || 'solid';
    this.temperature = opts.temperature ?? 30;
    this.paused = !!opts.paused;
    this.running = true;
    this.visible = true;
    this.particles = [];
    this.counts = { solid: 0, liquid: 0, gas: 0 };
    this.w = 0; this.h = 0;
    this._raf = 0;
    this._frame = this._frame.bind(this);
    this._onVis = () => this._kick();
    document.addEventListener('visibilitychange', this._onVis);
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas);
    this._io = new IntersectionObserver((es) => { this.visible = es[es.length - 1].isIntersecting; this._kick(); });
    this._io.observe(canvas);
    // قد تُنشأ المحاكاة قبل إضافة الصفحة إلى المستند (حجمها صفر)،
    // لذلك تُوزَّع الجسيمات عند أول قياس حقيقي للحجم.
    this._ready = false;
    this._resize();
    this._kick();
  }

  /* ---------- الواجهة ---------- */
  setMode(m) {
    this.mode = m;
    if (m === 'gas') this.particles.forEach((p) => { if (Math.hypot(p.vx, p.vy) < 0.5) this._gasKick(p); });
    this._kick();
  }
  setTemperature(t) { this.temperature = clamp(+t, 0, 100); this._kick(); }
  play() { this.paused = false; this._kick(); }
  pause() { this.paused = true; }
  reset() { if (this._ready) { this._init(); this._draw(); } }
  /** نسبة الجسيمات التي «يجب» أن تكون في حالة ما حسب الحرارة — مستقلة عن الرسم */
  targetFraction(state) {
    if (!this.particles.length) return state === this._stateOf({ melt: 35, boil: 69 }) ? 1 : 0;
    return this.particles.filter((p) => this._stateOf(p) === state).length / this.particles.length;
  }
  destroy() {
    this.running = false;
    cancelAnimationFrame(this._raf);
    document.removeEventListener('visibilitychange', this._onVis);
    this._ro.disconnect();
    this._io.disconnect();
  }

  /* ---------- الأبعاد ---------- */
  _resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ow = this.w; const oh = this.h;
    this.dpr = dpr; this.w = w; this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    const k = 2.25;
    this.r = clamp(Math.min((w * 0.56) / (k * (this.cols - 1) + 2), (h * 0.6) / (k * (this.rows - 1) + 2)), 4, 14);
    this.spacing = this.r * k;
    this.sprites = { solid: sprite(this.r, HUE.solid, dpr), liquid: sprite(this.r, HUE.liquid, dpr), gas: sprite(this.r, HUE.gas, dpr) };
    if (!this._ready) { this._ready = true; this._init(); }
    else {
      this._homes();
      if (ow) this.particles.forEach((p) => { if (p.state !== 'solid') { p.x *= w / ow; p.y *= h / oh; } });
    }
    this._draw();
    this._kick();
  }

  _homes() {
    const sp = this.spacing;
    const x0 = (this.w - (this.cols - 1) * sp) / 2;
    const y0 = this.h - this.r - 10 - (this.rows - 1) * sp;
    this.particles.forEach((p, i) => { p.hx = x0 + (i % this.cols) * sp; p.hy = y0 + Math.floor(i / this.cols) * sp; });
  }

  _init() {
    this.particles = Array.from({ length: this.cols * this.rows }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0,
      p1: Math.random() * 6.28, p2: Math.random() * 6.28, w1: rand(0.8, 1.25), w2: rand(0.8, 1.25),
      melt: rand(MELT[0], MELT[1]), boil: rand(BOIL[0], BOIL[1]), state: 'solid',
    }));
    this._homes();
    this.particles.forEach((p) => {
      p.state = this._stateOf(p);
      if (p.state === 'solid') { p.x = p.hx; p.y = p.hy; }
      else if (p.state === 'liquid') { p.x = rand(this.r * 2, this.w - this.r * 2); p.y = this.h - rand(this.r, this.h * 0.3); }
      else { p.x = rand(this.r * 2, this.w - this.r * 2); p.y = rand(this.r * 2, this.h - this.r * 2); this._gasKick(p); }
    });
  }

  _stateOf(p) {
    if (this.mode !== 'auto') return this.mode;
    const T = this.temperature;
    return T < p.melt ? 'solid' : T < p.boil ? 'liquid' : 'gas';
  }

  _gasSpeed() {
    const T = this.temperature;
    const n = this.mode === 'auto' ? clamp((T - 64) / 36, 0, 1) : T / 100;
    return (1.4 + 5.2 * n) * (this.r / 8);
  }

  _gasKick(p) {
    const a = Math.random() * Math.PI * 2;
    const s = this._gasSpeed();
    p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
  }

  /* ---------- الحلقة ---------- */
  _kick() {
    if (!this.running || this._raf || !this.visible || document.hidden) return;
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._frame);
  }

  _frame(ts) {
    this._raf = 0;
    if (!this.running) return;
    if (!this.canvas.isConnected) { this.destroy(); return; }
    const dt = Math.min(ts - this._last, 50);
    this._last = ts;
    if (!this.paused && this.w) this._update((dt / 16.67) * (prefersReducedMotion() ? 0.35 : 1));
    this._draw();
    if (this.visible && !document.hidden && !this.paused) this._raf = requestAnimationFrame(this._frame);
  }

  _update(f) {
    const T = this.temperature;
    const r = this.r; const w = this.w; const h = this.h;
    const pad = r + 2;
    const auto = this.mode === 'auto';
    const sc = r / 8;
    const ps = this.particles;

    // عدّ الجسيمات في أعمدة لتسوية سطح السائل (يأخذ شكل الوعاء)
    const binW = r * 2.2;
    const nb = Math.max(1, Math.ceil(w / binW));
    if (!this._bins || this._bins.length !== nb) this._bins = new Float32Array(nb);
    const bins = this._bins;
    bins.fill(0);
    ps.forEach((p) => { if (p.state !== 'gas') bins[clamp((p.x / binW) | 0, 0, nb - 1)] += 1; });

    for (const p of ps) {
      const st = this._stateOf(p);
      if (st !== p.state) {
        if (st === 'gas') { const s = this._gasSpeed(); const a = rand(-Math.PI * 0.9, -Math.PI * 0.1); p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; }
        else if (st === 'liquid' && p.state === 'solid') { p.vx = rand(-0.6, 0.6) * sc; p.vy = 0; }
        else if (st === 'liquid' && p.state === 'gas') { p.vx *= 0.3; p.vy = Math.abs(p.vy) * 0.3; }
        p.state = st;
      }

      if (st === 'solid') {
        const n = auto ? clamp(T / MELT[0], 0, 1) : T / 100;
        const amp = r * (0.07 + 0.42 * n);
        const sp = (0.07 + 0.32 * n) * f;
        p.p1 += sp * p.w1; p.p2 += sp * p.w2;
        const k = Math.min(1, 0.22 * f);
        p.x += (p.hx + Math.sin(p.p1) * amp - p.x) * k;
        p.y += (p.hy + Math.cos(p.p2) * amp - p.y) * k;
        p.vx = p.vy = 0;
        continue;
      }

      if (st === 'liquid') {
        const n = auto ? clamp((T - MELT[0]) / (BOIL[1] - MELT[0]), 0, 1) : T / 100;
        const heat = 0.55 + 1.3 * n;
        p.vy += 0.15 * sc * f;
        p.vx += (Math.random() - 0.5) * heat * sc * f;
        p.vy += (Math.random() - 0.5) * 0.7 * heat * sc * f;
        const b = clamp((p.x / binW) | 0, 0, nb - 1);
        const left = b > 0 ? bins[b - 1] : 99;
        const right = b < nb - 1 ? bins[b + 1] : 99;
        p.vx += clamp(left - right, -3, 3) * 0.06 * sc * f;
        const d = Math.pow(0.94, f);
        p.vx *= d; p.vy *= d;
        const max = (1.1 + 2.4 * n) * sc;
        const s = Math.hypot(p.vx, p.vy);
        if (s > max) { p.vx *= max / s; p.vy *= max / s; }
      } else {
        const target = this._gasSpeed();
        let s = Math.hypot(p.vx, p.vy);
        if (s < 0.05) { this._gasKick(p); s = target; }
        const k = 1 + (target / s - 1) * Math.min(1, 0.06 * f);
        p.vx *= k; p.vy *= k;
        const t = (Math.random() - 0.5) * 0.12 * f;
        const c = Math.cos(t); const sn = Math.sin(t);
        const vx = p.vx * c - p.vy * sn;
        p.vy = p.vx * sn + p.vy * c; p.vx = vx;
      }

      p.x += p.vx * f; p.y += p.vy * f;
      const bounce = st === 'gas' ? 1 : 0.4;
      if (p.x < pad) { p.x = pad; p.vx = Math.abs(p.vx) * bounce; }
      if (p.x > w - pad) { p.x = w - pad; p.vx = -Math.abs(p.vx) * bounce; }
      if (p.y < pad) { p.y = pad; p.vy = Math.abs(p.vy) * bounce; }
      if (p.y > h - pad) { p.y = h - pad; p.vy = -Math.abs(p.vy) * bounce; }
    }

    // تصادمات بسيطة
    const minD = r * 2;
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i];
      for (let j = i + 1; j < ps.length; j++) {
        const b = ps[j];
        if (a.state === 'solid' && b.state === 'solid') continue;
        const dx = b.x - a.x; const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minD * minD || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d; const ny = dy / d; const o = minD - d;
        if (a.state === 'solid') { b.x += nx * o; b.y += ny * o; }
        else if (b.state === 'solid') { a.x -= nx * o; a.y -= ny * o; }
        else {
          a.x -= nx * o / 2; a.y -= ny * o / 2; b.x += nx * o / 2; b.y += ny * o / 2;
          if (a.state === 'gas' && b.state === 'gas') {
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rel < 0) { a.vx += rel * nx; a.vy += rel * ny; b.vx -= rel * nx; b.vy -= rel * ny; }
          }
        }
      }
    }
    const c = { solid: 0, liquid: 0, gas: 0 };
    ps.forEach((p) => { c[p.state] += 1; });
    this.counts = c;
  }

  _draw() {
    if (!this.w) return;
    const g = this.ctx;
    const ps = this.particles;
    const r = this.r;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);

    // روابط الصلب: تُظهر أن الجسيمات مرتبة ومتماسكة
    g.strokeStyle = 'rgba(160, 230, 255, .35)';
    g.lineWidth = Math.max(1.2, r * 0.2);
    g.beginPath();
    const lim = this.spacing * 1.45;
    ps.forEach((a, i) => {
      if (a.state !== 'solid') return;
      [(i % this.cols) < this.cols - 1 ? ps[i + 1] : null, ps[i + this.cols]].forEach((b) => {
        if (b && b.state === 'solid' && Math.abs(b.x - a.x) + Math.abs(b.y - a.y) < lim) { g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
      });
    });
    g.stroke();

    // ذيول الغاز: تُظهر السرعة
    g.lineCap = 'round';
    g.lineWidth = r * 0.9;
    g.strokeStyle = 'rgba(190, 170, 255, .3)';
    g.beginPath();
    ps.forEach((p) => { if (p.state === 'gas') { g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 4.5, p.y - p.vy * 4.5); } });
    g.stroke();

    ps.forEach((p) => {
      const s = this.sprites[p.state];
      g.drawImage(s.c, p.x - s.size / 2, p.y - s.size / 2, s.size, s.size);
    });
  }
}

/** وصف نصي للمحاكاة لقارئ الشاشة */
export function describeSim(mode, t) {
  const speed = t > 66 ? 'بسرعة كبيرة' : t > 33 ? 'بسرعة متوسطة' : 'ببطء';
  if (mode === 'solid') return `جسيمات متقاربة جدًا ومرتبة، تهتز في مكانها ${speed}.`;
  if (mode === 'liquid') return `جسيمات متقاربة غير مرتبة، تنزلق بجانب بعضها في قاع الوعاء، وتتحرك ${speed}.`;
  return `جسيمات متباعدة جدًا، تنتشر في الوعاء كله وتتحرك ${speed} في كل الاتجاهات.`;
}
