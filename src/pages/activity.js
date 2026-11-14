/** النشاط التفاعلي: بطاقة تعليمات + أسئلة متنوعة مع إعادة المحاولة */
import { html, num } from '../core/dom.js';
import { store } from '../core/store.js';
import { IMG, POINTS } from '../data/config.js';
import { ACTIVITY_QUESTIONS } from '../data/activityQuestions.js';
import { createAudioButton } from '../components/audioPlayer.js';
import { renderQuestion } from '../components/question.js';
import { confetti } from '../components/effects.js';
import { stageNav, stageLabel } from '../components/layout.js';

export const activityPage = {
  title: 'النشاط التفاعلي',
  render() {
    const el = html(`
      <div class="page activity">
        <header class="page-head">
          <span class="eyebrow">${stageLabel('activity')} · <span aria-hidden="true">🎮</span></span>
          <h1>🎮 النشاط التفاعلي</h1>
        </header>
        <div class="activity-stage"></div>
        ${stageNav('activity')}
      </div>`);

    const stage = el.querySelector('.activity-stage');
    const questions = ACTIVITY_QUESTIONS;
    let i = 0;

    /* ----- بطاقة التعليمات ----- */
    const intro = () => {
      const card = html(`
        <section class="instructions glass" aria-labelledby="ins-title">
          <img class="instructions-img" src="${IMG.activity}" alt="العالِم الصغير يشير إلى ثلاث بطاقات مضيئة: مكعب ثلج، وقطرة ماء، وسحابة بخار" loading="lazy" decoding="async">
          <div class="instructions-body">
            <h2 id="ins-title">📋 قبل أن نبدأ</h2>
            <ul class="check-list">
              <li>اقرأ السؤال جيدًا، وفكّر قبل اختيار الإجابة.</li>
              <li>إذا أخطأت فلا بأس! يمكنك المحاولة مرة أخرى.</li>
              <li>اضغط على زر <strong>💡 تلميح</strong> إذا احتجت إلى مساعدة.</li>
              <li>كل إجابة صحيحة = <strong>⭐ نجمة</strong> و<strong>${num(POINTS.correctAnswer)} نقاط</strong>.</li>
              <li>عند إكمال النشاط تحصل على <strong>${num(POINTS.activityComplete)} نقطة</strong> إضافية.</li>
            </ul>
            <div class="ins-audio"></div>
            <button type="button" class="btn btn-primary btn-lg btn-start">🚀 ابدأ النشاط</button>
          </div>
        </section>`);
      card.querySelector('.ins-audio').appendChild(createAudioButton('beforeActivity', 'استمع للتعليمات'));
      card.querySelector('.btn-start').addEventListener('click', () => {
        card.querySelector('.audio-ctrl')?.destroy?.();
        show();
      });
      stage.replaceChildren(card);
    };

    /* ----- سؤال ----- */
    const show = () => {
      const q = questions[i];
      const wrap = html(`
        <div class="quiz">
          <div class="dots" role="progressbar" aria-label="التقدم في النشاط" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${i}">
            ${questions.map((_, k) => `<span class="${k < i ? 'done' : k === i ? 'now' : ''}"></span>`).join('')}
          </div>
          <div class="q-slot"></div>
          <div class="quiz-next" hidden>
            <button type="button" class="btn btn-primary btn-lg btn-next">${i < questions.length - 1 ? 'السؤال التالي ⬅️' : 'إنهاء النشاط 🎉'}</button>
          </div>
        </div>`);
      const next = wrap.querySelector('.quiz-next');
      wrap.querySelector('.q-slot').appendChild(
        renderQuestion(q, {
          mode: 'practice',
          keyPrefix: 'activity',
          index: i + 1,
          total: questions.length,
          onDone: () => {
            next.hidden = false;
            setTimeout(() => wrap.querySelector('.btn-next').focus({ preventScroll: true }), 300);
          },
        })
      );
      wrap.querySelector('.btn-next').addEventListener('click', () => {
        i++;
        if (i < questions.length) show();
        else finish();
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      stage.replaceChildren(wrap);
    };

    /* ----- النهاية ----- */
    const finish = () => {
      store.completeStage('activity');
      const card = html(`
        <section class="result glass" aria-labelledby="act-done">
          <img class="result-img" src="${IMG.success}" alt="العالِم الصغير يرفع ميدالية ذهبية فرحًا" loading="lazy">
          <h2 id="act-done">🎉 أكملت النشاط بنجاح!</h2>
          <p>أجبت عن جميع الأسئلة، وحصلت على <strong>${num(POINTS.activityComplete)} نقطة</strong> إضافية. أنت الآن جاهز للتحدي النهائي!</p>
          <div class="result-actions">
            <a class="btn btn-primary btn-lg" href="#challenge">🏆 انطلق إلى التحدي النهائي</a>
            <button type="button" class="btn btn-ghost btn-again">🔄 أعد النشاط</button>
          </div>
        </section>`);
      card.querySelector('.btn-again').addEventListener('click', () => {
        i = 0;
        show();
      });
      stage.replaceChildren(card);
      confetti(card);
    };

    intro();
    return el;
  },
};
