/**
 * محاكاة جسيمات المادة داخل وعاء زجاجي (Canvas).
 * الجسيمات كرات مضيئة ثلاثية الأبعاد.
 *
 *  solid  : متقاربة جدًا، مرتبة، تهتز في مكانها.
 *  liquid : متقاربة، غير مرتبة، تنزلق بجانب بعضها في قاع الوعاء.
 *  gas    : متباعدة جدًا، سريعة، تنتشر في كامل الوعاء.
 *
 * الانتقال بين الحالات يتم تدريجيًا (تغيّر الحركة والانتظام والتباعد).
 */
import { prefersReducedMotion } from '../core/dom.js';

/* معاملات الفيزياء لكل حالة */
const PARAMS = {
  solid:  { spring: 0.12, gravity: 0.0,  jitter: 0.32, damping: 0.78, maxSpeed: 1.6, gasSpeed: 0 },
  liquid: { spring: 0.0,  gravity: 0.11, jitter: 0.22, damping: 0.95, maxSpeed: 2.6, gasSpeed: 0 },
  gas:    { spring: 0.0,  gravity: 0.0,  jitter: 0.04, damping: 1.0,  maxSpeed: 5.5, gasSpeed: 3.6 },
};
const KEYS = Object.keys(PARAMS.solid);

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** رسم كرة مضيئة مرة واحدة ثم إعادة استخدامها (أداء أفضل) */
function makeSprite(r, hue) {
  const pad = r * 0.9;
  const size = Math.ceil((r + pad) * 2);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const cx = size / 2;
  // توهج خارجي
  const glow = g.createRadialGradient(cx, cx, r * 0.6, cx, cx, r + pad);
  glow.addColorStop(0, `hsla(${hue}, 95%, 65%, 0.45)`);
  glow.addColorStop(1, `hsla(${hue}, 95%, 65%, 0)`);
  g.fillStyle = glow;
  g.fillRect(0, 0, size, size);
  // جسم الكرة
  const body = g.createRadialGradient(cx - r * 0.35, cx - r * 0.4, r * 0.1, cx, cx, r);
  body.addColorStop(0, `hsl(${hue}, 100%, 92%)`);
  body.addColorStop(0.35, `hsl(${hue}, 92%, 62%)`);
  body.addColorStop(0.85, `hsl(${hue + 6}, 85%, 42%)`);
  body.addColorStop(1, `hsl(${hue + 10}, 80%, 32%)`);
  g.fillStyle = body;
  g.beginPath();
  g.arc(cx, cx, r, 0, Math.PI * 2);
  g.fill();
  // لمعة
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.beginPath();
  g.ellipse(cx - r * 0.35, cx - r * 0.42, r * 0.28, r * 0.18, -0.6, 0, Math.PI * 2);
  g.fill();
  return { canvas: c, half: size / 2 };
}

export class ParticleSim {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{state?: string, count?: number, hue?: number}} opts
   */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.count = opts.count ?? 36;
    this.hue = opts.hue ?? 200;
    this.state = opts.state ?? 'solid';
    this.p = { ...PARAMS[this.state] };
    this.tween = null;
    this.widthFrac = 0.62; // عرض الوعاء نسبةً لعرض اللوحة
    this.targetWidthFrac = this.widthFrac;
    this.running = false;
    this.visible = true;
    this.paused = prefersReducedMotion();
    this.heat = 0; // للتلوين أثناء التسخين/التبريد (-1 .. 1)
    this.particles = [];

    this._loop = this._loop.bind(this);
    this._resize();
    this._seed();

    this.ro = new ResizeObserver(() => {
      this._resize();
      this._layoutHomes();
      if (this.state === 'solid' && !this.tween) this._placeFor('solid');
      this._kick(true);
    });
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this._kick();
    });
    this.io.observe(canvas);
    this._kick();
  }

  /* ---------- الأبعاد ---------- */
  _resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = Math.max(200, r.width);
    this.H = Math.max(180, r.height);
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // نصف قطر الجسيم يعتمد على حجم اللوحة
    this.r = Math.max(7, Math.min(this.W, this.H * 1.2) / 30);
    this.sprite = makeSprite(this.r, this.hue);
    this._box();
    this._layoutHomes?.();
  }

  _box() {
    const w = this.W * this.widthFrac;
    const top = this.H * 0.1;
    const bottom = this.H * 0.93;
    this.box = { l: (this.W - w) / 2, r: (this.W + w) / 2, t: top, b: bottom };
  }

  /** مواقع "البيت" للجسيمات في الحالة الصلبة: شبكة مرتبة في قاع الوعاء */
  _layoutHomes() {
    const cols = 6;
    const d = this.r * 2.08;
    const cx = this.W / 2;
    const b = this.box.b - this.r - 2;
    this.particles.forEach((pt, i) => {
      const c = i % cols;
      const row = Math.floor(i / cols);
      pt.hx = cx + (c - (cols - 1) / 2) * d;
      pt.hy = b - row * d;
    });
  }

  /** ربط كل جسيم بأقرب موقع في الشبكة (من الأسفل للأعلى) حتى يتجمد بشكل طبيعي */
  _assignHomes() {
    const homes = this.particles.map((p) => [p.hx, p.hy]).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    const sorted = [...this.particles].sort((a, b) => b.y - a.y);
    for (let i = 0; i < sorted.length; i += 6) {
      const row = sorted.slice(i, i + 6).sort((a, b) => a.x - b.x);
      const hrow = homes.slice(i, i + 6).sort((a, b) => a[0] - b[0]);
      row.forEach((p, k) => { [p.hx, p.hy] = hrow[k]; });
    }
  }

  _seed() {
    this.particles = Array.from({ length: this.count }, () => ({ x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0 }));
    this._layoutHomes();
    this._placeFor(this.state);
  }

  /** وضع الجسيمات مباشرة بشكل يناسب الحالة */
  _placeFor(state) {
    const { l, r, t, b } = this.box;
    this.particles.forEach((pt) => {
      if (state === 'gas') {
        pt.x = lerp(l + this.r, r - this.r, Math.random());
        pt.y = lerp(t + this.r, b - this.r, Math.random());
        const a = Math.random() * Math.PI * 2;
        pt.vx = Math.cos(a) * PARAMS.gas.gasSpeed;
        pt.vy = Math.sin(a) * PARAMS.gas.gasSpeed;
      } else {
        pt.x = pt.hx + (state === 'liquid' ? (Math.random() - 0.5) * this.r : 0);
        pt.y = pt.hy;
        pt.vx = pt.vy = 0;
      }
    });
  }

  /* ---------- واجهة الاستخدام ---------- */

  /** الانتقال إلى حالة جديدة. instant: بدون انتقال تدريجي */
  setState(state, { instant = false, duration = 1800 } = {}) {
    if (instant) {
      this.state = state;
      this.p = { ...PARAMS[state] };
      this.tween = null;
      this.heat = 0;
      this._placeFor(state);
      this._kick(true);
      return;
    }
    if (state === 'solid') this._assignHomes();
    const order = ['solid', 'liquid', 'gas'];
    this.heat = order.indexOf(state) > order.indexOf(this.state) ? 1 : -1;
    this.tween = { from: { ...this.p }, to: PARAMS[state], start: performance.now(), duration };
    // دفعة طاقة عند التسخين لتسريع الانتشار
    if (state === 'gas') {
      this.particles.forEach((pt) => {
        const a = Math.random() * Math.PI * 2;
        pt.vx += Math.cos(a) * 2.5;
        pt.vy += Math.sin(a) * 2.5 - 1.5;
      });
    }
    this.state = state;
    this._kick(true);
  }

  /** تغيير عرض الوعاء (0.3 - 0.95) */
  setContainerWidth(frac) {
    this.targetWidthFrac = frac;
    this._kick(true);
  }

  setPaused(p) {
    this.paused = p;
    this._kick(true);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
  }

  /* ---------- الحلقة ---------- */
  _kick(force = false) {
    if (!this.running && (this.visible || force)) {
      this.running = true;
      this.raf = requestAnimationFrame(this._loop);
    }
  }

  _loop(now) {
    if (!this.visible && !this.tween) {
      this._draw(); // صورة ثابتة حتى لا يبدو النموذج فارغًا قبل ظهوره
      this.running = false;
      return;
    }
    if (!this.paused) {
      this._updateTween(now);
      // تغيّر عرض الوعاء تدريجيًا
      if (Math.abs(this.widthFrac - this.targetWidthFrac) > 0.001) {
        this.widthFrac = lerp(this.widthFrac, this.targetWidthFrac, 0.08);
        this._box();
      }
      this._step();
      this._step();
    }
    this._draw();
    if (this.paused) {
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame(this._loop);
  }

  _updateTween(now) {
    if (!this.tween) return;
    const { from, to, start, duration } = this.tween;
    const t = Math.min(1, (now - start) / duration);
    const e = ease(t);
    KEYS.forEach((k) => (this.p[k] = lerp(from[k], to[k], e)));
    if (t >= 1) {
      this.tween = null;
    }
  }

  _step() {
    const { spring, gravity, jitter, damping, maxSpeed, gasSpeed } = this.p;
    const P = this.particles;
    const { l, r, t, b } = this.box;
    const R = this.r;
    const D = R * 2.02;

    for (const pt of P) {
      if (spring > 0) {
        pt.vx += (pt.hx - pt.x) * spring;
        pt.vy += (pt.hy - pt.y) * spring;
      }
      pt.vy += gravity;
      pt.vx += (Math.random() - 0.5) * jitter * 2;
      pt.vy += (Math.random() - 0.5) * jitter * 2;
      pt.vx *= damping;
      pt.vy *= damping;

      // الحفاظ على سرعة جسيمات الغاز
      if (gasSpeed > 0) {
        const s = Math.hypot(pt.vx, pt.vy) || 0.001;
        const k = lerp(1, gasSpeed / s, 0.04);
        pt.vx *= k;
        pt.vy *= k;
      }
      const s = Math.hypot(pt.vx, pt.vy);
      if (s > maxSpeed) {
        pt.vx = (pt.vx / s) * maxSpeed;
        pt.vy = (pt.vy / s) * maxSpeed;
      }
      pt.x += pt.vx * 0.5;
      pt.y += pt.vy * 0.5;
    }

    // تصادم الجسيمات (لا تتداخل). في الحالة الصلبة يتكفل النابض بترتيبها.
    const collide = 1 - Math.min(1, spring / 0.06);
    for (let i = 0; collide > 0 && i < P.length; i++) {
      const a = P[i];
      for (let j = i + 1; j < P.length; j++) {
        const c = P[j];
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < D * D && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const push = ((D - d) / 2) * collide;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push; a.y -= ny * push;
          c.x += nx * push; c.y += ny * push;
          // تبادل السرعة على خط التصادم (للغاز)
          const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rel < 0) {
            a.vx += rel * nx; a.vy += rel * ny;
            c.vx -= rel * nx; c.vy -= rel * ny;
          }
        }
      }
    }

    // تسوية سطح السائل: الجسيمات تنزلق من الأعمدة المرتفعة إلى المنخفضة
    if (gravity > 0.02) {
      const n = Math.max(1, Math.floor((r - l) / (R * 2)));
      const w = (r - l) / n;
      const counts = new Array(n).fill(0);
      const col = (pt) => Math.min(n - 1, Math.max(0, Math.floor((pt.x - l) / w)));
      for (const pt of P) counts[col(pt)]++;
      const k = (gravity / 0.11) * 0.35;
      for (const pt of P) {
        const c = col(pt);
        const left = c > 0 ? counts[c - 1] : Infinity;
        const right = c < n - 1 ? counts[c + 1] : Infinity;
        if (counts[c] > Math.min(left, right) + 1) pt.vx += left < right ? -k : k;
      }
    }

    // جدران الوعاء
    for (const pt of P) {
      if (pt.x < l + R) { pt.x = l + R; pt.vx = Math.abs(pt.vx); }
      if (pt.x > r - R) { pt.x = r - R; pt.vx = -Math.abs(pt.vx); }
      if (pt.y < t + R) { pt.y = t + R; pt.vy = Math.abs(pt.vy); }
      if (pt.y > b - R) { pt.y = b - R; pt.vy = -Math.abs(pt.vy) * 0.6; }
    }
  }

  _draw() {
    const g = this.ctx;
    const { l, r, t, b } = this.box;
    g.clearRect(0, 0, this.W, this.H);

    // جسم الوعاء الزجاجي
    const rad = Math.min(22, (r - l) * 0.12);
    const pad = 6;
    g.save();
    g.beginPath();
    g.moveTo(l - pad - 8, t - 10);
    g.lineTo(l - pad, t);
    g.lineTo(l - pad, b + pad - rad);
    g.quadraticCurveTo(l - pad, b + pad, l - pad + rad, b + pad);
    g.lineTo(r + pad - rad, b + pad);
    g.quadraticCurveTo(r + pad, b + pad, r + pad, b + pad - rad);
    g.lineTo(r + pad, t);
    g.lineTo(r + pad + 8, t - 10);
    const glass = g.createLinearGradient(l, 0, r, 0);
    glass.addColorStop(0, 'rgba(255,255,255,0.28)');
    glass.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    glass.addColorStop(1, 'rgba(255,255,255,0.22)');
    g.fillStyle = glass;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(210,240,255,0.85)';
    g.stroke();
    g.restore();

    // انعكاس جانبي
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.fillRect(l + 4, t + 14, 5, (b - t) * 0.65);

    // توهج حراري خفيف أثناء التحول
    if (this.tween && this.heat) {
      const k = 1 - Math.min(1, (performance.now() - this.tween.start) / this.tween.duration);
      g.fillStyle = this.heat > 0 ? `rgba(255,140,60,${0.18 * k})` : `rgba(90,180,255,${0.2 * k})`;
      g.fillRect(l - pad, t, r - l + pad * 2, b - t + pad);
    }

    // الجسيمات
    const spr = this.sprite;
    for (const pt of this.particles) {
      g.drawImage(spr.canvas, pt.x - spr.half, pt.y - spr.half);
    }
  }
}
