/**
 * تجربة: الكمية نفسها من الماء في أوعية مختلفة.
 * يُحسب مستوى الماء رياضيًا بحيث تبقى المساحة (الحجم) ثابتة في كل وعاء،
 * فيلاحظ الطالب أن الشكل يتغيّر بينما الكمية لا تتغيّر.
 */
import { html, esc, prefersReducedMotion, announce } from '../core/dom.js';

/* أشكال الأوعية (مضلعات في نظام إحداثيات 300×260) */
const CONTAINERS = [
  {
    id: 'glass',
    name: 'كأس طويل',
    emoji: '🥛',
    poly: [[112, 30], [188, 30], [184, 240], [116, 240]],
  },
  {
    id: 'bowl',
    name: 'وعاء عريض',
    emoji: '🥣',
    poly: [[22, 140], [278, 140], [262, 190], [236, 222], [196, 240], [104, 240], [64, 222], [38, 190]],
  },
  {
    id: 'flask',
    name: 'دورق مخروطي',
    emoji: '⚗️',
    poly: [[134, 30], [166, 30], [166, 112], [232, 240], [68, 240], [134, 112]],
  },
];

const WATER_AREA = 10400; // "حجم" الماء الثابت

/** مساحة مضلع */
function area(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

/** قص المضلع ليبقى الجزء الواقع تحت المستوى y >= level */
function clipBelow(poly, level) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const pin = p[1] >= level;
    const qin = q[1] >= level;
    if (pin) out.push(p);
    if (pin !== qin) {
      const t = (level - p[1]) / (q[1] - p[1]);
      out.push([p[0] + (q[0] - p[0]) * t, level]);
    }
  }
  return out;
}

/** إيجاد مستوى الماء الذي يحقق المساحة المطلوبة (بحث ثنائي) */
function levelFor(poly, target) {
  let lo = Math.min(...poly.map((p) => p[1]));
  let hi = Math.max(...poly.map((p) => p[1]));
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (area(clipBelow(poly, mid)) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const pts = (poly) => poly.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');

export function createContainerExperiment() {
  const el = html(`
    <section class="experiment glass" aria-labelledby="exp-title">
      <div class="experiment-head">
        <span class="badge">🧪 تجربة</span>
        <h3 id="exp-title">الكمية نفسها من الماء… في أوعية مختلفة!</h3>
        <p>اختر وعاءً لنسكب فيه الكمية نفسها من الماء، ثم لاحظ ما الذي يتغيّر وما الذي يبقى كما هو.</p>
      </div>
      <div class="experiment-stage">
        <svg viewBox="0 0 300 260" class="exp-svg" role="img" aria-labelledby="exp-desc">
          <desc id="exp-desc">وعاء زجاجي يُسكب فيه الماء</desc>
          <defs>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#7fe3ff"/>
              <stop offset="1" stop-color="#1e88e5"/>
            </linearGradient>
            <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="rgba(255,255,255,.45)"/>
              <stop offset=".5" stop-color="rgba(255,255,255,.08)"/>
              <stop offset="1" stop-color="rgba(255,255,255,.35)"/>
            </linearGradient>
          </defs>
          <rect class="exp-stream" x="146" y="0" width="8" height="0" rx="4" fill="url(#waterGrad)"/>
          <polygon class="exp-glass" fill="url(#glassGrad)"/>
          <polygon class="exp-water" fill="url(#waterGrad)" opacity=".92"/>
          <polyline class="exp-surface" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3" stroke-linecap="round"/>
          <polygon class="exp-outline" fill="none" stroke="#d6f3ff" stroke-width="4" stroke-linejoin="round"/>
        </svg>
        <div class="exp-readout" aria-live="polite">
          <div class="readout-row"><span class="readout-ico" aria-hidden="true">⚖️</span><span>كمية الماء:</span> <strong>كوب واحد</strong> <span class="pill pill-same">✔ لم تتغيّر</span></div>
          <div class="readout-row"><span class="readout-ico" aria-hidden="true">🫙</span><span>شكل الماء:</span> <strong class="exp-shape">—</strong> <span class="pill pill-change">↻ يتغيّر</span></div>
        </div>
      </div>
      <div class="exp-choices" role="group" aria-label="اختر الوعاء">
        ${CONTAINERS.map((c) => `
          <button type="button" class="exp-choice" data-id="${c.id}" aria-pressed="false">
            <span aria-hidden="true">${c.emoji}</span> ${esc(c.name)}
          </button>`).join('')}
      </div>
      <p class="exp-conclusion" hidden>💡 <strong>استنتاج:</strong> الماء أخذ شكل كل وعاء، لكن كميته بقيت كما هي. لذلك نقول: للسائل حجم ثابت، وشكله يتغيّر حسب الوعاء.</p>
    </section>`);

  const $ = (s) => el.querySelector(s);
  const glass = $('.exp-glass');
  const outline = $('.exp-outline');
  const water = $('.exp-water');
  const surface = $('.exp-surface');
  const stream = $('.exp-stream');
  const shape = $('.exp-shape');
  const tried = new Set();
  let raf;

  const drawWater = (poly, a) => {
    if (a <= 1) {
      water.setAttribute('points', '');
      surface.setAttribute('points', '');
      return;
    }
    const lv = levelFor(poly, a);
    const w = clipBelow(poly, lv);
    water.setAttribute('points', pts(w));
    const top = w.filter((p) => Math.abs(p[1] - lv) < 0.01).map((p) => p[0]);
    if (top.length >= 2) {
      surface.setAttribute('points', `${Math.min(...top) + 3},${lv} ${Math.max(...top) - 3},${lv}`);
    }
    return lv;
  };

  const choose = (id) => {
    const c = CONTAINERS.find((x) => x.id === id);
    el.querySelectorAll('.exp-choice').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    glass.setAttribute('points', pts(c.poly));
    outline.setAttribute('points', pts(c.poly));
    shape.textContent = `يأخذ شكل ${c.name}`;
    $('#exp-desc').textContent = `${c.name} فيه كوب واحد من الماء. الماء أخذ شكل ${c.name}.`;
    tried.add(id);
    if (tried.size >= 2) $('.exp-conclusion').hidden = false;

    cancelAnimationFrame(raf);
    if (prefersReducedMotion()) {
      drawWater(c.poly, WATER_AREA);
      return;
    }
    const start = performance.now();
    const dur = 1300;
    const topY = Math.min(...c.poly.map((p) => p[1]));
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 2);
      const lv = drawWater(c.poly, WATER_AREA * e) ?? 240;
      // تيار الماء المنسكب من الأعلى
      if (t < 0.92) {
        stream.setAttribute('y', topY - 30);
        stream.setAttribute('height', Math.max(0, lv - topY + 30));
      } else {
        stream.setAttribute('height', 0);
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    announce(`سكبنا كوبًا واحدًا من الماء في ${c.name}.`);
  };

  el.querySelector('.exp-choices').addEventListener('click', (e) => {
    const b = e.target.closest('.exp-choice');
    if (b) choose(b.dataset.id);
  });

  // البداية بالكأس الطويل بدون إظهار الاستنتاج
  requestAnimationFrame(() => {
    choose('glass');
    tried.clear();
    tried.add('glass');
  });

  el.destroy = () => cancelAnimationFrame(raf);
  return el;
}
