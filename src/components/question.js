/**
 * محرك الأسئلة: يعرض أي سؤال من ملفات البيانات حسب نوعه.
 *
 * mode = 'practice' : إعادة المحاولة مسموحة، مع تلميح. لا عقاب على الخطأ.
 * mode = 'test'     : محاولة واحدة، ثم تظهر الإجابة الصحيحة.
 *
 * onDone(correct) تُستدعى عند انتهاء السؤال.
 */
import { esc, html, img, shuffle, announce, $$ } from '../core/dom.js';
import { store } from '../core/store.js';
import { playSfx } from './audioPlayer.js';
import { starBurst } from './effects.js';

export const MESSAGES = {
  correct: 'أحسنت يا بطل! 🌟',
  tryAgain: 'حاول مرة أخرى، ولا تيأس! 💪',
  testWrong: 'لا بأس، تعلّمنا شيئًا جديدًا! 💡',
};

const TYPE_LABEL = {
  mcq: '🔘 اختيار من متعدد',
  image: '🖼️ سؤال بالصورة',
  process: '🔄 حدّد نوع التحوّل',
  truefalse: '✔️ صح أم خطأ',
  classify: '🗂️ صنّف المواد',
  match: '🔗 صِل كل حالة بوصفها',
};

const BINS = {
  solid: { emoji: '🧊', name: 'صلب' },
  liquid: { emoji: '💧', name: 'سائل' },
  gas: { emoji: '💨', name: 'غاز' },
};

export function renderQuestion(q, { mode = 'practice', keyPrefix = 'q', onDone = () => {}, index, total } = {}) {
  const hasImageOptions = q.options?.some((o) => o.image);
  const label = TYPE_LABEL[hasImageOptions ? 'image' : q.type] || '';

  const el = html(`
    <article class="q-card glass" aria-labelledby="q-${q.id}">
      <div class="q-head">
        <span class="q-type">${label}</span>
        ${index ? `<span class="q-count">السؤال ${index} من ${total}</span>` : ''}
      </div>
      ${q.image ? `<figure class="q-figure">${img(q.image, q.imageAlt || '')}</figure>` : ''}
      ${q.visual ? `<div class="q-visual" aria-hidden="true">${esc(q.visual)}</div>` : ''}
      <h3 class="q-prompt" id="q-${q.id}">${esc(q.prompt)}</h3>
      <div class="q-body"></div>
      <div class="q-feedback" role="status" aria-live="polite"></div>
      ${mode === 'practice' && q.hint ? `
        <div class="q-tools">
          <button type="button" class="btn btn-ghost btn-hint">💡 تلميح</button>
          <p class="q-hint" hidden>${esc(q.hint)}</p>
        </div>` : ''}
    </article>`);

  const body = el.querySelector('.q-body');
  const fb = el.querySelector('.q-feedback');
  const key = `${keyPrefix}:${q.id}`;
  let finished = false;

  const hintBtn = el.querySelector('.btn-hint');
  hintBtn?.addEventListener('click', () => {
    const h = el.querySelector('.q-hint');
    h.hidden = false;
    hintBtn.disabled = true;
    playSfx('hint');
  });

  /* ----- التغذية الراجعة ----- */
  const success = (anchor) => {
    finished = true;
    el.classList.add('is-correct');
    fb.className = 'q-feedback ok';
    fb.innerHTML = `<strong>${MESSAGES.correct}</strong>${q.explain ? `<span>${esc(q.explain)}</span>` : ''}`;
    store.correct(key);
    starBurst(anchor || fb);
    playSfx('correct');
    onDone(true);
  };

  const retry = () => {
    fb.className = 'q-feedback retry';
    fb.innerHTML = `<strong>${MESSAGES.tryAgain}</strong>`;
    // إعادة تشغيل حركة الاهتزاز للرسالة
    fb.classList.remove('nudge');
    void fb.offsetWidth;
    fb.classList.add('nudge');
    playSfx('tryAgain');
    announce(MESSAGES.tryAgain);
  };

  const testFail = (correctText) => {
    finished = true;
    el.classList.add('is-wrong');
    fb.className = 'q-feedback info';
    fb.innerHTML = `<strong>${MESSAGES.testWrong}</strong><span>الإجابة الصحيحة: ${esc(correctText)}.${q.explain ? ' ' + esc(q.explain) : ''}</span>`;
    playSfx('tryAgain');
    onDone(false);
  };

  /* ----- الأنواع ----- */
  if (q.type === 'truefalse') {
    q = {
      ...q,
      options: [
        { text: 'صح', emoji: '✔️', correct: q.answer === true },
        { text: 'خطأ', emoji: '✖️', correct: q.answer === false },
      ],
    };
  }

  if (q.options) {
    const opts = q.type === 'truefalse' ? q.options : q.options;
    body.innerHTML = `<div class="options ${hasImageOptions ? 'options-img' : ''} ${q.type === 'truefalse' ? 'options-tf' : ''}" role="group" aria-label="الخيارات">
      ${opts.map((o, i) => `
        <button type="button" class="option" data-i="${i}">
          ${o.image ? img(o.image, o.imageAlt || o.text, 'option-img') : ''}
          ${o.emoji ? `<span class="option-emoji" aria-hidden="true">${o.emoji}</span>` : ''}
          <span class="option-text">${esc(o.text)}</span>
          <span class="option-mark" aria-hidden="true"></span>
        </button>`).join('')}
    </div>`;

    const buttons = $$('.option', body);
    const correctIdx = opts.findIndex((o) => o.correct);

    buttons.forEach((b) =>
      b.addEventListener('click', () => {
        if (finished) return;
        const i = Number(b.dataset.i);
        if (i === correctIdx) {
          b.classList.add('correct');
          b.querySelector('.option-mark').textContent = '✓';
          b.setAttribute('aria-label', `${opts[i].text}: إجابة صحيحة`);
          buttons.forEach((x) => (x.disabled = true));
          success(b);
        } else if (mode === 'practice') {
          b.classList.add('wrong');
          b.disabled = true;
          b.querySelector('.option-mark').textContent = '✗';
          b.setAttribute('aria-label', `${opts[i].text}: ليست الإجابة الصحيحة`);
          retry();
        } else {
          b.classList.add('wrong');
          b.querySelector('.option-mark').textContent = '✗';
          const c = buttons[correctIdx];
          c.classList.add('correct', 'reveal');
          c.querySelector('.option-mark').textContent = '✓';
          buttons.forEach((x) => (x.disabled = true));
          testFail(opts[correctIdx].text);
        }
      })
    );
  } else if (q.type === 'classify') {
    buildClassify(q, body, { success, retry, isFinished: () => finished });
  } else if (q.type === 'match') {
    buildMatch(q, body, { success, retry, isFinished: () => finished });
  }

  return el;
}

/* ---------- التصنيف ---------- */
function buildClassify(q, body, { success, retry }) {
  const items = shuffle(q.items.map((it, i) => ({ ...it, i })));
  body.innerHTML = `
    <div class="classify">
      <div class="pool" aria-label="المواد التي لم تُصنَّف بعد">
        ${items.map((it) => `
          <button type="button" class="chip" data-i="${it.i}" aria-pressed="false">
            <span aria-hidden="true">${it.emoji}</span> ${esc(it.text)}
          </button>`).join('')}
      </div>
      <div class="bins">
        ${Object.entries(BINS).map(([id, b]) => `
          <div class="bin bin-${id}">
            <button type="button" class="bin-target" data-bin="${id}">
              <span class="bin-emoji" aria-hidden="true">${b.emoji}</span>
              <span>ضع هنا: <strong>${b.name}</strong></span>
            </button>
            <div class="bin-items" aria-label="مواد ${b.name}"></div>
          </div>`).join('')}
      </div>
      <button type="button" class="btn btn-primary btn-check" disabled>✔ تحقّق من إجابتي</button>
    </div>`;

  const pool = body.querySelector('.pool');
  const check = body.querySelector('.btn-check');
  let selected = null;

  const select = (chip) => {
    if (chip.classList.contains('locked')) return;
    $$('.chip', body).forEach((c) => c.setAttribute('aria-pressed', 'false'));
    selected = selected === chip ? null : chip;
    selected?.setAttribute('aria-pressed', 'true');
    body.querySelector('.classify').classList.toggle('picking', !!selected);
  };

  const updateCheck = () => {
    check.disabled = pool.querySelectorAll('.chip').length > 0;
  };

  body.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) return select(chip);
    const target = e.target.closest('.bin-target');
    if (target && selected) {
      target.parentElement.querySelector('.bin-items').appendChild(selected);
      selected.setAttribute('aria-pressed', 'false');
      selected.dataset.bin = target.dataset.bin;
      selected.classList.remove('wrong');
      selected = null;
      body.querySelector('.classify').classList.remove('picking');
      updateCheck();
      check.disabled || check.focus();
    } else if (target && !selected) {
      announce('اختر مادة أولًا، ثم اختر الصندوق.');
    }
  });

  check.addEventListener('click', () => {
    let wrong = 0;
    $$('.bin-items .chip', body).forEach((chip) => {
      const it = q.items[Number(chip.dataset.i)];
      if (chip.dataset.bin === it.bin) {
        chip.classList.add('locked', 'correct');
        chip.disabled = true;
      } else {
        wrong++;
        chip.classList.add('wrong');
        pool.appendChild(chip); // إعادة المادة لمحاولة جديدة
      }
    });
    if (wrong === 0) {
      check.disabled = true;
      check.hidden = true;
      success(check.closest('.classify'));
    } else {
      updateCheck();
      retry();
      const fb = body.parentElement.querySelector('.q-feedback');
      fb.insertAdjacentHTML('beforeend', `<span>أعدنا ${wrong === 1 ? 'مادة واحدة' : wrong === 2 ? 'مادتين' : `${wrong} مواد`} إلى الأعلى، فكّر فيها من جديد.</span>`);
    }
  });
}

/* ---------- المطابقة ---------- */
function buildMatch(q, body, { success, retry }) {
  const rights = shuffle(q.pairs.map((p, i) => ({ ...p.right, i })));
  body.innerHTML = `
    <div class="match">
      <div class="match-col">
        ${q.pairs.map((p, i) => `
          <button type="button" class="match-item left" data-i="${i}" aria-pressed="false">
            <span class="match-emoji" aria-hidden="true">${p.left.emoji || ''}</span>${esc(p.left.text)}
            <span class="match-badge" aria-hidden="true"></span>
          </button>`).join('')}
      </div>
      <div class="match-col">
        ${rights.map((r) => `
          <button type="button" class="match-item right" data-i="${r.i}" aria-pressed="false">
            ${esc(r.text)}
            <span class="match-badge" aria-hidden="true"></span>
          </button>`).join('')}
      </div>
    </div>`;

  let selL = null;
  let selR = null;
  let matched = 0;

  const clear = () => {
    [selL, selR].forEach((b) => b?.setAttribute('aria-pressed', 'false'));
    selL = selR = null;
  };

  body.addEventListener('click', (e) => {
    const b = e.target.closest('.match-item');
    if (!b || b.classList.contains('locked')) return;
    const side = b.classList.contains('left') ? 'L' : 'R';
    if (side === 'L') {
      selL?.setAttribute('aria-pressed', 'false');
      selL = selL === b ? null : b;
    } else {
      selR?.setAttribute('aria-pressed', 'false');
      selR = selR === b ? null : b;
    }
    b.setAttribute('aria-pressed', String(b === selL || b === selR));

    if (selL && selR) {
      if (selL.dataset.i === selR.dataset.i) {
        matched++;
        [selL, selR].forEach((x) => {
          x.classList.add('locked', `pair-${matched}`);
          x.querySelector('.match-badge').textContent = matched;
          x.disabled = true;
        });
        clear();
        if (matched === q.pairs.length) success(body.querySelector('.match'));
        else announce('توصيل صحيح! أكمل البقية.');
      } else {
        const a = selL;
        const c = selR;
        [a, c].forEach((x) => x.classList.add('wrong'));
        setTimeout(() => [a, c].forEach((x) => x.classList.remove('wrong')), 600);
        clear();
        retry();
      }
    }
  });
}
