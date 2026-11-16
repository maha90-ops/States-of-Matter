/**
 * «ماذا سيحدث؟» — توقّع ← شاهد ← فسّر.
 * الطالب يختار توقعه، ثم تُعرض تجربة قصيرة متحركة، ثم يظهر التفسير.
 */
import { html, esc, prefersReducedMotion } from '../core/dom.js';
import { store } from '../core/store.js';
import { SCENARIOS } from '../data/extras.js';
import { playSfx } from './audioPlayer.js';
import { starBurst } from './effects.js';
import { createAudioButton } from './audioPlayer.js';

const ICE = `<svg viewBox="0 0 120 120" aria-hidden="true"><polygon points="60,12 106,36 60,60 14,36" fill="#e9fbff" stroke="#fff" stroke-width="2"/><polygon points="14,36 60,60 60,108 14,84" fill="#8fdcfb" stroke="#fff" stroke-width="2"/><polygon points="106,36 60,60 60,108 106,84" fill="#3fb7ee" stroke="#fff" stroke-width="2"/><path d="M24 48v20" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`;
const SUN = `<svg viewBox="0 0 120 120" aria-hidden="true"><g class="sc-rays" stroke="#f5b301" stroke-width="7" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => `<line x1="60" y1="8" x2="60" y2="22" transform="rotate(${i * 45} 60 60)"/>`).join('')}</g><circle cx="60" cy="60" r="30" fill="#ffd23f" stroke="#f5b301" stroke-width="4"/></svg>`;
const FLAME = `<svg viewBox="0 0 80 100" aria-hidden="true"><path d="M40 6C54 28 70 40 70 64a30 30 0 0 1-60 0C10 46 24 38 28 22c6 10 8 18 12-16z" fill="#ff7a1a"/><path d="M40 46c8 10 14 16 14 26a14 14 0 0 1-28 0c0-8 8-14 14-26z" fill="#ffe08a"/></svg>`;
const POT = (lid) => `<svg viewBox="0 0 160 120" aria-hidden="true">
  ${lid ? '<g><rect x="24" y="8" width="112" height="12" rx="6" fill="#8fd8f7" stroke="#2faee6" stroke-width="3"/><rect x="70" y="0" width="20" height="10" rx="4" fill="#2faee6"/></g>' : ''}
  <rect x="16" y="26" width="128" height="10" rx="5" fill="#9aa9c7"/>
  <path d="M24 34h112v54a22 22 0 0 1-22 22H46a22 22 0 0 1-22-22z" fill="#c4cfe6" stroke="#7d8cae" stroke-width="3"/>
  <rect x="2" y="44" width="22" height="9" rx="4.5" fill="#7d8cae"/><rect x="136" y="44" width="22" height="9" rx="4.5" fill="#7d8cae"/>
  <path class="sc-water" d="M30 54h100v34a18 18 0 0 1-18 18H48a18 18 0 0 1-18-18z" fill="#29b6f6"/></svg>`;

const scene = (k) => {
  if (k === 'sun') return `<div class="sc sc-sun" aria-hidden="true"><div class="sc-sunimg">${SUN}</div><div class="sc-ice">${ICE}</div><div class="sc-puddle"></div><div class="sc-ground"></div></div>`;
  if (k === 'fire') return `<div class="sc sc-fire" aria-hidden="true"><div class="sc-steam"><i></i><i></i><i></i><i></i></div><div class="sc-pot">${POT(false)}</div><div class="sc-flames">${FLAME}${FLAME}${FLAME}</div></div>`;
  return `<div class="sc sc-lid" aria-hidden="true"><div class="sc-pot">${POT(true)}</div><div class="sc-vapor"><i></i><i></i><i></i></div><div class="sc-drops"><i></i><i></i><i></i><i></i><i></i></div></div>`;
};

export function createScenarios({ onDone }) {
  const el = html(`
    <section class="scenarios glass" aria-labelledby="scn-title">
      <div class="disc-head">
        <span class="eyebrow">🤔 توقّع ← شاهد ← فسّر</span>
        <h2 id="scn-title">ماذا سيحدث؟</h2>
        <p>العالِم الذكي يتوقع أولًا، ثم يجرّب ليتحقق من توقعه!</p>
        <div class="disc-audio"></div>
      </div>
      <div class="scn-body"></div>
    </section>`);
  el.querySelector('.disc-audio').appendChild(createAudioButton('scenarios', 'استمع إلى التعليمات'));
  const box = el.querySelector('.scn-body');
  let i = 0;
  let right = 0;
  let timer;

  const show = () => {
    const s = SCENARIOS[i];
    box.innerHTML = `
      <p class="scn-count">الموقف ${(i + 1).toLocaleString('ar-EG')} من ${SCENARIOS.length.toLocaleString('ar-EG')}</p>
      <div class="scn-grid">
        <div class="scn-stage">${scene(s.scene)}<p class="scn-phase" aria-live="polite">١. توقّع ماذا سيحدث 🤔</p></div>
        <div class="scn-side">
          <h3 class="scn-text">${esc(s.text)}</h3>
          <div class="options" role="group" aria-label="توقّعك">
            ${s.options.map((o, k) => `<button type="button" class="option" data-k="${k}"><span class="option-emoji" aria-hidden="true">${o.emoji}</span><span class="option-text">${esc(o.text)}</span><span class="option-mark" aria-hidden="true"></span></button>`).join('')}
          </div>
          <div class="q-feedback" role="status"></div>
          <div class="scn-next"></div>
        </div>
      </div>`;
    const stage = box.querySelector('.sc');
    const phase = box.querySelector('.scn-phase');
    const fb = box.querySelector('.q-feedback');
    const btns = [...box.querySelectorAll('.option')];
    btns.forEach((b) => b.addEventListener('click', () => {
      const pick = s.options[+b.dataset.k];
      btns.forEach((x) => { x.disabled = true; });
      b.classList.add('chosen');
      b.querySelector('.option-mark').textContent = '🤔';
      phase.textContent = '٢. شاهد ماذا يحدث فعلًا 👀';
      stage.classList.add('play');
      timer = setTimeout(() => {
        phase.textContent = '٣. فسّر ما حدث 💡';
        const c = btns[s.options.findIndex((o) => o.correct)];
        c.classList.add('correct', 'reveal');
        c.querySelector('.option-mark').textContent = '✓';
        if (pick.correct) {
          right++;
          store.correct(`scenario:${s.id}`);
          fb.className = 'q-feedback ok';
          fb.innerHTML = `<strong>توقعك صحيح! 🎉</strong><span>${esc(s.explain)}</span>`;
          starBurst(c);
          playSfx('correct');
        } else {
          b.classList.add('wrong');
          b.querySelector('.option-mark').textContent = '✗';
          fb.className = 'q-feedback info';
          fb.innerHTML = `<strong>لاحظ ماذا حدث فعلًا 💡</strong><span>${esc(s.explain)} العلماء يتعلمون من التجربة حتى عندما يخطئ توقعهم!</span>`;
        }
        const last = i === SCENARIOS.length - 1;
        const nb = html(`<button type="button" class="btn btn-primary">${last ? 'أنهيت المواقف 🎉' : 'الموقف التالي ⬅️'}</button>`);
        box.querySelector('.scn-next').appendChild(nb);
        nb.addEventListener('click', () => { if (last) finish(); else { i++; show(); } });
        nb.focus({ preventScroll: true });
      }, prefersReducedMotion() ? 300 : 3200);
    }));
  };

  const finish = () => {
    store.awardOnce('scenarios:done', 20, 1, 'إكمال مواقف «ماذا سيحدث؟»');
    box.innerHTML = `
      <div class="scn-summary">
        <p class="scn-big">🧪 توقعتَ ${right.toLocaleString('ar-EG')} من ${SCENARIOS.length.toLocaleString('ar-EG')} بشكل صحيح</p>
        <p>التسخين 🔥: انصهار وتبخر — التبريد ❄️: تكاثف وتجمد.</p>
        <button type="button" class="btn btn-ghost" data-again>🔄 أعد المواقف</button>
      </div>`;
    box.querySelector('[data-again]').addEventListener('click', () => { i = 0; right = 0; show(); });
    onDone?.();
  };

  show();
  el.destroy = () => clearTimeout(timer);
  return el;
}
