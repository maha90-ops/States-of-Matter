/** ألعاب المختبر: اصطد الجسيمات السريعة، صائد الجسيمات، أنقذ المختبر */
import { html, esc, num, shuffle, announce, prefersReducedMotion } from '../core/dom.js';
import { store } from '../core/store.js';
import { GAMES, RESCUE_ROUNDS } from '../data/extras.js';
import { ThermoSim } from '../components/thermoSim.js';
import { renderQuestion } from '../components/question.js';
import { starBurst, confetti } from '../components/effects.js';
import { playSfx } from '../components/audioPlayer.js';
import { stageNav, stageLabel, mascot } from '../components/layout.js';

const NAMES = { solid: '🧊 الحالة الصلبة', liquid: '💧 الحالة السائلة', gas: '💨 الحالة الغازية' };
const DESC = {
  solid: 'جسيمات متقاربة ومرتبة تهتز في مكانها',
  liquid: 'جسيمات متقاربة تنزلق وتتجمع في القاع',
  gas: 'جسيمات متباعدة سريعة تملأ الوعاء',
};

/* ---------- ١. اصطد الجسيمات السريعة ---------- */
function gameCatch(box, win) {
  const FAST = 4; const SLOW = 8; const SIZE = 44;
  box.innerHTML = `
    <p class="game-tip">👆 اضغط على الجسيمات <strong>السريعة</strong>: إنها تترك خطًا مضيئًا خلفها.</p>
    <div class="arena" role="group" aria-label="ساحة جسيمات الغاز"></div>
    <p class="game-count" aria-live="polite"></p>
    <div class="q-feedback" role="status"></div>`;
  const arena = box.querySelector('.arena');
  const fb = box.querySelector('.q-feedback');
  const countEl = box.querySelector('.game-count');
  let W = arena.clientWidth; let H = arena.clientHeight;
  let caught = 0; let raf = 0;
  const parts = Array.from({ length: FAST + SLOW }, (_, i) => {
    const fast = i < FAST;
    const a = Math.random() * Math.PI * 2;
    const sp = fast ? 2.6 + Math.random() * 0.8 : 0.35 + Math.random() * 0.25;
    const b = html(`<button type="button" class="mol ${fast ? 'fast' : 'slow'}" aria-label="${fast ? 'جسيم يتحرك بسرعة' : 'جسيم يتحرك ببطء'}"><span class="mol-tail" aria-hidden="true"></span><span class="mol-dot" aria-hidden="true"></span></button>`);
    return { b, fast, x: Math.random() * (W - SIZE), y: Math.random() * (H - SIZE), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, caught: false };
  });
  shuffle(parts).forEach((p) => arena.appendChild(p.b));
  const paint = () => { countEl.innerHTML = `🎯 اصطدتَ <strong>${num(caught)}</strong> من <strong>${num(FAST)}</strong>`; };
  paint();
  parts.forEach((p) => p.b.addEventListener('click', () => {
    if (p.caught) return;
    if (p.fast) {
      p.caught = true; caught++;
      p.b.classList.add('caught');
      p.b.setAttribute('aria-label', 'جسيم سريع: تم اصطياده ✓');
      fb.className = 'q-feedback ok';
      fb.innerHTML = '<strong>أمسكتَه! 🎯</strong><span>هذا جسيم غاز سريع جدًا.</span>';
      store.correct(`catch:${caught}`);
      starBurst(p.b); playSfx('correct'); paint();
      if (caught === FAST) setTimeout(() => win('اصطدتَ كل الجسيمات السريعة! جسيمات الغاز تتحرك بسرعة كبيرة في كل الاتجاهات.'), 500);
    } else {
      fb.className = 'q-feedback retry nudge';
      fb.innerHTML = '<strong>هذا جسيم بطيء 💡</strong><span>ابحث عن الجسيمات السريعة التي تترك خطًا خلفها!</span>';
      playSfx('tryAgain');
    }
  }));
  let last = performance.now();
  const frame = (t) => {
    const f = Math.min((t - last) / 16.67, 3) * (prefersReducedMotion() ? 0.35 : 1);
    last = t;
    parts.forEach((p) => {
      if (!p.caught) {
        p.x += p.vx * f; p.y += p.vy * f;
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x > W - SIZE) { p.x = W - SIZE; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        if (p.y > H - SIZE) { p.y = H - SIZE; p.vy = -Math.abs(p.vy); }
      }
      p.b.style.transform = `translate(${p.x}px, ${p.y}px)`;
      p.b.style.setProperty('--ang', `${Math.atan2(p.vy, p.vx)}rad`);
    });
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const onResize = () => { W = arena.clientWidth; H = arena.clientHeight; };
  window.addEventListener('resize', onResize);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
}

/* ---------- ٢. صائد الجسيمات ---------- */
function gameHunter(box, win) {
  const rounds = shuffle(['solid', 'liquid', 'gas']);
  let r = 0; let sims = [];
  const kill = () => { sims.forEach((s) => s.destroy()); sims = []; };
  const round = () => {
    kill();
    const target = rounds[r];
    const order = shuffle(['solid', 'liquid', 'gas']);
    box.innerHTML = `
      <p class="game-count">الجولة ${num(r + 1)} من ${num(rounds.length)}</p>
      <h3 class="hunter-q">اختر الوعاء الذي تمثّل جسيماته <span class="hunt-word">${NAMES[target]}</span></h3>
      <div class="hunter-grid">
        ${order.map((m, i) => `
          <button type="button" class="hunter-box" data-m="${m}" aria-label="الوعاء ${num(i + 1)}: ${DESC[m]}">
            <span class="sim-canvas-wrap" style="--sim-h:170px"><canvas class="sim-canvas" aria-hidden="true"></canvas></span>
            <span class="hunter-num" aria-hidden="true">${num(i + 1)}</span>
          </button>`).join('')}
      </div>
      <div class="q-feedback" role="status"></div>
      <div class="game-next"></div>`;
    const fb = box.querySelector('.q-feedback');
    box.querySelectorAll('.hunter-box').forEach((b) => {
      sims.push(new ThermoSim(b.querySelector('canvas'), { mode: b.dataset.m, cols: 5, rows: 4, temperature: 55 }));
      b.addEventListener('click', () => {
        if (b.classList.contains('right') || b.classList.contains('nope')) return;
        if (b.dataset.m === target) {
          b.classList.add('right');
          box.querySelectorAll('.hunter-box').forEach((x) => { x.disabled = x !== b; });
          store.correct(`hunter:${target}`);
          fb.className = 'q-feedback ok';
          fb.innerHTML = `<strong>صحيح! 🎉</strong><span>${DESC[target]}، وهذه هي ${NAMES[target].slice(3)}.</span>`;
          starBurst(b); playSfx('correct');
          const last = r === rounds.length - 1;
          const nb = html(`<button type="button" class="btn btn-primary">${last ? 'أنهيت الصيد 🎉' : 'الجولة التالية ⬅️'}</button>`);
          box.querySelector('.game-next').appendChild(nb);
          nb.addEventListener('click', () => { if (last) { kill(); win('أنت صائد جسيمات ماهر! ميّزت الحالات الثلاث من حركة جسيماتها.'); } else { r++; round(); } });
          nb.focus({ preventScroll: true });
        } else {
          b.classList.add('nope');
          fb.className = 'q-feedback retry nudge';
          fb.innerHTML = `<strong>حاول مرة أخرى 💡</strong><span>في هذا الوعاء ${DESC[b.dataset.m]}، وهذه ${NAMES[b.dataset.m].slice(3)}.</span>`;
          playSfx('tryAgain');
        }
      });
    });
  };
  round();
  return kill;
}

/* ---------- ٣. أنقذ المختبر ---------- */
function gameRescue(box, win) {
  let r = 0;
  const round = () => {
    const R = RESCUE_ROUNDS[r];
    box.innerHTML = `
      <div class="rescue-lights" aria-hidden="true">${RESCUE_ROUNDS.map((_, k) => `<span class="${k < r ? 'on' : ''}"></span>`).join('')}</div>
      <div class="alarm ${R.heat ? 'warm' : 'cool'}" role="alert"><span class="siren" aria-hidden="true">🚨</span> <strong>${esc(R.alarm)}</strong></div>
      <p class="game-tip">ساعد العالِم الصغير في تحديد ما سيحدث للمادة!</p>
      <div class="q-slot"></div>
      <div class="game-next"></div>`;
    box.querySelector('.q-slot').appendChild(renderQuestion(
      { id: R.id, type: 'mcq', prompt: R.prompt, options: R.options, visual: R.visual, hint: R.hint, explain: R.explain },
      {
        mode: 'practice', keyPrefix: 'rescue', index: r + 1, total: RESCUE_ROUNDS.length,
        onDone: () => {
          box.querySelectorAll('.rescue-lights span')[r].classList.add('on');
          const last = r === RESCUE_ROUNDS.length - 1;
          const nb = html(`<button type="button" class="btn btn-primary">${last ? 'تم إنقاذ المختبر! 🎉' : 'المشكلة التالية ⬅️'}</button>`);
          box.querySelector('.game-next').appendChild(nb);
          nb.addEventListener('click', () => { if (last) win('أنقذتَ المختبر من كل المشكلات! أنت تعرف ماذا تفعل الحرارة والبرودة بالمادة.'); else { r++; round(); } });
          nb.focus({ preventScroll: true });
        },
      }));
  };
  round();
}

const IMPL = { catch: gameCatch, hunter: gameHunter, rescue: gameRescue };

export const gamesPage = {
  title: 'ألعاب المختبر',
  render() {
    const el = html(`
      <div class="page games">
        <header class="page-head">
          <span class="eyebrow">${stageLabel('games')} · <span aria-hidden="true">🎯</span></span>
          <h1>🎯 ألعاب المختبر</h1>
          <p class="lead">ثلاث ألعاب سريعة تختبر فيها عينك العلمية! كل لعبة تمنحك ⭐ نجمة و٢٠ نقطة.</p>
        </header>
        <div class="games-stage"></div>
        ${mascot('العب كل الألعاب الثلاث لتحصل على شارة «بطل الألعاب» 🎯')}
        <div class="stage-done" ${store.isComplete('games') ? '' : 'hidden'}><p>✅ أنهيت ألعاب المختبر! أنت جاهز للنشاط التفاعلي.</p></div>
        ${stageNav('games')}
      </div>`);
    const stage = el.querySelector('.games-stage');
    let stop = null;
    const cleanup = () => { if (stop) { stop(); stop = null; } };

    const hub = () => {
      cleanup();
      const s = store.get();
      stage.innerHTML = `
        <p class="games-progress">⭐ أنهيت <strong>${num(GAMES.filter((g) => s.games.includes(g.id)).length)}</strong> من <strong>${num(GAMES.length)}</strong> ألعاب</p>
        <ul class="games-grid">
          ${GAMES.map((g, i) => {
            const done = s.games.includes(g.id);
            return `<li><button type="button" class="game-card glass ${done ? 'done' : ''}" data-g="${g.id}">
              <span class="game-num" aria-hidden="true">${num(i + 1)}</span>
              <span class="game-emoji" aria-hidden="true">${g.emoji}</span>
              <span class="game-title">${esc(g.title)}</span>
              <span class="game-desc">${esc(g.desc)}</span>
              <span class="game-state">${done ? '✅ أنهيتها: العب مجددًا' : '▶️ العب'}</span>
            </button></li>`;
          }).join('')}
        </ul>`;
      stage.querySelectorAll('.game-card').forEach((b) => b.addEventListener('click', () => open(b.dataset.g)));
      if (GAMES.every((g) => s.games.includes(g.id)) && !store.isComplete('games')) finishStage();
    };

    const open = (id) => {
      cleanup();
      const g = GAMES.find((x) => x.id === id);
      stage.innerHTML = `
        <section class="game-view glass" aria-labelledby="gv-title">
          <div class="game-bar">
            <button type="button" class="btn btn-ghost btn-small" data-back>➡️ العودة إلى الألعاب</button>
            <h2 id="gv-title" tabindex="-1"><span aria-hidden="true">${g.emoji}</span> ${esc(g.title)}</h2>
          </div>
          <div class="game-body"></div>
        </section>`;
      stage.querySelector('[data-back]').addEventListener('click', hub);
      stage.querySelector('#gv-title').focus({ preventScroll: true });
      stage.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      stop = IMPL[id](stage.querySelector('.game-body'), (msg) => win(id, msg)) || null;
    };

    const win = (id, msg) => {
      cleanup();
      store.completeGame(id);
      const body = stage.querySelector('.game-body');
      body.innerHTML = `
        <div class="game-win" role="status">
          <span class="game-win-ico" aria-hidden="true">🏆</span>
          <p class="game-win-msg">${esc(msg)}</p>
          <button type="button" class="btn btn-primary btn-lg" data-back2>العودة إلى الألعاب ⬅️</button>
        </div>`;
      confetti(body);
      announce(msg);
      body.querySelector('[data-back2]').addEventListener('click', hub);
      body.querySelector('[data-back2]').focus({ preventScroll: true });
      if (GAMES.every((g) => store.get().games.includes(g.id))) finishStage();
    };

    const finishStage = () => {
      store.completeStage('games');
      el.querySelector('.stage-done').hidden = false;
      el.querySelector('.next-stage')?.classList.add('pulse');
    };

    hub();
    return { el, cleanup };
  },
};
