/** 📊 رحلتي التعليمية: لوحة إنجاز الطالب */
import { html, esc, num } from '../core/dom.js';
import { store } from '../core/store.js';
import { STAGES } from '../data/stages.js';
import { BADGES, GAMES } from '../data/extras.js';
import { CHALLENGE_QUESTIONS } from '../data/challengeQuestions.js';
import { POINTS } from '../data/config.js';
import { passedChallenge } from '../components/badges.js';

const MAX = CHALLENGE_QUESTIONS.length * POINTS.correctAnswer;

function rating(p) {
  if (p >= 90) return '🌟 عالم مادة ممتاز!';
  if (p >= 75) return '⭐ عالم مادة رائع!';
  if (p >= 50) return '👍 مستكشف مجتهد!';
  return '🌱 بداية جميلة، تابع رحلتك!';
}

export const resultsPage = {
  title: 'رحلتي التعليمية',
  render() {
    const s = store.get();
    const stagesPct = store.progress() * 100;
    const gamesDone = GAMES.filter((g) => s.games.includes(g.id)).length;
    const quizPct = s.bestScore === null ? 0 : (s.bestScore / MAX) * 100;
    // النسبة النهائية: ٤٠٪ للمحطات، ٢٠٪ للألعاب، ٤٠٪ للتحدي
    const finalPct = Math.round(stagesPct * 0.4 + (gamesDone / GAMES.length) * 100 * 0.2 + quizPct * 0.4);
    const statesDone = ['solid', 'liquid', 'gas'].filter((x) => s.completed.includes(x)).length;
    const status = (ok, partial) => (ok ? '<span class="st ok">✅ مكتمل</span>' : `<span class="st todo">⏳ ${partial || 'لم يكتمل بعد'}</span>`);

    const rows = [
      ['🌍', 'ما المادة؟', status(s.completed.includes('matter')), s.completed.includes('matter') ? 100 : 0],
      ['🧊', 'حالات المادة', status(statesDone === 3, `${num(statesDone)} من ${num(3)}`), (statesDone / 3) * 100],
      ['🔬', 'مختبر الجزيئات', status(s.completed.includes('lab')), s.completed.includes('lab') ? 100 : 0],
      ['🔥', 'التحولات', status(s.completed.includes('changes')), s.completed.includes('changes') ? 100 : 0],
      ['🎯', 'ألعاب المختبر', `<span class="st star">⭐ ${num(gamesDone)}/${num(GAMES.length)}</span>`, (gamesDone / GAMES.length) * 100],
      ['🧠', 'التدريب الذكي', s.adaptive?.peak ? `<span class="st star">${{ easy: '🌱 مبتدئ', medium: '🔬 مستكشف', hard: '👑 عالِم متقدم' }[s.adaptive.peak]}</span>` : status(false, 'لم تبدأ بعد'), s.adaptive?.peak ? { easy: 34, medium: 67, hard: 100 }[s.adaptive.peak] : 0],
      ['🎮', 'النشاط التفاعلي', status(s.completed.includes('activity')), s.completed.includes('activity') ? 100 : 0],
      ['🏆', 'التحدي النهائي', s.bestScore === null ? status(false, 'لم تبدأ بعد') : `<span class="st star">🎯 ${num(s.bestScore)}/${num(MAX)}</span>`, quizPct],
    ];

    return html(`
      <div class="page results">
        <header class="page-head">
          <span class="eyebrow">📊 لوحة الإنجاز</span>
          <h1>📊 رحلتي التعليمية</h1>
          <p class="lead">${s.name ? `أهلًا ${esc(s.name)}! ` : ''}هذه خلاصة ما أنجزتَه في رحلتك.</p>
        </header>

        <div class="res-grid">
          <section class="res-summary glass" aria-label="الملخص">
            <div class="ring" style="--p:${finalPct}" role="img" aria-label="النسبة النهائية ${num(finalPct)}٪">
              <strong>${num(finalPct)}٪</strong><small>النسبة النهائية</small>
            </div>
            <p class="res-rating">${rating(finalPct)}</p>
            <div class="res-tiles">
              <div><span aria-hidden="true">⭐</span><strong>${num(s.stars)}</strong><small>نجمة</small></div>
              <div><span aria-hidden="true">🏆</span><strong>${num(s.points)}</strong><small>نقطة</small></div>
              <div><span aria-hidden="true">🗺️</span><strong>${num(s.completed.length)}/${num(STAGES.length)}</strong><small>محطة</small></div>
            </div>
          </section>

          <section class="res-list glass" aria-labelledby="res-d">
            <h2 id="res-d" class="section-title">🗂️ تفاصيل الرحلة</h2>
            <ul class="res-rows">
              ${rows.map(([i, l, v, p]) => `
                <li><span class="res-label"><span aria-hidden="true">${i}</span> ${l}</span>
                <span class="res-bar" aria-hidden="true"><i style="width:${Math.round(p)}%"></i></span>${v}</li>`).join('')}
            </ul>
          </section>
        </div>

        <section class="glass badges-box" aria-labelledby="bdg">
          <h2 id="bdg" class="section-title">🏅 شاراتي (${num(s.badges.length)} من ${num(BADGES.length)})</h2>
          <ul class="badge-grid">
            ${BADGES.map((b) => {
              const has = s.badges.includes(b.id);
              return `<li class="bdg ${has ? 'earned' : ''}"><span class="badge-medal-sm" aria-hidden="true">${has ? b.icon : '🔒'}</span><strong>${esc(b.title)}</strong><small>${esc(b.desc)}</small><span class="sr-only">${has ? 'حصلت عليها' : 'لم تحصل عليها بعد'}</span></li>`;
            }).join('')}
          </ul>
        </section>

        <div class="result-actions">
          <a class="btn btn-primary btn-lg" href="#home-journey">🗺️ خريطة الرحلة</a>
          ${passedChallenge() ? '<a class="btn btn-gold btn-lg" href="#certificate">📜 شهادتي</a>' : '<a class="btn btn-secondary btn-lg" href="#challenge">🏆 إلى التحدي النهائي</a>'}
        </div>
      </div>`);
  },
};
