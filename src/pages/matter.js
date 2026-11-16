/** محطة «ما المادة؟»: تعريف بالاكتشاف + «أي الأشياء مادة؟» + سؤال تحقق */
import { html, esc, num, announce } from '../core/dom.js';
import { store } from '../core/store.js';
import { MATTER } from '../data/extras.js';
import { renderQuestion } from '../components/question.js';
import { starBurst } from '../components/effects.js';
import { playSfx } from '../components/audioPlayer.js';
import { mascot, stageNav, stageLabel } from '../components/layout.js';
import { createAudioButton } from '../components/audioPlayer.js';

export const matterPage = {
  title: 'ما المادة؟',
  render() {
    const total = MATTER.items.filter((i) => i.matter).length;
    const el = html(`
      <div class="page matter">
        <header class="page-head">
          <span class="eyebrow">${stageLabel('matter')} · <span aria-hidden="true">🌍</span></span>
          <h1>🌍 ما المادة؟</h1>
          <p class="lead">كل شيء حولنا تقريبًا مادة! لكن كيف نعرف إن كان الشيء مادة أم لا؟ هيا نكتشف معًا.</p>
          <div class="lesson-audio"></div>
        </header>

        <section class="def-card glass" aria-label="تعريف المادة">
          <span class="def-ico" aria-hidden="true">🌍</span>
          <p class="def-text"><strong>المادة</strong> هي كل شيء له <mark>كتلة</mark> ويشغل <mark>حيزًا</mark> من المكان.</p>
        </section>

        <section aria-labelledby="flip-title">
          <h2 id="flip-title" class="section-title"><span aria-hidden="true">🔍</span> اكتشف صفتي المادة</h2>
          <p class="step-tip">👆 اضغط على البطاقتين لتقلبهما.</p>
          <div class="flip-grid">
            ${MATTER.cards.map((c) => `
              <button type="button" class="flip" data-card="${c.id}" aria-expanded="false">
                <span class="flip-inner">
                  <span class="flip-face flip-front">
                    <span class="flip-ico" aria-hidden="true">${c.icon}</span>
                    <span class="flip-title">${esc(c.title)}</span>
                    <span class="flip-tap">اضغط لتكتشف</span>
                  </span>
                  <span class="flip-face flip-back" aria-hidden="true">
                    <span class="flip-scene" aria-hidden="true">${c.scene}</span>
                    <span class="flip-text">${esc(c.back)}</span>
                  </span>
                </span>
              </button>`).join('')}
          </div>
        </section>

        <section class="glass sort-box" aria-labelledby="which-title">
          <h2 id="which-title" class="section-title"><span aria-hidden="true">🤔</span> أي الأشياء التالية مادة؟</h2>
          <p class="step-tip">اضغط على كل شيء تظنه مادة. اسأل نفسك: ⚖️ هل له كتلة؟ 📦 هل يشغل حيزًا؟</p>
          <ul class="thing-grid">
            ${MATTER.items.map((it) => `
              <li><button type="button" class="thing" data-id="${it.id}" aria-pressed="false">
                <span class="thing-emoji" aria-hidden="true">${it.emoji}</span>
                <span class="thing-name">${esc(it.name)}</span>
                <span class="thing-tag" aria-hidden="true"></span>
              </button></li>`).join('')}
          </ul>
          <p class="thing-count" aria-live="polite"></p>
          <div class="q-feedback" role="status"></div>
        </section>

        ${mascot('تذكّر: الهواء لا نراه، لكنه يملأ البالون! فهل هو مادة؟ 🎈')}

        <section class="check-section" aria-labelledby="check-matter-title">
          <h2 id="check-matter-title" class="section-title"><span aria-hidden="true">🧠</span> تحقّق من فهمك</h2>
          <div class="check-slot"></div>
          <div class="stage-done" ${store.isComplete('matter') ? '' : 'hidden'}><p>✅ أصبحت تعرف ما المادة! هيا نتعرّف إلى حالاتها.</p></div>
        </section>

        ${stageNav('matter')}
      </div>`);

    el.querySelector('.lesson-audio').appendChild(createAudioButton('matter', 'استمع إلى الشرح'));

    const goals = { cards: new Set(), found: new Set(), check: false };
    const tryComplete = () => {
      if (goals.cards.size === 2 && goals.found.size === total && goals.check) {
        store.completeStage('matter');
        el.querySelector('.stage-done').hidden = false;
        el.querySelector('.next-stage')?.classList.add('pulse');
      }
    };

    /* البطاقات المقلوبة */
    el.querySelectorAll('.flip').forEach((card) => card.addEventListener('click', () => {
      const open = card.getAttribute('aria-expanded') !== 'true';
      card.setAttribute('aria-expanded', String(open));
      card.classList.toggle('flipped', open);
      card.querySelector('.flip-front').setAttribute('aria-hidden', String(open));
      card.querySelector('.flip-back').setAttribute('aria-hidden', String(!open));
      if (open) {
        announce(card.querySelector('.flip-text').textContent);
        goals.cards.add(card.dataset.card);
        if (goals.cards.size === 2) store.awardOnce('matter:cards', 20, 1, 'اكتشاف صفتي المادة');
        tryComplete();
      }
    }));

    /* أي الأشياء مادة؟ */
    const fb = el.querySelector('.sort-box .q-feedback');
    const count = el.querySelector('.thing-count');
    const paintCount = () => { count.innerHTML = `🔎 وجدتَ <strong>${num(goals.found.size)}</strong> من <strong>${num(total)}</strong> مواد`; };
    paintCount();
    el.querySelector('.thing-grid').addEventListener('click', (e) => {
      const b = e.target.closest('.thing');
      if (!b || b.classList.contains('yes') || b.classList.contains('no')) return;
      const it = MATTER.items.find((x) => x.id === b.dataset.id);
      if (it.matter) {
        b.classList.add('yes');
        b.setAttribute('aria-pressed', 'true');
        b.querySelector('.thing-tag').textContent = '✓ مادة';
        b.setAttribute('aria-label', `${it.name}: مادة`);
        goals.found.add(it.id);
        fb.className = 'q-feedback ok';
        fb.innerHTML = `<strong>أحسنت! 🎉</strong><span>${esc(it.fact)}</span>`;
        store.correct(`matter:${it.id}`);
        starBurst(b);
        playSfx('correct');
        paintCount();
        if (goals.found.size === total) {
          fb.innerHTML = '<strong>وجدتَ كل المواد! 🏆</strong><span>الكرسي والماء والهواء والحجر والتفاحة كلها مواد. أما الضوء فليس مادة.</span>';
          store.awardOnce('matter:sort', 20, 0, 'إكمال النشاط');
        }
        tryComplete();
      } else {
        b.classList.add('no');
        b.setAttribute('aria-disabled', 'true');
        b.querySelector('.thing-tag').textContent = '✗ ليس مادة';
        b.setAttribute('aria-label', `${it.name}: ليس مادة`);
        fb.className = 'q-feedback retry nudge';
        fb.innerHTML = `<strong>فكّر مرة أخرى 💡</strong><span>${esc(it.fact)}</span>`;
        playSfx('tryAgain');
      }
    });

    el.querySelector('.check-slot').appendChild(renderQuestion(MATTER.check, {
      mode: 'practice',
      keyPrefix: 'lesson',
      onDone: () => { goals.check = true; tryComplete(); },
    }));

    return el;
  },
};
