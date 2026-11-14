/** التحدي النهائي: 8 أسئلة، محاولة واحدة لكل سؤال، ثم النتيجة والشهادة */
import { html, num } from '../core/dom.js';
import { store } from '../core/store.js';
import { IMG, POINTS, CERTIFICATE_THRESHOLD } from '../data/config.js';
import { CHALLENGE_QUESTIONS } from '../data/challengeQuestions.js';
import { renderQuestion } from '../components/question.js';
import { confetti } from '../components/effects.js';
import { createCertificate } from '../components/certificate.js';
import { stageNav, stageLabel } from '../components/layout.js';

const MAX = CHALLENGE_QUESTIONS.length * POINTS.correctAnswer;

export const challengePage = {
  title: 'التحدي النهائي',
  render() {
    const el = html(`
      <div class="page challenge">
        <header class="page-head">
          <span class="eyebrow">${stageLabel('challenge')} · <span aria-hidden="true">🏆</span></span>
          <h1>🏆 التحدي النهائي</h1>
        </header>
        <div class="challenge-stage"></div>
        ${stageNav('challenge')}
      </div>`);

    const stage = el.querySelector('.challenge-stage');
    const qs = CHALLENGE_QUESTIONS;
    let i = 0;
    let correct = 0;

    const intro = () => {
      const card = html(`
        <section class="instructions glass challenge-intro">
          <div class="big-trophy" aria-hidden="true">🏆</div>
          <div class="instructions-body">
            <h2>هل أنت مستعد يا بطل؟</h2>
            <ul class="check-list">
              <li>التحدي فيه <strong>${num(qs.length)} أسئلة</strong> عن كل ما تعلمته في الرحلة.</li>
              <li>لكل سؤال <strong>محاولة واحدة</strong>، فاقرأ جيدًا وفكّر قبل أن تختار.</li>
              <li>كل إجابة صحيحة = <strong>${num(POINTS.correctAnswer)} نقاط</strong> و⭐ نجمة.</li>
              <li>إذا حصلت على <strong>${num(Math.round(CERTIFICATE_THRESHOLD * 100))}%</strong> أو أكثر تحصل على <strong>شهادة مستكشف حالات المادة</strong>! 📜</li>
            </ul>
            <button type="button" class="btn btn-primary btn-lg btn-start">🚀 ابدأ التحدي</button>
          </div>
        </section>`);
      card.querySelector('.btn-start').addEventListener('click', () => {
        i = 0;
        correct = 0;
        show();
      });
      stage.replaceChildren(card);
    };

    const show = () => {
      const q = qs[i];
      const wrap = html(`
        <div class="quiz">
          <div class="quiz-top">
            <div class="dots" role="progressbar" aria-label="التقدم في التحدي" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${i}">
              ${qs.map((_, k) => `<span class="${k < i ? 'done' : k === i ? 'now' : ''}"></span>`).join('')}
            </div>
            <span class="live-score">🎯 ${num(correct * POINTS.correctAnswer)} / ${num(MAX)}</span>
          </div>
          <div class="q-slot"></div>
          <div class="quiz-next" hidden>
            <button type="button" class="btn btn-primary btn-lg btn-next">${i < qs.length - 1 ? 'السؤال التالي ⬅️' : 'اعرض نتيجتي 🎉'}</button>
          </div>
        </div>`);
      const next = wrap.querySelector('.quiz-next');
      wrap.querySelector('.q-slot').appendChild(
        renderQuestion(q, {
          mode: 'test',
          keyPrefix: 'challenge',
          index: i + 1,
          total: qs.length,
          onDone: (ok) => {
            if (ok) correct++;
            wrap.querySelector('.live-score').textContent = `🎯 ${num(correct * POINTS.correctAnswer)} / ${num(MAX)}`;
            next.hidden = false;
            setTimeout(() => wrap.querySelector('.btn-next').focus({ preventScroll: true }), 300);
          },
        })
      );
      wrap.querySelector('.btn-next').addEventListener('click', () => {
        i++;
        if (i < qs.length) show();
        else results();
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      stage.replaceChildren(wrap);
    };

    const results = () => {
      const score = correct * POINTS.correctAnswer;
      const passed = score / MAX >= CERTIFICATE_THRESHOLD;
      store.setBestScore(score);
      store.completeStage('challenge');

      const stars = qs.map((_, k) => `<span class="${k < correct ? 'on' : ''}">${k < correct ? '⭐' : '☆'}</span>`).join('');
      const card = html(`
        <section class="result glass ${passed ? 'passed' : ''}" aria-labelledby="res-title">
          ${passed ? `<img class="result-img" src="${IMG.success}" alt="العالِم الصغير يرفع ميدالية ذهبية فرحًا" loading="lazy">` : ''}
          <h2 id="res-title">${passed ? 'أحسنت يا بطل! 🎉' : 'محاولة رائعة! 💪'}</h2>
          <p class="score-line">حصلت على <strong>${num(score)}</strong> من <strong>${num(MAX)}</strong></p>
          <div class="star-row" role="img" aria-label="حصلت على ${correct} نجوم من ${qs.length}">${stars}</div>
          <p>${passed
            ? 'لقد أثبتّ أنك مستكشف حقيقي لعالم حالات المادة. تستحق شهادة الإنجاز!'
            : `تحتاج إلى ${num(Math.ceil(CERTIFICATE_THRESHOLD * qs.length))} إجابات صحيحة للحصول على الشهادة. راجع الدروس ثم حاول مرة أخرى، أنت تستطيع!`}</p>
          <div class="result-actions">
            <a class="btn btn-primary btn-lg" href="#ending">🎉 إلى النهاية</a>
            <button type="button" class="btn btn-ghost btn-again">🔄 أعد التحدي</button>
          </div>
        </section>`);
      card.querySelector('.btn-again').addEventListener('click', intro);
      stage.replaceChildren(card);
      if (passed) {
        stage.appendChild(createCertificate({ score, max: MAX, stars: store.get().stars }));
        confetti(card);
      }
    };

    intro();
    return el;
  },
};
