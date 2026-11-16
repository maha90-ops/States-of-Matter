/** صفحة تحولات المادة: إنفوجرافيك تفاعلي + محاكاة الجسيمات + مقياس حرارة */
import { html, esc, img, announce } from '../core/dom.js';
import { store } from '../core/store.js';
import { IMG } from '../data/config.js';
import { TRANSITIONS, STATE_LABELS, CHANGES_CHECK } from '../data/transitions.js';
import { createAudioButton } from '../components/audioPlayer.js';
import { createSimPanel } from '../components/simPanel.js';
import { renderQuestion } from '../components/question.js';
import { stageNav, stageLabel } from '../components/layout.js';
import { createDiscoveryLab } from '../components/discoveryLab.js';
import { createScenarios } from '../components/scenarios.js';

const ORDER = ['solid', 'liquid', 'gas'];
const THERMO = { solid: 14, liquid: 50, gas: 88 };
const THERMO_LABEL = { solid: 'بارد ❄️', liquid: 'دافئ 🌤️', gas: 'ساخن 🔥' };

const arrowSvg = (dir) => `
  <svg class="t-arrow" viewBox="0 0 24 64" aria-hidden="true">
    <path d="${dir === 'down' ? 'M12 4 V54' : 'M12 60 V10'}" class="t-line"/>
    <path d="${dir === 'down' ? 'M4 46 L12 58 L20 46' : 'M4 18 L12 6 L20 18'}" class="t-head"/>
  </svg>`;

const transitionBtn = (t) => `
  <button type="button" class="t-btn ${t.heat ? 'warm' : 'cool'}" data-t="${t.id}"
    aria-label="${t.name}: من ${STATE_LABELS[t.from].name} إلى ${STATE_LABELS[t.to].name} ${t.heat ? 'بالتسخين' : 'بالتبريد'}">
    ${arrowSvg(t.heat ? 'down' : 'up')}
    <span class="t-text">
      <span class="t-name"><span aria-hidden="true">${t.heat ? '🔥' : '❄️'}</span> ${t.name}</span>
      <span class="t-path">${STATE_LABELS[t.from].name} ← ${STATE_LABELS[t.to].name}</span>
      <span class="t-kind">${t.heat ? 'تسخين' : 'تبريد'}</span>
    </span>
  </button>`;

const node = (id) => `
  <div class="state-node node-${id}" data-node="${id}">
    <span class="node-emoji" aria-hidden="true">${STATE_LABELS[id].emoji}</span>
    <span class="node-name">${STATE_LABELS[id].name}</span>
    <span class="node-dots" aria-hidden="true">${'<i></i>'.repeat(id === 'solid' ? 9 : id === 'liquid' ? 7 : 4)}</span>
  </div>`;

const T = Object.fromEntries(TRANSITIONS.map((t) => [t.id, t]));

export const changesPage = {
  title: 'تحولات المادة',
  render() {
    const el = html(`
      <div class="page changes">
        <header class="page-head">
          <span class="eyebrow">${stageLabel('changes')} · <span aria-hidden="true">🔥</span></span>
          <h1>🔄 كيف تتحول المادة؟</h1>
          <p class="lead">يمكن للمادة أن تنتقل من حالة إلى أخرى عندما تتغيّر درجة حرارتها. اضغط على أي سهم، أو استخدم أزرار التسخين والتبريد، وراقب ماذا يحدث للجسيمات!</p>
          <div class="lesson-audio"></div>
        </header>

        <figure class="banner">
          ${img(IMG.changes, 'إنفوجرافيك: أسهم دافئة تُظهر الانصهار (من الثلج إلى الماء) والتبخر (من الماء إلى البخار)، وأسهم زرقاء تُظهر التكاثف (من البخار إلى الماء) والتجمد (من الماء إلى الثلج)', 'banner-img')}
        </figure>

        <div class="legend" aria-label="دليل الألوان">
          <span class="legend-item warm">🔥 سهم دافئ = تسخين</span>
          <span class="legend-item cool">❄️ سهم بارد = تبريد</span>
        </div>

        <section class="changes-lab" aria-label="مختبر التحولات">
          <div class="cycle glass" role="group" aria-label="مخطط تحولات المادة">
            ${node('solid')}
            <div class="t-row">${transitionBtn(T.melting)}${transitionBtn(T.freezing)}</div>
            ${node('liquid')}
            <div class="t-row">${transitionBtn(T.evaporation)}${transitionBtn(T.condensation)}</div>
            ${node('gas')}
          </div>

          <div class="lab-panel">
            <div class="lab-top">
              <div class="sim-slot"></div>
              <div class="thermo" aria-hidden="true">
                <div class="thermo-tube"><span class="thermo-fill"></span></div>
                <div class="thermo-bulb"></div>
                <span class="thermo-label"></span>
              </div>
            </div>
            <div class="lab-buttons">
              <button type="button" class="btn btn-warm btn-heat">🔥 سخّن</button>
              <span class="state-badge" aria-live="polite"></span>
              <button type="button" class="btn btn-cool btn-cool-down">❄️ برّد</button>
            </div>
            <article class="t-info glass" aria-live="polite">
              <h2 class="t-info-title">جاهز للتجربة؟</h2>
              <p class="t-info-sum">ابدأ بالضغط على زر <strong>🔥 سخّن</strong> لترى كيف ينصهر الجسم الصلب.</p>
              <ul class="check-list t-info-list"></ul>
              <p class="t-info-ex"></p>
            </article>
          </div>
        </section>

        <section class="summary-grid" aria-label="ملخص التحولات">
          ${TRANSITIONS.map((t) => `
            <article class="summary-card ${t.heat ? 'warm' : 'cool'}">
              <h3><span aria-hidden="true">${t.heat ? '🔥' : '❄️'}</span> ${t.name}</h3>
              <p class="summary-path"><span aria-hidden="true">${STATE_LABELS[t.from].emoji}</span> ${STATE_LABELS[t.from].name} ← <span aria-hidden="true">${STATE_LABELS[t.to].emoji}</span> ${STATE_LABELS[t.to].name}</p>
              <p>${esc(t.summary)}</p>
              <div class="summary-audio" data-t="${t.id}"></div>
            </article>`).join('')}
        </section>

        <div class="discovery-slot"></div>
        <div class="scenarios-slot"></div>

        <section class="check-section" aria-labelledby="check-changes-title">
          <h2 id="check-changes-title" class="section-title"><span aria-hidden="true">🧠</span> تحقّق من فهمك</h2>
          <div class="check-slot"></div>
          <div class="stage-done" ${store.isComplete('changes') ? '' : 'hidden'}><p>✅ أصبحت تعرف كيف تتحول المادة! حان وقت النشاط التفاعلي.</p></div>
        </section>

        ${stageNav('changes')}
      </div>`);

    el.querySelector('.lesson-audio').appendChild(createAudioButton('changes', 'استمع إلى الشرح'));

    const panel = createSimPanel({
      state: 'solid',
      caption: 'محاكاة الجسيمات أثناء تحوّل المادة',
      containerControls: false,
      height: 280,
    });
    el.querySelector('.sim-slot').appendChild(panel);
    const sim = panel.sim;

    const $ = (s) => el.querySelector(s);
    let current = 'solid';
    let timer;

    const paint = () => {
      $('.thermo-fill').style.height = THERMO[current] + '%';
      $('.thermo').dataset.level = current;
      $('.thermo-label').textContent = THERMO_LABEL[current];
      $('.state-badge').innerHTML = `الحالة الآن: <strong>${STATE_LABELS[current].emoji} ${STATE_LABELS[current].name}</strong>`;
      el.querySelectorAll('.state-node').forEach((n) => n.classList.toggle('active', n.dataset.node === current));
      $('.btn-heat').disabled = current === 'gas';
      $('.btn-cool-down').disabled = current === 'solid';
    };

    const showInfo = (t) => {
      $('.t-info').className = `t-info glass ${t.heat ? 'warm' : 'cool'}`;
      $('.t-info-title').innerHTML = `<span aria-hidden="true">${t.heat ? '🔥' : '❄️'}</span> ${t.name}: ${STATE_LABELS[t.from].name} ← ${STATE_LABELS[t.to].name}`;
      $('.t-info-sum').textContent = t.summary;
      $('.t-info-list').innerHTML = t.particles.map((p) => `<li>${esc(p)}</li>`).join('');
      $('.t-info-ex').textContent = t.example;
    };

    const run = (t) => {
      clearTimeout(timer);
      el.querySelectorAll('.t-btn').forEach((b) => b.classList.toggle('active', b.dataset.t === t.id));
      showInfo(t);
      const go = () => {
        current = t.to;
        sim.setState(t.to);
        paint();
        announce(`${t.name}: تحوّلت المادة من ${STATE_LABELS[t.from].name} إلى ${STATE_LABELS[t.to].name}.`);
      };
      if (current !== t.from) {
        // نبدأ من الحالة الصحيحة أولًا ثم نعرض التحوّل
        current = t.from;
        sim.setState(t.from, { instant: true });
        paint();
        timer = setTimeout(go, 700);
      } else {
        go();
      }
    };

    el.querySelector('.cycle').addEventListener('click', (e) => {
      const b = e.target.closest('.t-btn');
      if (!b) return;
      run(T[b.dataset.t]);
      // على الشاشات الصغيرة: إظهار المحاكاة ليرى الطالب ما يحدث للجسيمات
      if (window.matchMedia('(max-width: 960px)').matches) {
        el.querySelector('.lab-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    $('.btn-heat').addEventListener('click', () => {
      const t = TRANSITIONS.find((x) => x.heat && x.from === current);
      if (t) run(t);
    });
    $('.btn-cool-down').addEventListener('click', () => {
      const t = TRANSITIONS.find((x) => !x.heat && x.from === current);
      if (t) run(t);
    });

    paint();

    el.querySelector('.check-slot').appendChild(
      renderQuestion(CHANGES_CHECK, {
        mode: 'practice',
        keyPrefix: 'lesson',
        onDone: () => {
          store.completeStage('changes');
          $('.stage-done').hidden = false;
          el.querySelector('.next-stage')?.classList.add('pulse');
        },
      })
    );

    // صوت كل مصطلح في بطاقات الملخص
    el.querySelectorAll('.summary-audio').forEach((slot) => {
      slot.appendChild(createAudioButton(slot.dataset.t, 'استمع'));
    });

    // مختبر الحرارة الموجّه + مواقف «ماذا سيحدث؟»
    const discovery = createDiscoveryLab({});
    const scenarios = createScenarios({});
    el.querySelector('.discovery-slot').appendChild(discovery);
    el.querySelector('.scenarios-slot').appendChild(scenarios);

    return {
      el,
      cleanup: () => { clearTimeout(timer); discovery.destroy(); scenarios.destroy(); },
    };
  },
};
