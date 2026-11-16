/** مختبر الجزيئات: الحالات الثلاث في محاكاة واحدة + تشغيل/إيقاف/إعادة + الحرارة + جدول مقارنة */
import { html, esc, announce } from '../core/dom.js';
import { store } from '../core/store.js';
import { LAB_FACTS, LAB_CHECK } from '../data/extras.js';
import { ThermoSim, describeSim } from '../components/thermoSim.js';
import { renderQuestion } from '../components/question.js';
import { mascot, stageNav, stageLabel } from '../components/layout.js';

const NAMES = { solid: { e: '🧊', n: 'صلب', l: 'الحالة الصلبة' }, liquid: { e: '💧', n: 'سائل', l: 'الحالة السائلة' }, gas: { e: '💨', n: 'غاز', l: 'الحالة الغازية' } };
const heatWord = (v) => (v < 25 ? 'باردة جدًا' : v < 50 ? 'باردة' : v < 75 ? 'دافئة' : 'ساخنة');
const facts = (m) => `<dl class="facts facts-${m}">${LAB_FACTS[m].map((f) => `<div><dt><span aria-hidden="true">${f.icon}</span> ${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>`;

export const labPage = {
  title: 'مختبر الجزيئات',
  render() {
    const el = html(`
      <div class="page lab">
        <header class="page-head">
          <span class="eyebrow">${stageLabel('lab')} · <span aria-hidden="true">🔬</span></span>
          <h1>🔬 مختبر الجزيئات</h1>
          <p class="lead">هنا تتحكم أنت! اختر حالة المادة، وشغّل المحاكاة، وغيّر درجة الحرارة، وقارن بين حركة الجسيمات.</p>
        </header>

        <section class="lab-box glass" aria-label="المختبر">
          <div class="state-tabs" role="radiogroup" aria-label="اختر حالة المادة">
            ${['solid', 'liquid', 'gas'].map((m, i) => `
              <button type="button" role="radio" class="state-tab tab-${m}" data-m="${m}" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
                <span aria-hidden="true">${NAMES[m].e}</span> ${NAMES[m].n}
              </button>`).join('')}
          </div>
          <div class="lab-main">
            <figure class="lab-sim">
              <div class="sim-canvas-wrap" style="--sim-h:340px">
                <canvas class="sim-canvas" role="img"></canvas>
                <span class="sim-label">🔬 <span data-tag>🧊 صلب</span></span>
                <button type="button" class="sim-play-overlay">▶️ تشغيل المحاكاة</button>
              </div>
            </figure>
            <aside class="lab-facts" aria-live="polite">
              <h2 class="lab-facts-title" data-title>🧊 الحالة الصلبة</h2>
              <div data-facts>${facts('solid')}</div>
            </aside>
          </div>
          <div class="lab-controls">
            <div class="lab-btns" role="group" aria-label="التحكم في المحاكاة">
              <button type="button" class="btn btn-primary" data-act="play">▶️ تشغيل المحاكاة</button>
              <button type="button" class="btn btn-ghost" data-act="pause">⏸️ إيقاف</button>
              <button type="button" class="btn btn-ghost" data-act="reset">🔄 إعادة</button>
            </div>
            <div class="temp-ctrl">
              <label for="lab-temp">🌡️ درجة الحرارة</label>
              <div class="temp-row"><span>❄️ بارد</span><input type="range" class="temp-range" id="lab-temp" min="0" max="100" value="35" aria-valuetext="باردة"><span>🔥 ساخن</span></div>
            </div>
          </div>
          <ul class="tasks" aria-label="مهام المختبر">
            <li data-task="solid"><i aria-hidden="true"></i> جرّب الحالة الصلبة 🧊</li>
            <li data-task="liquid"><i aria-hidden="true"></i> جرّب الحالة السائلة 💧</li>
            <li data-task="gas"><i aria-hidden="true"></i> جرّب الحالة الغازية 💨</li>
            <li data-task="temp"><i aria-hidden="true"></i> غيّر درجة الحرارة 🌡️</li>
          </ul>
        </section>

        <section aria-labelledby="cmp-title">
          <h2 id="cmp-title" class="section-title"><span aria-hidden="true">📋</span> جدول المقارنة</h2>
          <div class="cmp-wrap glass">
            <table class="cmp">
              <thead><tr><th scope="col"><span class="sr-only">الخاصية</span></th>${['solid', 'liquid', 'gas'].map((m) => `<th scope="col" class="c-${m}">${NAMES[m].e} ${NAMES[m].n}</th>`).join('')}</tr></thead>
              <tbody>${LAB_FACTS.solid.map((f, i) => `<tr><th scope="row"><span aria-hidden="true">${f.icon}</span> ${esc(f.label)}</th>${['solid', 'liquid', 'gas'].map((m) => `<td class="c-${m}">${esc(LAB_FACTS[m][i].value)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>
        </section>

        ${mascot('لاحظ: كلما زادت الحرارة، تحركت الجسيمات أسرع، في كل الحالات!')}

        <section class="check-section" aria-labelledby="check-lab-title">
          <h2 id="check-lab-title" class="section-title"><span aria-hidden="true">🧠</span> تحقّق من فهمك</h2>
          <div class="check-slot"></div>
          <div class="stage-done" ${store.isComplete('lab') ? '' : 'hidden'}><p>✅ أنت عالم جسيمات حقيقي! هيا نكتشف كيف تتحول المادة.</p></div>
        </section>

        ${stageNav('lab')}
      </div>`);

    const canvas = el.querySelector('canvas');
    const range = el.querySelector('#lab-temp');
    const overlay = el.querySelector('.sim-play-overlay');
    const sim = new ThermoSim(canvas, { mode: 'solid', cols: 8, rows: 5, temperature: 35, paused: true });
    let mode = 'solid';
    let playing = false;
    const tasks = new Set();
    let checked = false;

    const describe = () => canvas.setAttribute('aria-label', `محاكاة: ${describeSim(mode, +range.value)}${playing ? '' : ' (المحاكاة متوقفة)'}`);
    const tryComplete = () => {
      if (tasks.size === 4 && checked) {
        store.completeStage('lab');
        el.querySelector('.stage-done').hidden = false;
        el.querySelector('.next-stage')?.classList.add('pulse');
      }
    };
    const tick = (t) => {
      if ((t !== 'temp' && !playing) || tasks.has(t)) return;
      tasks.add(t);
      const li = el.querySelector(`[data-task="${t}"]`);
      li.classList.add('done');
      li.insertAdjacentHTML('beforeend', '<span class="sr-only"> (تم)</span>');
      if (tasks.size === 4) {
        store.awardOnce('lab:tasks', 20, 1, 'إكمال تجارب المختبر');
        announce('أكملت جميع تجارب المختبر!');
      }
      tryComplete();
    };
    const setPlaying = (on) => {
      playing = on;
      overlay.hidden = on;
      if (on) { sim.play(); tick(mode); } else sim.pause();
      describe();
    };

    const tabs = [...el.querySelectorAll('.state-tab')];
    const select = (b, focus) => {
      tabs.forEach((t) => { t.setAttribute('aria-checked', String(t === b)); t.tabIndex = t === b ? 0 : -1; });
      if (focus) b.focus();
      mode = b.dataset.m;
      sim.setMode(mode);
      el.querySelector('[data-tag]').textContent = `${NAMES[mode].e} ${NAMES[mode].n}`;
      el.querySelector('[data-title]').textContent = `${NAMES[mode].e} ${NAMES[mode].l}`;
      el.querySelector('[data-facts]').innerHTML = facts(mode);
      describe();
      tick(mode);
    };
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });

    el.querySelector('[data-act="play"]').addEventListener('click', () => setPlaying(true));
    overlay.addEventListener('click', () => { setPlaying(true); el.querySelector('[data-act="pause"]').focus(); });
    el.querySelector('[data-act="pause"]').addEventListener('click', () => setPlaying(false));
    el.querySelector('[data-act="reset"]').addEventListener('click', () => {
      range.value = 35;
      range.setAttribute('aria-valuetext', heatWord(35));
      sim.setTemperature(35);
      sim.reset();
      describe();
      announce('أُعيدت المحاكاة إلى البداية.');
    });
    range.addEventListener('input', () => {
      sim.setTemperature(+range.value);
      range.setAttribute('aria-valuetext', heatWord(+range.value));
      describe();
      if (Math.abs(+range.value - 35) > 20) tick('temp');
    });
    describe();

    el.querySelector('.check-slot').appendChild(renderQuestion(LAB_CHECK, {
      mode: 'practice', keyPrefix: 'lesson', onDone: () => { checked = true; tryComplete(); },
    }));

    return { el, cleanup: () => sim.destroy() };
  },
};
