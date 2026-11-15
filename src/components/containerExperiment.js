/**
 * تجربة: الكمية نفسها من الماء في أوعية مختلفة.
 * - يُحسب مستوى الماء رياضيًا بحيث تبقى المساحة (الحجم) ثابتة في كل وعاء.
 * - تدريج بالمليلتر يُظهر أن الكمية 200 مل في كل وعاء.
 * - زر "أظهر الجسيمات" يعرض العدد نفسه من الجسيمات وهي تنزلق وتملأ شكل الوعاء،
 *   فيربط الطالب بين ما يراه بعينه وما يحدث للجسيمات.
 */
import { html, esc, prefersReducedMotion, announce, num } from '../core/dom.js';

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

const WATER_AREA = 10400; // "حجم" الماء الثابت (يقابل 200 مل)
const WATER_ML = 200;
const MARKS = [100, 200]; // خطوط التدريج بالمليلتر
const PARTICLES = 30; // عدد الجسيمات ثابت في كل الأوعية
const PR = 6.5; // نصف قطر الجسيم

/* ---------- هندسة المضلعات ---------- */
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

/** مستوى الماء الذي يحقق المساحة المطلوبة (بحث ثنائي) */
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

/** حدود الوعاء (يسار/يمين) عند مستوى معيّن */
function widthAt(poly, level) {
  const xs = clipBelow(poly, level).filter((p) => Math.abs(p[1] - level) < 0.01).map((p) => p[0]);
  return xs.length >= 2 ? [Math.min(...xs), Math.max(...xs)] : null;
}

function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/**
 * توزيع العدد نفسه من الجسيمات داخل الماء على شبكة سداسية.
 * نختار أكبر تباعد يسمح بوضع كل الجسيمات تحت سطح الماء، فتملأ الجسيمات شكل الماء كله.
 */
function particleSlots(poly, level) {
  const fits = (x, y) =>
    [[0, 0], [PR, 0], [-PR, 0], [0, PR], [0, -PR]].every(([dx, dy]) => inside(poly, x + dx, y + dy));
  const grid = (s) => {
    const out = [];
    const h = s * 0.87;
    for (let row = 0, y = 240 - PR - 1.5; y >= level + PR * 0.4; row++, y -= h) {
      for (let x = (row % 2) * (s / 2); x < 300; x += s) if (fits(x, y)) out.push([x, y]);
    }
    return out;
  };
  let best = grid(PR * 2.05);
  for (let s = PR * 2.05; s < PR * 5; s += 0.25) {
    const g = grid(s);
    if (g.length < PARTICLES) break;
    best = g;
  }
  return best.sort((a, b) => b[1] - a[1] || Math.abs(a[0] - 150) - Math.abs(b[0] - 150)).slice(0, PARTICLES);
}

const pts = (poly) => poly.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
const PHASES = Array.from({ length: PARTICLES }, () => [Math.random() * 6.28, 0.6 + Math.random() * 0.8]);

export function createContainerExperiment() {
  const el = html(`
    <section class="experiment glass" aria-labelledby="exp-title">
      <div class="experiment-head">
        <span class="badge">🧪 تجربة</span>
        <h3 id="exp-title">الكمية نفسها من الماء… في أوعية مختلفة!</h3>
        <p>اختر وعاءً لنسكب فيه ${num(WATER_ML)} مل من الماء، ثم لاحظ ما الذي يتغيّر وما الذي يبقى كما هو. اضغط على <strong>🔬 أظهر الجسيمات</strong> لترى ماذا تفعل جسيمات الماء.</p>
      </div>
      <div class="experiment-stage">
        <div class="exp-visual">
          <svg viewBox="-24 0 354 260" class="exp-svg" role="img" aria-labelledby="exp-desc">
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
              <radialGradient id="ballGrad" cx=".35" cy=".3" r=".75">
                <stop offset="0" stop-color="#e8f8ff"/>
                <stop offset=".35" stop-color="#4fc3f7"/>
                <stop offset=".85" stop-color="#0277bd"/>
                <stop offset="1" stop-color="#01579b"/>
              </radialGradient>
            </defs>
            <rect class="exp-stream" x="146" y="0" width="8" height="0" rx="4" fill="url(#waterGrad)"/>
            <polygon class="exp-glass" fill="url(#glassGrad)"/>
            <polygon class="exp-water" fill="url(#waterGrad)" opacity=".92"/>
            <polyline class="exp-surface" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3" stroke-linecap="round"/>
            <g class="exp-particles" aria-hidden="true">
              ${Array.from({ length: PARTICLES }, () => `<circle r="${PR}" fill="url(#ballGrad)" opacity="0"/>`).join('')}
            </g>
            <polygon class="exp-outline" fill="none" stroke="#d6f3ff" stroke-width="4" stroke-linejoin="round"/>
            <g class="exp-marks" aria-hidden="true"></g>
          </svg>
          <button type="button" class="btn btn-small btn-ghost exp-toggle" aria-pressed="false">🔬 أظهر الجسيمات</button>
        </div>
        <div class="exp-readout" aria-live="polite">
          <div class="readout-row"><span class="readout-ico" aria-hidden="true">⚖️</span><span>كمية الماء:</span> <strong>${num(WATER_ML)} مل</strong> <span class="pill pill-same">✔ لم تتغيّر</span></div>
          <div class="readout-row"><span class="readout-ico" aria-hidden="true">🫙</span><span>شكل الماء:</span> <strong class="exp-shape">—</strong> <span class="pill pill-change">↻ يتغيّر</span></div>
          <div class="readout-row exp-count" hidden><span class="readout-ico" aria-hidden="true">⚛️</span><span>عدد الجسيمات:</span> <strong>${num(PARTICLES)}</strong> <span class="pill pill-same">✔ لم يتغيّر</span></div>
        </div>
      </div>
      <div class="exp-choices" role="group" aria-label="اختر الوعاء">
        ${CONTAINERS.map((c) => `
          <button type="button" class="exp-choice" data-id="${c.id}" aria-pressed="false">
            <span aria-hidden="true">${c.emoji}</span> ${esc(c.name)}
          </button>`).join('')}
      </div>
      <p class="exp-conclusion" hidden>💡 <strong>استنتاج:</strong> الماء أخذ شكل كل وعاء، لكن كميته بقيت ${num(WATER_ML)} مل، وعدد جسيماته لم يتغيّر. الجسيمات تنزلق بجانب بعضها فتملأ شكل الوعاء. لذلك نقول: للسائل حجم ثابت، وشكله يتغيّر حسب الوعاء.</p>
    </section>`);

  const $ = (s) => el.querySelector(s);
  const water = $('.exp-water');
  const surface = $('.exp-surface');
  const stream = $('.exp-stream');
  const circles = [...el.querySelectorAll('.exp-particles circle')];
  const toggle = $('.exp-toggle');
  const reduced = prefersReducedMotion();
  const tried = new Set();
  let current = null; // { c, slots, level }
  let showParticles = false;
  let pourRaf;
  let jiggleRaf;
  let visible = true;

  /* ----- الماء ----- */
  const drawWater = (poly, a) => {
    if (a <= 1) {
      water.setAttribute('points', '');
      surface.setAttribute('points', '');
      return 241;
    }
    const lv = levelFor(poly, a);
    water.setAttribute('points', pts(clipBelow(poly, lv)));
    const w = widthAt(poly, lv);
    if (w) surface.setAttribute('points', `${w[0] + 3},${lv} ${w[1] - 3},${lv}`);
    return lv;
  };

  /* ----- التدريج بالمليلتر ----- */
  const drawMarks = (poly) => {
    $('.exp-marks').innerHTML = MARKS.map((ml) => {
      const lv = levelFor(poly, (WATER_AREA * ml) / WATER_ML);
      const w = widthAt(poly, lv);
      if (!w) return '';
      const x = w[1];
      return `
        <line x1="${x - 10}" y1="${lv}" x2="${x + 4}" y2="${lv}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
        <text x="${x + 8}" y="${lv + 4}" fill="#e6f7ff" font-size="12" font-weight="700" text-anchor="end" direction="rtl">${num(ml)} مل</text>`;
    }).join('');
  };

  /* ----- الجسيمات ----- */
  const paintParticles = (level, t = 0) => {
    if (!current) return;
    current.slots.forEach(([x, y], i) => {
      const c = circles[i];
      const on = showParticles && y >= level - PR;
      const [ph, sp] = PHASES[i];
      // حركة انزلاق صغيرة: جسيمات السائل تتحرك وتنزلق بجانب بعضها
      const dx = reduced ? 0 : Math.sin(t * 0.0021 * sp + ph) * 2.4;
      const dy = reduced ? 0 : Math.cos(t * 0.0017 * sp + ph * 1.3) * 1.3;
      c.setAttribute('cx', (x + dx).toFixed(1));
      c.setAttribute('cy', (y + dy).toFixed(1));
      c.setAttribute('opacity', on ? '1' : '0');
    });
  };

  const jiggle = (t) => {
    cancelAnimationFrame(jiggleRaf);
    if (!showParticles || !visible || reduced || !el.isConnected) return;
    paintParticles(current.level, t);
    jiggleRaf = requestAnimationFrame(jiggle);
  };

  toggle.addEventListener('click', () => {
    showParticles = !showParticles;
    toggle.setAttribute('aria-pressed', String(showParticles));
    toggle.textContent = showParticles ? '💧 أخفِ الجسيمات' : '🔬 أظهر الجسيمات';
    el.classList.toggle('show-particles', showParticles);
    $('.exp-count').hidden = !showParticles;
    paintParticles(current?.level ?? 241, performance.now());
    if (showParticles) {
      jiggleRaf = requestAnimationFrame(jiggle);
      announce(`نرى الآن ${PARTICLES} جسيمًا من جسيمات الماء، وهي تنزلق وتملأ شكل الوعاء.`);
    }
  });

  /* ----- اختيار الوعاء ----- */
  const choose = (id) => {
    const c = CONTAINERS.find((x) => x.id === id);
    el.querySelectorAll('.exp-choice').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    $('.exp-glass').setAttribute('points', pts(c.poly));
    $('.exp-outline').setAttribute('points', pts(c.poly));
    $('.exp-shape').textContent = `يأخذ شكل ${c.name}`;
    $('#exp-desc').textContent = `${c.name} فيه ${WATER_ML} مل من الماء. الماء أخذ شكل ${c.name}.`;
    tried.add(id);
    if (tried.size >= 2) $('.exp-conclusion').hidden = false;

    const finalLevel = levelFor(c.poly, WATER_AREA);
    current = { c, slots: particleSlots(c.poly, finalLevel), level: finalLevel };
    drawMarks(c.poly);

    cancelAnimationFrame(pourRaf);
    if (reduced) {
      drawWater(c.poly, WATER_AREA);
      paintParticles(finalLevel);
      return;
    }
    const start = performance.now();
    const dur = 1300;
    const topY = Math.min(...c.poly.map((p) => p[1]));
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 2);
      const lv = drawWater(c.poly, WATER_AREA * e);
      current.level = lv;
      if (!showParticles || reduced) paintParticles(lv, now);
      // تيار الماء المنسكب من الأعلى
      stream.setAttribute('y', topY - 30);
      stream.setAttribute('height', t < 0.92 ? Math.max(0, lv - topY + 30) : 0);
      if (t < 1) pourRaf = requestAnimationFrame(tick);
      else current.level = finalLevel;
    };
    pourRaf = requestAnimationFrame(tick);
    announce(`سكبنا ${WATER_ML} مل من الماء في ${c.name}.`);
  };

  el.querySelector('.exp-choices').addEventListener('click', (e) => {
    const b = e.target.closest('.exp-choice');
    if (b) choose(b.dataset.id);
  });

  // إيقاف الحركة عندما تكون التجربة خارج الشاشة
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && showParticles) jiggleRaf = requestAnimationFrame(jiggle);
  });
  io.observe(el);

  // البداية بالكأس الطويل بدون إظهار الاستنتاج
  requestAnimationFrame(() => {
    choose('glass');
    tried.clear();
    tried.add('glass');
  });

  el.destroy = () => {
    cancelAnimationFrame(pourRaf);
    cancelAnimationFrame(jiggleRaf);
    io.disconnect();
  };
  return el;
}
