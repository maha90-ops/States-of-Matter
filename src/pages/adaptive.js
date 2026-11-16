/**
 * 🧠 التدريب الذكي: أسئلة تتكيّف مع مستوى الطالب (بدون إنترنت وبدون أي خدمة مدفوعة).
 * المنطق في components/adaptiveEngine.js، والأسئلة في data/adaptiveQuestions.js
 */
import { html, esc, num, announce, prefersReducedMotion } from '../core/dom.js';
import { store } from '../core/store.js';
import { STAGES } from '../data/stages.js';
import { CONCEPTS, LEVELS } from '../data/adaptiveQuestions.js';
import { createSession, ORDER } from '../components/adaptiveEngine.js';
import { renderQuestion } from '../components/question.js';
import { confetti, starBurst } from '../components/effects.js';
import { mascot, stageNav, stageLabel } from '../components/layout.js';

const LENGTH = 10;

const NOTES = {
  up: { easy: '', medium: '🚀 أحسنت! أجبت إجابتين صحيحتين متتاليتين، فارتفع مستواك إلى «مستكشف».', hard: '👑 رائع! ارتفع مستواك إلى «عالِم متقدم». الأسئلة الآن تحتاج إلى تفكير أعمق!' },
  down: '🌱 لا بأس! سنعود خطوة إلى الوراء، ونراجع الفكرة نفسها بسؤال أسهل.',
  stayRight: '✨ استمر! أجب إجابات صحيحة متتالية ليرتفع مستواك.',
  stayTop: '👑 ممتاز! أنت في أعلى مستوى. حافظ على هذا الإتقان!',
  stayWrong: '📘 لا بأس! اقرأ الشرح جيدًا، وسيأتيك سؤال آخر عن الفكرة نفسها.',
};

const ladder = (current) => `
  <ol class="ad-ladder" aria-label="مستويات التدريب">
    ${ORDER.map((lv) => `
      <li class="${lv === current ? 'now' : ''} ${ORDER.indexOf(lv) < ORDER.indexOf(current) ? 'passed' : ''}">
        <span class="ad-ladder-ico" aria-hidden="true">${LEVELS[lv].emoji}</span>
        <span>${LEVELS[lv].name}</span>
        ${lv === current ? '<span class="sr-only">(مستواك الحالي)</span>' : ''}
      </li>`).join('')}
  </ol>`;

/** مخطط مسار المستوى عبر الأسئلة (SVG بسيط) */
function pathChart(history) {
  const W = 520; const H = 150; const pad = 34;
  const n = history.length;
  const x = (i) => pad + (i * (W - pad * 2)) / Math.max(1, n - 1);
  const y = (lv) => H - 26 - ORDER.indexOf(lv) * ((H - 52) / 2);
  const pts = history.map((h, i) => `${x(i)},${y(h.level)}`).join(' ');
  return `
    <svg class="ad-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="مسار مستواك: ${history.map((h) => LEVELS[h.level].name).join('، ')}">
      ${ORDER.map((lv) => `<line x1="${pad}" x2="${W - pad}" y1="${y(lv)}" y2="${y(lv)}" class="ad-grid"/><text x="${W - 4}" y="${y(lv) + 5}" class="ad-axis">${LEVELS[lv].emoji}</text>`).join('')}
      <polyline points="${pts}" class="ad-line"/>
      ${history.map((h, i) => `<g><circle cx="${x(i)}" cy="${y(h.level)}" r="9" class="${h.correct ? 'ok' : 'no'}"/><text x="${x(i)}" y="${y(h.level) + 4}" class="ad-mark">${h.correct ? '✓' : '✗'}</text></g>`).join('')}
    </svg>`;
}

export const adaptivePage = {
  title: 'التدريب الذكي',
  render() {
    const el = html(`
      <div class="page adaptive">
        <header class="page-head">
          <span class="eyebrow">${stageLabel('adaptive')} · <span aria-hidden="true">🧠</span></span>
          <h1>🧠 التدريب الذكي</h1>
          <p class="lead">أسئلة تتغيّر حسب إجاباتك! إذا أجبت جيدًا تصبح الأسئلة أصعب، وإذا احتجت مساعدة نراجع الفكرة معًا بسؤال أسهل.</p>
        </header>
        <div class="ad-stage"></div>
        <div class="stage-done" ${store.isComplete('adaptive') ? '' : 'hidden'}><p>✅ أنهيت التدريب الذكي! أنت جاهز للتحدي النهائي.</p></div>
        ${stageNav('adaptive')}
      </div>`);
    const stage = el.querySelector('.ad-stage');
    let session;

    /* ---------- البداية ---------- */
    const intro = () => {
      const best = store.get().adaptive;
      stage.innerHTML = `
        <section class="ad-intro glass" aria-labelledby="ad-how">
          <h2 id="ad-how">كيف يعمل التدريب الذكي؟</h2>
          <div class="ad-levels">
            ${ORDER.map((lv, i) => `
              <div class="ad-level ad-${lv}">
                <span class="ad-level-ico" aria-hidden="true">${LEVELS[lv].emoji}</span>
                <strong>${LEVELS[lv].name}</strong>
                <small>${LEVELS[lv].desc}</small>
              </div>${i < 2 ? `<span class="ad-step" aria-hidden="true"><i>⬅️</i><small>${i === 0 ? '٢ صحيحتان' : '٣ صحيحة'}</small></span>` : ''}`).join('')}
          </div>
          <ul class="check-list">
            <li>تبدأ في مستوى <strong>🌱 مبتدئ</strong>.</li>
            <li>إجابتان صحيحتان متتاليتان ترفعانك إلى <strong>🔬 مستكشف</strong>، ثم ثلاث إجابات صحيحة متتالية ترفعك إلى <strong>👑 عالِم متقدم</strong>.</li>
            <li>إذا أخطأت، ننزل خطوة ونراجع <strong>الفكرة نفسها</strong> بسؤال أسهل.</li>
            <li>كل جلسة ${num(LENGTH)} أسئلة، ولكل سؤال محاولة واحدة. الأسئلة الأصعب تمنحك نقاطًا أكثر!</li>
          </ul>
          ${best && best.peak ? `<p class="ad-best">🏅 أعلى مستوى وصلت إليه: <strong>${LEVELS[best.peak].emoji} ${LEVELS[best.peak].name}</strong> · الجلسات: ${num(best.sessions)}</p>` : ''}
          <button type="button" class="btn btn-primary btn-lg" data-start>🚀 ابدأ التدريب</button>
        </section>
        ${mascot('لا تقلق من الخطأ! الخطأ هنا يساعدني على معرفة ما تحتاج أن نراجعه معًا 💪')}`;
      stage.querySelector('[data-start]').addEventListener('click', start);
    };

    const start = () => {
      session = createSession({ length: LENGTH });
      show();
    };

    /* ---------- السؤال ---------- */
    const show = () => {
      const q = session.next();
      if (!q) { results(); return; }
      const lv = session.level;
      stage.innerHTML = `
        <section class="ad-run" aria-label="التدريب الذكي">
          <div class="ad-top glass">
            <span class="ad-badge ad-${lv}"><span aria-hidden="true">${LEVELS[lv].emoji}</span> مستواك: ${LEVELS[lv].name}</span>
            <span class="ad-streak" aria-label="إجابات صحيحة متتالية: ${num(session.streak)}">${'🔥'.repeat(Math.min(session.streak, 5)) || '·'} <small>متتالية: ${num(session.streak)}</small></span>
            <span class="ad-count">السؤال ${num(session.index + 1)} من ${num(LENGTH)}</span>
          </div>
          ${ladder(lv)}
          <div class="dots" role="progressbar" aria-label="التقدم في التدريب" aria-valuemin="0" aria-valuemax="${LENGTH}" aria-valuenow="${session.index}">
            ${Array.from({ length: LENGTH }, (_, k) => {
              const h = session.history[k];
              return `<span class="${h ? (h.correct ? 'done' : 'miss') : k === session.index ? 'now' : ''}"></span>`;
            }).join('')}
          </div>
          <p class="ad-concept"><span aria-hidden="true">${CONCEPTS[q.concept].emoji}</span> الفكرة: ${CONCEPTS[q.concept].name}</p>
          <div class="q-slot"></div>
          <div class="ad-note" role="status" hidden></div>
          <div class="quiz-next" hidden><button type="button" class="btn btn-primary btn-lg btn-next">${session.index + 1 < LENGTH ? 'السؤال التالي ⬅️' : 'اعرض تقريري 📊'}</button></div>
        </section>`;
      const note = stage.querySelector('.ad-note');
      const next = stage.querySelector('.quiz-next');
      stage.querySelector('.q-slot').appendChild(renderQuestion(q, {
        mode: 'test',
        keyPrefix: 'adaptive',
        onDone: (ok) => {
          if (ok && LEVELS[q.level].bonus) store.awardOnce(`adaptive-bonus:${q.id}`, LEVELS[q.level].bonus, 0, `مكافأة سؤال ${LEVELS[q.level].name}`);
          const r = session.answer(q, ok);
          const text = r.change === 'up' ? NOTES.up[r.level] : r.change === 'down' ? NOTES.down : ok ? (r.level === 'hard' ? NOTES.stayTop : NOTES.stayRight) : NOTES.stayWrong;
          note.className = `ad-note ${r.change}`;
          note.textContent = text;
          note.hidden = false;
          if (r.change === 'up') starBurst(note);
          announce(text);
          next.hidden = false;
          setTimeout(() => stage.querySelector('.btn-next').focus({ preventScroll: true }), 300);
        },
      }));
      stage.querySelector('.btn-next').addEventListener('click', () => {
        if (session.done) results(); else show();
        stage.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      });
    };

    /* ---------- التقرير ---------- */
    const results = () => {
      const h = session.history;
      const right = h.filter((x) => x.correct).length;
      const m = session.mastery();
      const peak = session.peak;
      store.recordAdaptive(peak);
      store.completeStage('adaptive');
      el.querySelector('.stage-done').hidden = false;
      el.querySelector('.next-stage')?.classList.add('pulse');

      const weak = Object.entries(m).filter(([, v]) => v.right < v.total).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total);
      const stageOf = (c) => STAGES.find((s) => s.id === CONCEPTS[c].stage);
      stage.innerHTML = `
        <section class="result glass ad-report" aria-labelledby="ad-res">
          <h2 id="ad-res">${peak === 'hard' ? '👑 وصلت إلى مستوى العالِم المتقدم!' : peak === 'medium' ? '🔬 أصبحت مستكشفًا ماهرًا!' : '🌱 بداية جميلة! هيا نتدرّب أكثر.'}</h2>
          <div class="ad-tiles">
            <div><span aria-hidden="true">🎯</span><strong>${num(right)} / ${num(h.length)}</strong><small>إجابات صحيحة</small></div>
            <div><span aria-hidden="true">${LEVELS[peak].emoji}</span><strong>${LEVELS[peak].name}</strong><small>أعلى مستوى</small></div>
            <div><span aria-hidden="true">${LEVELS[session.level].emoji}</span><strong>${LEVELS[session.level].name}</strong><small>مستواك الآن</small></div>
          </div>
          <h3>📈 مسار مستواك في الجلسة</h3>
          ${pathChart(h)}
          <h3>🧩 إتقانك لكل فكرة</h3>
          <ul class="ad-mastery">
            ${Object.keys(CONCEPTS).filter((c) => m[c]).map((c) => {
              const v = m[c]; const p = Math.round((v.right / v.total) * 100);
              return `<li><span class="ad-m-label"><span aria-hidden="true">${CONCEPTS[c].emoji}</span> ${CONCEPTS[c].name}</span>
                <span class="res-bar" aria-hidden="true"><i style="width:${p}%"></i></span>
                <span class="ad-m-val">${num(v.right)} من ${num(v.total)} ${p === 100 ? '⭐' : ''}</span></li>`;
            }).join('')}
          </ul>
          ${weak.length ? `
            <div class="ad-tip">
              <p>💡 <strong>أنصحك بمراجعة:</strong></p>
              <div class="result-actions">${[...new Set(weak.map(([c]) => c))].slice(0, 2).map((c) => { const st = stageOf(c); return `<a class="btn btn-secondary" href="#${st.route}">${st.emoji} ${esc(st.title)} (${CONCEPTS[c].name})</a>`; }).join('')}</div>
            </div>` : '<p class="ad-tip">🌟 أتقنت كل الأفكار في هذه الجلسة!</p>'}
          <div class="result-actions">
            <button type="button" class="btn btn-primary btn-lg" data-again>🔄 جلسة جديدة</button>
            <a class="btn btn-gold btn-lg" href="#challenge">🏆 إلى التحدي النهائي</a>
          </div>
        </section>`;
      stage.querySelector('[data-again]').addEventListener('click', start);
      if (peak !== 'easy') confetti(stage.querySelector('.ad-report'));
      stage.querySelector('#ad-res').setAttribute('tabindex', '-1');
      stage.querySelector('#ad-res').focus({ preventScroll: true });
    };

    intro();
    return el;
  },
};
