/**
 * شهادة الإنجاز: تُعرض في الصفحة، ويمكن حفظها كصورة PNG عالية الدقة أو طباعتها.
 */
import { html, esc, num } from '../core/dom.js';
import { store } from '../core/store.js';
import { IMG } from '../data/config.js';

const TITLE = '🏆 شهادة مستكشف حالات المادة';
const BODY = 'تهانينا! لقد أتممت رحلة التعلم في عالم حالات المادة بنجاح.';
const BLANK = '__________';

const today = () =>
  new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

const molecule = (cls) => `
  <svg class="cert-mol ${cls}" viewBox="0 0 60 60" aria-hidden="true">
    <line x1="15" y1="40" x2="30" y2="20" /><line x1="30" y1="20" x2="47" y2="38" />
    <circle cx="15" cy="40" r="8" /><circle cx="30" cy="20" r="10" /><circle cx="47" cy="38" r="7" />
  </svg>`;

export function createCertificate({ score, max, stars }) {
  const s = store.get();
  const el = html(`
    <section class="cert-wrap" aria-labelledby="cert-title">
      <label class="cert-name-field">
        <span>✍️ اكتب اسمك ليظهر على الشهادة:</span>
        <input type="text" class="cert-input" maxlength="32" autocomplete="name" placeholder="اسم المستكشف" value="${esc(s.name)}">
      </label>

      <div class="certificate" id="certificate">
        <div class="cert-border">
          ${molecule('m1')}${molecule('m2')}
          <span class="cert-star s1" aria-hidden="true">⭐</span>
          <span class="cert-star s2" aria-hidden="true">⭐</span>
          <span class="cert-star s3" aria-hidden="true">✨</span>
          <img class="cert-hero" src="${IMG.avatar}" alt="العالِم الصغير يرتدي معطف المختبر ونظارات الحماية" loading="lazy">
          <div class="cert-medal" aria-hidden="true"><span>🧪</span></div>
          <h2 class="cert-title" id="cert-title">${TITLE}</h2>
          <p class="cert-body">${BODY}</p>
          <p class="cert-name">اسم المستكشف: <strong class="cert-name-value">${esc(s.name) || BLANK}</strong></p>
          <div class="cert-stats">
            <span>🎯 النتيجة: <strong>${num(score)} من ${num(max)}</strong></span>
            <span>⭐ النجوم: <strong>${num(stars)}</strong></span>
            <span>التاريخ: ${today()}</span>
          </div>
          <div class="cert-ribbon">رحلة في عالم حالات المادة</div>
        </div>
      </div>

      <div class="cert-actions">
        <button type="button" class="btn btn-primary btn-save">📥 حفظ الشهادة</button>
        <button type="button" class="btn btn-secondary btn-print">🖨️ طباعة الشهادة</button>
      </div>
      <p class="cert-tip">تُحفظ الشهادة كصورة عالية الدقة مناسبة للطباعة. ويمكنك أيضًا اختيار "حفظ بصيغة PDF" من نافذة الطباعة.</p>
    </section>`);

  const input = el.querySelector('.cert-input');
  const nameEl = el.querySelector('.cert-name-value');
  input.addEventListener('input', () => {
    const v = input.value.trim();
    nameEl.textContent = v || BLANK;
    store.setName(v);
  });

  el.querySelector('.btn-print').addEventListener('click', () => {
    document.body.classList.add('printing-cert');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-cert'), 500);
  });

  el.querySelector('.btn-save').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = '⏳ جارٍ التجهيز...';
    try {
      const url = await drawCertificatePNG({ name: input.value.trim(), score, max, stars });
      const a = document.createElement('a');
      a.href = url;
      a.download = `شهادة-مستكشف-حالات-المادة${input.value.trim() ? '-' + input.value.trim() : ''}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      btn.disabled = false;
      btn.textContent = '📥 حفظ الشهادة';
    }
  });

  return el;
}

/* ---------- رسم الشهادة كصورة (A4 أفقي) ---------- */
function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function drawMolecule(g, x, y, s, color) {
  const pts = [[x, y + 20 * s], [x + 15 * s, y], [x + 32 * s, y + 18 * s]];
  g.strokeStyle = color;
  g.lineWidth = 4 * s;
  g.beginPath();
  g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.lineTo(...pts[2]);
  g.stroke();
  [[8, 0], [10, 1], [7, 2]].forEach(([r, i]) => {
    const [px, py] = pts[i];
    const gr = g.createRadialGradient(px - r * s * 0.3, py - r * s * 0.3, 1, px, py, r * s);
    gr.addColorStop(0, '#e1f5fe');
    gr.addColorStop(0.4, color);
    gr.addColorStop(1, '#0d47a1');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(px, py, r * s, 0, Math.PI * 2);
    g.fill();
  });
}

async function drawCertificatePNG({ name, score, max, stars }) {
  await document.fonts?.ready;
  const W = 2480;
  const H = 1754;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.direction = 'rtl';
  const font = (w, size) => `${w} ${size}px "Baloo Bhaijaan 2", "Tajawal", sans-serif`;

  // خلفية
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#e3f6ff');
  bg.addColorStop(1, '#d4f1f4');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // إطار ذهبي
  const gold = g.createLinearGradient(0, 0, W, H);
  gold.addColorStop(0, '#f9d976');
  gold.addColorStop(0.5, '#e6a817');
  gold.addColorStop(1, '#f9d976');
  roundRect(g, 70, 70, W - 140, H - 140, 70);
  g.fillStyle = gold;
  g.fill();
  roundRect(g, 100, 100, W - 200, H - 200, 52);
  g.fillStyle = '#fffaf0';
  g.fill();
  roundRect(g, 130, 130, W - 260, H - 260, 40);
  g.strokeStyle = 'rgba(230,168,23,.55)';
  g.lineWidth = 5;
  g.setLineDash([18, 14]);
  g.stroke();
  g.setLineDash([]);

  // زخارف
  drawMolecule(g, 230, 230, 5, '#29b6f6');
  drawMolecule(g, 560, H - 300, 3, '#26c6da');
  drawMolecule(g, W - 420, H - 420, 5, '#26c6da');
  g.font = '110px serif';
  g.textAlign = 'center';
  [[W - 280, 300], [W - 460, 230], [W - 300, H - 520]].forEach(([x, y]) => g.fillText('⭐', x, y));

  // صورة الشخصية
  try {
    const hero = await loadImage(IMG.avatar);
    g.save();
    g.beginPath();
    g.arc(340, H - 360, 170, 0, Math.PI * 2);
    g.closePath();
    g.lineWidth = 18;
    g.strokeStyle = '#f2c14e';
    g.stroke();
    g.clip();
    g.drawImage(hero, 170, H - 530, 340, 340);
    g.restore();
  } catch (_) { /* تجاهل */ }

  // الميدالية
  const mx = W / 2;
  const medal = g.createRadialGradient(mx - 30, 300, 10, mx, 330, 120);
  medal.addColorStop(0, '#fff6c8');
  medal.addColorStop(0.5, '#f5c33b');
  medal.addColorStop(1, '#c98b0b');
  g.fillStyle = medal;
  g.beginPath();
  g.arc(mx, 330, 115, 0, Math.PI * 2);
  g.fill();
  g.font = '130px serif';
  g.fillText('🧪', mx, 378);

  // النصوص
  g.fillStyle = '#0b4f7c';
  g.font = font(800, 150);
  g.fillText('شهادة مستكشف حالات المادة 🏆', mx, 640);

  g.fillStyle = '#21506b';
  g.font = font(500, 76);
  g.fillText('تهانينا! لقد أتممت رحلة التعلم في عالم حالات المادة بنجاح.', mx, 820);

  g.font = font(700, 96);
  g.fillStyle = '#0b4f7c';
  g.fillText(`اسم المستكشف: ${name || BLANK}`, mx, 1010);

  g.font = font(600, 64);
  g.fillStyle = '#2a6f97';
  g.fillText(`🎯 النتيجة: ${num(score)} من ${num(max)}     ⭐ النجوم: ${num(stars)}     التاريخ: ${today()}`, mx, 1170);

  // الشريط
  const rw = 1200;
  const rx = mx - rw / 2;
  const ribbon = g.createLinearGradient(rx, 0, rx + rw, 0);
  ribbon.addColorStop(0, '#0288d1');
  ribbon.addColorStop(1, '#26c6da');
  roundRect(g, rx, 1300, rw, 130, 65);
  g.fillStyle = ribbon;
  g.fill();
  g.fillStyle = '#fff';
  g.font = font(700, 68);
  g.fillText('رحلة في عالم حالات المادة', mx, 1387);

  return c.toDataURL('image/png');
}
