/** الصفحة الرئيسية: المقدمة + خريطة الرحلة + نظرة على حالات المادة */
import { html, esc, img } from '../core/dom.js';
import { store } from '../core/store.js';
import { STAGES } from '../data/stages.js';
import { IMG } from '../data/config.js';
import { STATES, STATE_ORDER } from '../data/states.js';
import { createAudioButton } from '../components/audioPlayer.js';

const BEAKERS = { solid: IMG.beakerSolid, liquid: IMG.beakerLiquid, gas: IMG.beakerGas };
const BEAKER_ALT = {
  solid: 'وعاء فيه جسيمات متلاصقة ومرتبة',
  liquid: 'وعاء فيه جسيمات متقاربة وغير مرتبة',
  gas: 'وعاء فيه جسيمات متباعدة جدًا',
};

export const homePage = {
  title: '',
  render() {
    const s = store.get();
    const firstOpen = STAGES.find((st) => !s.completed.includes(st.id)) || STAGES[0];
    const started = s.completed.length > 0;

    const el = html(`
      <div class="page home">
        <section class="hero" aria-labelledby="hero-title">
          <div class="hero-text">
            <span class="eyebrow">🧪 مختبر العلوم التفاعلي</span>
            <h1 id="hero-title">رحلة في عالم <span class="grad">حالات المادة</span></h1>
            <p class="hero-sub">اكتشف أسرار المادة، وتعرّف إلى حالاتها وتحولاتها من خلال رحلة علمية ممتعة!</p>
            <div class="hero-actions">
              <a class="btn btn-primary btn-lg" href="#${started ? firstOpen.route : 'solid'}">🚀 ${started ? 'أكمل الرحلة' : 'ابدأ الرحلة'}</a>
              <a class="btn btn-secondary btn-lg" href="#home-states">🔬 اكتشف حالات المادة</a>
            </div>
            <div class="hero-audio"></div>
          </div>
          <div class="hero-art">
            <div class="hero-img-wrap">
              <img src="${IMG.hero}" alt="العالِم الصغير بمعطف المختبر ونظارات الحماية يشير إلى ثلاثة أوعية: مكعبات ثلج، وماء، وبخار، وتحت كل وعاء نموذج لجسيماته" fetchpriority="high" decoding="async">
            </div>
            <span class="float-chip c1">🧊 صلب</span>
            <span class="float-chip c2">💧 سائل</span>
            <span class="float-chip c3">💨 غاز</span>
          </div>
        </section>

        <section class="how glass" aria-label="كيف تتعلم في الرحلة">
          <div><span aria-hidden="true">🔊</span><strong>استمع</strong><small>إلى شرح كل مرحلة</small></div>
          <div><span aria-hidden="true">🔬</span><strong>لاحظ</strong><small>حركة الجسيمات</small></div>
          <div><span aria-hidden="true">🎮</span><strong>جرّب</strong><small>الأنشطة التفاعلية</small></div>
          <div><span aria-hidden="true">🏆</span><strong>اربح</strong><small>النجوم والشهادة</small></div>
        </section>

        <section class="journey" id="home-journey" aria-labelledby="journey-title">
          <div class="section-head">
            <span class="eyebrow">🗺️ خريطة الرحلة</span>
            <h2 id="journey-title">ست محطات تنتظرك!</h2>
            <p>اضغط على أي محطة للانتقال إليها. ننصحك بالسير بالترتيب.</p>
          </div>
          <ol class="journey-map">
            ${STAGES.map((st, i) => {
              const done = s.completed.includes(st.id);
              const current = st.id === firstOpen.id && !done;
              return `
              <li>
                <a class="stage-card tone-${st.color} ${done ? 'done' : ''} ${current ? 'current' : ''}" href="#${st.route}">
                  <span class="stage-num" aria-hidden="true">${i + 1}</span>
                  <span class="stage-emoji" aria-hidden="true">${st.emoji}</span>
                  <span class="stage-title">${esc(st.title)}</span>
                  <span class="stage-desc">${esc(st.desc)}</span>
                  <span class="stage-status">${done ? '✅ مكتملة' : current ? '▶️ ابدأ من هنا' : '⏳ بانتظارك'}</span>
                </a>
              </li>`;
            }).join('')}
          </ol>
        </section>

        <section class="states-overview" id="home-states" aria-labelledby="states-title">
          <div class="section-head">
            <span class="eyebrow">🔬 اكتشف حالات المادة</span>
            <h2 id="states-title">للمادة ثلاث حالات</h2>
            <p>كل شيء حولنا مادة: الماء الذي نشربه، والهواء الذي نتنفسه، والكتاب الذي نقرؤه. انظر كيف تختلف الجسيمات في كل حالة!</p>
          </div>
          <div class="overview-grid">
            ${STATE_ORDER.map((id) => {
              const st = STATES[id];
              return `
              <a class="overview-card glass" href="#${id}">
                ${img(BEAKERS[id], BEAKER_ALT[id], 'overview-img')}
                <span class="overview-title"><span aria-hidden="true">${st.emoji}</span> ${esc(st.title)}</span>
                <span class="overview-def">${esc(st.definition)}</span>
                <span class="overview-go">ادخل المختبر ⬅️</span>
              </a>`;
            }).join('')}
          </div>
        </section>
      </div>`);

    el.querySelector('.hero-audio').appendChild(createAudioButton('intro', 'استمع إلى المقدمة'));
    return el;
  },
};
