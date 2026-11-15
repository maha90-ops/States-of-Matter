/**
 * صفحة درس حالة من حالات المادة (صلبة / سائلة / غازية).
 * المحتوى يأتي من src/data/states.js
 */
import { html, esc, img } from '../core/dom.js';
import { store } from '../core/store.js';
import { STATES } from '../data/states.js';
import { createAudioButton } from '../components/audioPlayer.js';
import { createSimPanel } from '../components/simPanel.js';
import { createContainerExperiment } from '../components/containerExperiment.js';
import { renderQuestion } from '../components/question.js';
import { mascot, stageNav, stageLabel } from '../components/layout.js';

export function statePage(id) {
  const st = STATES[id];
  return {
    title: st.title,
    render() {
      const done = store.isComplete(id);
      const el = html(`
        <div class="page lesson lesson-${id}">
          <header class="lesson-hero">
            <div class="lesson-intro">
              <span class="eyebrow">${stageLabel(id)} · <span aria-hidden="true">${st.emoji}</span></span>
              <h1>${esc(st.title)}</h1>
              <p class="definition">${esc(st.definition)}</p>
              <div class="lesson-audio"></div>
              <ul class="props" aria-label="خصائص ${esc(st.title)}">
                ${st.properties.map((p) => `
                  <li class="prop"><span class="prop-ico" aria-hidden="true">${p.icon}</span><span>${esc(p.label)}:</span> <strong>${esc(p.value)}</strong></li>`).join('')}
              </ul>
            </div>
            <figure class="lesson-figure">
              ${img(st.image, st.imageAlt, 'lesson-img')}
            </figure>
          </header>

          <section class="lesson-grid" aria-label="نموذج الجسيمات والأمثلة">
            <div class="sim-slot"></div>
            <div class="lesson-side">
              <article class="info-card glass">
                <h2><span aria-hidden="true">⚛️</span> كيف تبدو جسيماتها؟</h2>
                <ul class="check-list">
                  ${st.particles.map((p) => `<li>${esc(p)}</li>`).join('')}
                </ul>
              </article>
              <article class="info-card glass">
                <h2><span aria-hidden="true">📋</span> أمثلة</h2>
                <p class="examples-tip">اضغط على أي مثال لتعرف عنه أكثر 👆</p>
                <ul class="examples">
                  ${st.examples.map((e, i) => `
                    <li><button type="button" class="example" data-i="${i}" aria-pressed="false">
                      <span class="example-emoji" aria-hidden="true">${e.emoji}</span><span>${esc(e.name)}</span>
                    </button></li>`).join('')}
                </ul>
                <p class="example-fact" aria-live="polite" hidden></p>
              </article>
              ${mascot(st.containerNote)}
            </div>
          </section>

          <div class="exp-slot"></div>

          <section class="check-section" aria-labelledby="check-${id}-title">
            <h2 id="check-${id}-title" class="section-title"><span aria-hidden="true">🧠</span> تحقّق من فهمك</h2>
            <div class="check-slot"></div>
            <div class="stage-done" ${done ? '' : 'hidden'}>
              <p>✅ أكملت ${esc(st.title)}! انتقل إلى المحطة التالية.</p>
            </div>
          </section>

          ${stageNav(id)}
        </div>`);

      el.querySelector('.lesson-audio').appendChild(createAudioButton(st.audio, 'استمع إلى الشرح'));

      const sim = createSimPanel({
        state: id,
        caption: `جسيمات ${st.title}: ${st.particles.join(' ')}`,
        note: null,
      });
      el.querySelector('.sim-slot').appendChild(sim);

      if (st.experiment === 'containers') {
        el.querySelector('.exp-slot').appendChild(createContainerExperiment());
      }

      // أمثلة تفاعلية: جملة قصيرة عن كل مثال
      const fact = el.querySelector('.example-fact');
      el.querySelector('.examples').addEventListener('click', (e) => {
        const b = e.target.closest('.example');
        if (!b) return;
        const ex = st.examples[Number(b.dataset.i)];
        el.querySelectorAll('.example').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        fact.hidden = false;
        fact.innerHTML = `<span class="example-fact-emoji" aria-hidden="true">${ex.emoji}</span> ${esc(ex.fact)}`;
        fact.classList.remove('pop-in');
        void fact.offsetWidth;
        fact.classList.add('pop-in');
      });

      // أسئلة "تحقق من فهمك": تكتمل المرحلة عند الإجابة عن جميعها
      let solved = 0;
      st.checks.forEach((q, i) => {
        el.querySelector('.check-slot').appendChild(
          renderQuestion(q, {
            mode: 'practice',
            keyPrefix: 'lesson',
            index: st.checks.length > 1 ? i + 1 : undefined,
            total: st.checks.length,
            onDone: () => {
              solved++;
              if (solved < st.checks.length) return;
              store.completeStage(id);
              el.querySelector('.stage-done').hidden = false;
              el.querySelector('.next-stage')?.classList.add('pulse');
            },
          })
        );
      });

      return el;
    },
  };
}
