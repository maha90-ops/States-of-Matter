/**
 * مختبر الحرارة الموجّه: الطالب يسخّن ويبرّد ويلاحظ أولًا،
 * ثم يُسأل «ماذا حدث؟»، وبعد إجابته يظهر اسم التحول.
 * المصطلح لا يُعرض قبل أن يكتشف الطالب الظاهرة بنفسه.
 */
import { html, esc, announce, prefersReducedMotion } from '../core/dom.js';
import { store } from '../core/store.js';
import { DISCOVERY_TASKS } from '../data/extras.js';
import { TRANSITIONS, STATE_LABELS } from '../data/transitions.js';
import { ThermoSim, describeSim } from './thermoSim.js';
import { renderQuestion } from './question.js';
import { starBurst } from './effects.js';
import { createAudioButton } from './audioPlayer.js';

const T = Object.fromEntries(TRANSITIONS.map((t) => [t.id, t]));
const heatWord = (v) => (v < 20 ? 'باردة جدًا ❄️' : v < 40 ? 'باردة' : v < 64 ? 'دافئة' : v < 80 ? 'ساخنة' : 'ساخنة جدًا 🔥');

export function createDiscoveryLab({ onDone }) {
  const done = store.get().awarded.includes('discovery:done');
  const found = new Set(done ? DISCOVERY_TASKS.map((t) => t.term) : []);

  const el = html(`
    <section class="discovery glass" aria-labelledby="disc-title">
      <div class="disc-head">
        <span class="eyebrow">🧪 جرّب بنفسك</span>
        <h2 id="disc-title">مختبر الحرارة: لاحظ أولًا، ثم سمِّ ما حدث</h2>
        <p>سخّن وبرّد بنفسك، وراقب الجسيمات جيدًا. لن نخبرك باسم التحول حتى تكتشفه أنت!</p>
        <div class="disc-audio"></div>
      </div>
      <div class="disc-grid">
        <div class="disc-lab">
          <div class="disc-beaker" style="--heat:0">
            <div class="disc-thermo" aria-hidden="true"><div class="disc-thermo-tube"><span></span></div><div class="disc-thermo-bulb"></div></div>
            <div class="sim-canvas-wrap disc-sim" style="--sim-h:300px">
              <canvas class="sim-canvas" role="img"></canvas>
              <span class="sim-label" data-now>🧊 صلب</span>
            </div>
            <div class="disc-burner" aria-hidden="true"><span class="disc-flame">🔥</span><span class="disc-frost">❄️</span></div>
          </div>
        </div>
        <div class="disc-side">
          <div class="disc-task">
            <p class="disc-step" data-step></p>
            <p class="disc-instr" data-instr></p>
          </div>
          <div class="disc-ctrl">
            <button type="button" class="btn btn-cool" data-act="cool">❄️ برّد</button>
            <button type="button" class="btn btn-warm" data-act="heat">🔥 سخّن</button>
            <div class="disc-range"><label class="sr-only" for="disc-temp">درجة الحرارة</label><input type="range" class="temp-range" id="disc-temp" min="0" max="100" value="5"></div>
          </div>
          <div class="disc-q"></div>
          <div class="disc-term"></div>
        </div>
      </div>
      <div class="disc-path" aria-label="التحولات التي اكتشفتها"></div>
    </section>`);

  el.querySelector('.disc-audio').appendChild(createAudioButton('discovery', 'استمع إلى التعليمات'));
  const canvas = el.querySelector('canvas');
  const range = el.querySelector('#disc-temp');
  const beaker = el.querySelector('.disc-beaker');
  const qSlot = el.querySelector('.disc-q');
  const termSlot = el.querySelector('.disc-term');
  const btnHeat = el.querySelector('[data-act="heat"]');
  const btnCool = el.querySelector('[data-act="cool"]');
  const sim = new ThermoSim(canvas, { mode: 'auto', cols: 7, rows: 5, temperature: 5 });
  let idx = done ? DISCOVERY_TASKS.length : 0;
  let waiting = false;
  let reachedAt = 0;
  let last = '';

  const paintPath = () => {
    const chip = (id) => {
      const t = T[id];
      const on = found.has(id);
      return `<span class="disc-chip ${t.heat ? 'warm' : 'cool'} ${on ? 'on' : ''}">${t.heat ? '🔥' : '❄️'} ${on ? t.name : '؟'}<span class="sr-only">${on ? '' : ' لم يُكتشف بعد'}</span></span>`;
    };
    el.querySelector('.disc-path').innerHTML = `
      <span class="disc-node">🧊 صلب</span>
      <span class="disc-pair">${chip('melting')}${chip('freezing')}</span>
      <span class="disc-node">💧 سائل</span>
      <span class="disc-pair">${chip('evaporation')}${chip('condensation')}</span>
      <span class="disc-node">💨 غاز</span>`;
  };

  const majority = () => ['solid', 'liquid', 'gas'].map((s) => [s, sim.targetFraction(s)]).sort((a, b) => b[1] - a[1])[0][0];

  const setTemp = (v) => {
    const t = DISCOVERY_TASKS[idx];
    v = Math.round(Math.max(t ? t.min : 0, Math.min(t ? t.max : 100, v)));
    range.value = v;
    sim.setTemperature(v);
    range.setAttribute('aria-valuetext', `درجة الحرارة ${heatWord(v)}`);
    beaker.style.setProperty('--heat', String(v / 100));
    beaker.classList.toggle('hot', v >= 45);
    beaker.classList.toggle('cold', v < 25);
  };

  const lock = (on) => { [range, btnHeat, btnCool].forEach((c) => { c.disabled = on; }); };

  const renderTask = () => {
    const step = el.querySelector('[data-step]');
    const instr = el.querySelector('[data-instr]');
    if (idx >= DISCOVERY_TASKS.length) {
      step.textContent = '🏆 اكتشفتَ التحولات الأربعة!';
      instr.textContent = 'جرّب التسخين والتبريد بحرية كما تحب.';
      range.min = 0; range.max = 100;
      lock(false);
      return;
    }
    const t = DISCOVERY_TASKS[idx];
    step.textContent = `🧪 التجربة ${(idx + 1).toLocaleString('ar-EG')} من ${DISCOVERY_TASKS.length.toLocaleString('ar-EG')}`;
    instr.textContent = t.instr;
    range.min = t.min; range.max = t.max;
    setTemp(t.start ?? +range.value);
    lock(false);
    reachedAt = 0;
  };

  const ask = () => {
    waiting = true;
    lock(true);
    const t = DISCOVERY_TASKS[idx];
    qSlot.replaceChildren(renderQuestion({
      id: `disc-${t.term}`, type: 'mcq', prompt: '👀 توقّف! ماذا حدث للمادة؟', options: t.options, hint: t.hint,
      explain: 'لاحظتَ ذلك بنفسك!',
    }, { mode: 'practice', keyPrefix: 'discovery', onDone: () => setTimeout(() => reveal(t), 700) }));
    qSlot.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const reveal = (task) => {
    const t = T[task.term];
    found.add(task.term);
    paintPath();
    qSlot.replaceChildren();
    termSlot.innerHTML = `
      <div class="term-card ${t.heat ? 'warm' : 'cool'}" role="status">
        <p class="term-kicker">هذا التحول اسمه:</p>
        <p class="term-name"><span aria-hidden="true">${t.heat ? '🔥' : '❄️'}</span> ${esc(t.name)}</p>
        <p class="term-def">${esc(t.summary)}</p>
        <p class="term-flow" aria-hidden="true">${STATE_LABELS[t.from].emoji} ${STATE_LABELS[t.from].name} ← ${STATE_LABELS[t.to].emoji} ${STATE_LABELS[t.to].name}</p>
        <div class="term-audio"></div>
        <button type="button" class="btn btn-primary" data-next>${idx < DISCOVERY_TASKS.length - 1 ? 'التجربة التالية ⬅️' : 'أنهيت التجارب 🎉'}</button>
      </div>`;
    const termAudio = createAudioButton(t.id, `استمع: ${t.name}`);
    termSlot.querySelector('.term-audio').appendChild(termAudio);
    starBurst(termSlot.querySelector('.term-name'));
    announce(`اكتشفت ${t.name}: ${t.summary}`);
    const next = termSlot.querySelector('[data-next]');
    next.addEventListener('click', () => {
      termAudio.destroy();
      termSlot.replaceChildren();
      idx++;
      waiting = false;
      if (idx >= DISCOVERY_TASKS.length) {
        store.awardOnce('discovery:done', 20, 1, 'اكتشاف التحولات الأربعة');
        onDone?.();
      }
      renderTask();
    });
    next.focus();
  };

  const watch = () => {
    const m = majority();
    if (m !== last) {
      last = m;
      el.querySelector('[data-now]').textContent = `${STATE_LABELS[m].emoji} ${STATE_LABELS[m].name}`;
      canvas.setAttribute('aria-label', `محاكاة: ${describeSim(m, +range.value)}`);
    }
    if (waiting || idx >= DISCOVERY_TASKS.length) return;
    if (sim.targetFraction(DISCOVERY_TASKS[idx].target) >= 0.95) {
      if (!reachedAt) reachedAt = performance.now();
      else if (performance.now() - reachedAt > 1400) ask();
    } else reachedAt = 0;
  };
  // المراقبة بمؤقت مستقل عن الرسم: تعمل حتى لو مرّر الطالب الشاشة
  const timer = setInterval(watch, 250);

  range.addEventListener('input', () => setTemp(+range.value));
  btnHeat.addEventListener('click', () => setTemp(+range.value + 10));
  btnCool.addEventListener('click', () => setTemp(+range.value - 10));
  setTemp(5);
  renderTask();
  paintPath();

  el.destroy = () => { clearInterval(timer); sim.destroy(); };
  return el;
}
