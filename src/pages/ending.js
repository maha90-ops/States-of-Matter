/** الصفحة الختامية الاحتفالية + صفحة الشهادة */
import { html, num } from '../core/dom.js';
import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { IMG, POINTS, CERTIFICATE_THRESHOLD } from '../data/config.js';
import { STAGES } from '../data/stages.js';
import { CHALLENGE_QUESTIONS } from '../data/challengeQuestions.js';
import { createAudioButton } from '../components/audioPlayer.js';
import { createCertificate } from '../components/certificate.js';
import { confetti } from '../components/effects.js';

const MAX = CHALLENGE_QUESTIONS.length * POINTS.correctAnswer;
const hasCertificate = () => store.get().bestScore !== null && store.get().bestScore / MAX >= CERTIFICATE_THRESHOLD;

export const endingPage = {
  title: 'النهاية',
  render() {
    const s = store.get();
    const el = html(`
      <div class="page ending">
        <section class="ending-hero glass">
          <img class="ending-img" src="${IMG.success}" alt="العالِم الصغير يرفع ميدالية ذهبية عليها دورق مختبر، وحوله نجوم ذهبية" loading="lazy">
          <div class="ending-text">
            <h1>🎉 أحسنت يا مستكشف!</h1>
            <p class="lead">لقد تعرفت إلى حالات المادة وتعلمت كيف تتحول المادة من حالة إلى أخرى.</p>
            <div class="ending-audio"></div>
            <div class="ending-stats">
              <div class="stat"><span aria-hidden="true">⭐</span><strong>${num(s.stars)}</strong><small>نجمة</small></div>
              <div class="stat"><span aria-hidden="true">🏆</span><strong>${num(s.points)}</strong><small>نقطة</small></div>
              <div class="stat"><span aria-hidden="true">🗺️</span><strong>${num(s.completed.length)} / ${num(STAGES.length)}</strong><small>مراحل مكتملة</small></div>
            </div>
            ${store.allComplete() ? '' : '<p class="ending-note">💡 بقيت لديك محطات لم تكملها. أكملها لتحصل على مكافأة الرحلة الكاملة (+' + num(POINTS.journeyComplete) + ' نقطة)!</p>'}
            <div class="result-actions">
              <button type="button" class="btn btn-primary btn-lg btn-restart">🔄 أعد الرحلة</button>
              <a class="btn btn-secondary btn-lg" href="#results">📊 رحلتي التعليمية</a>
              <a class="btn btn-secondary btn-lg" href="#home">🏠 العودة إلى الرئيسية</a>
              ${hasCertificate() ? '<a class="btn btn-gold btn-lg" href="#certificate">📜 شهادتي</a>' : ''}
            </div>
          </div>
        </section>
      </div>`);

    el.querySelector('.ending-audio').appendChild(createAudioButton('ending', 'استمع إلى رسالة الختام'));
    el.querySelector('.btn-restart').addEventListener('click', () => {
      store.reset();
      router.go('home');
    });
    requestAnimationFrame(() => confetti(el.querySelector('.ending-hero')));
    return el;
  },
};

export const certificatePage = {
  title: 'شهادة الإنجاز',
  render() {
    const s = store.get();
    const el = html(`
      <div class="page certificate-page">
        <header class="page-head">
          <h1>📜 شهادة الإنجاز</h1>
        </header>
        <div class="cert-slot"></div>
      </div>`);
    const slot = el.querySelector('.cert-slot');
    if (hasCertificate()) {
      slot.appendChild(createCertificate({ score: s.bestScore, max: MAX, stars: s.stars }));
    } else {
      slot.appendChild(html(`
        <section class="result glass">
          <h2>لم تحصل على الشهادة بعد 🌱</h2>
          <p>أكمل التحدي النهائي بنتيجة ${num(Math.round(CERTIFICATE_THRESHOLD * 100))}% أو أكثر لتحصل على شهادة مستكشف حالات المادة.</p>
          <div class="result-actions"><a class="btn btn-primary btn-lg" href="#challenge">🏆 إلى التحدي النهائي</a></div>
        </section>`));
    }
    return el;
  },
};
