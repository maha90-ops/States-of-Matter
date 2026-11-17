/**
 * 💬 المساعد الذكي «العالِم الصغير»
 * - يجيب عن أسئلة الطالب عن حالات المادة (قاعدة معرفة محلية، بلا إنترنت).
 * - يعطي تلميحات متدرجة حسب الصفحة الحالية.
 * - لا يعطي إجابات أثناء التحدي النهائي والتدريب الذكي (تقييم).
 * - يحفظ الأسئلة التي لم يعرف إجابتها على الجهاز ليراها المعلم.
 */
import { html, esc, announce, prefersReducedMotion } from '../core/dom.js';
import { IMG } from '../data/config.js';
import { PAGE_HINTS, PAGE_SUGGESTIONS } from '../data/assistantKB.js';
import { understand, byId, isMeta } from './assistantBrain.js';

const UNANSWERED_KEY = 'matter-assistant-unanswered';
const SEEN_KEY = 'matter-assistant-seen';
const LOCKED = { challenge: 'التحدي النهائي', adaptive: 'التدريب الذكي' };
const MAX_LEN = 200;

let page = 'home';
let panel; let fab; let log; let input; let chips;
const hintStep = {};

/* ---------- الأسئلة التي لم يُجب عنها (للمعلم) ---------- */
export function getUnanswered() {
  try { return JSON.parse(localStorage.getItem(UNANSWERED_KEY) || '[]'); } catch (_) { return []; }
}
export function clearUnanswered() {
  try { localStorage.removeItem(UNANSWERED_KEY); } catch (_) { /* تجاهل */ }
}
function remember(q) {
  try {
    const list = getUnanswered().filter((x) => x.q !== q);
    list.unshift({ q, page, at: Date.now() });
    localStorage.setItem(UNANSWERED_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (_) { /* تجاهل */ }
}

/* ---------- الرسائل ---------- */
function add(who, inner) {
  const m = html(`<div class="as-msg as-${who}">${who === 'bot' ? `<img class="as-ava" src="${IMG.avatar}" alt="" aria-hidden="true">` : ''}<div class="as-bubble"></div></div>`);
  const b = m.querySelector('.as-bubble');
  if (typeof inner === 'string') b.innerHTML = inner; else b.appendChild(inner);
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
  return m;
}

function botSay(inner, plain) {
  const typing = add('bot', '<span class="as-typing" aria-label="يكتب"><i></i><i></i><i></i></span>');
  const delay = prefersReducedMotion() ? 0 : 550;
  setTimeout(() => {
    typing.remove();
    add('bot', inner);
    if (plain) announce(`العالِم الصغير: ${plain}`);
  }, delay);
}

const chipBtn = (e) => `<button type="button" class="as-chip" data-ask="${e.id}">${esc(e.q)}</button>`;

function answerHtml(entry, also) {
  const rel = (entry.related || []).map(byId).filter(Boolean).slice(0, 3);
  return `
    <p>${esc(entry.a)}</p>
    ${entry.link ? `<a class="as-link" href="#${entry.link.route}">${esc(entry.link.label)}</a>` : ''}
    ${also ? `<p class="as-also">ربما تقصد أيضًا:</p><div class="as-chips">${chipBtn(also)}</div>` : ''}
    ${rel.length ? `<p class="as-also">أسئلة قريبة:</p><div class="as-chips">${rel.map(chipBtn).join('')}</div>` : ''}`;
}

function reply(text, entryFromChip) {
  if (entryFromChip) {
    if (LOCKED[page] && !isMeta(entryFromChip)) return lockedMsg();
    botSay(answerHtml(entryFromChip), entryFromChip.a);
    return;
  }
  const r = understand(text);
  if (r.type === 'answer') {
    if (LOCKED[page] && !isMeta(r.entry)) return lockedMsg();
    botSay(answerHtml(r.entry, r.also), r.entry.a);
  } else if (r.type === 'maybe' && !LOCKED[page]) {
    botSay(`<p>لست متأكدًا أنني فهمت سؤالك 🤔 هل تقصد:</p><div class="as-chips">${r.options.map(chipBtn).join('')}</div>`, 'لست متأكدًا أنني فهمت سؤالك. اختر من الاقتراحات.');
  } else {
    remember(text);
    const sug = (PAGE_SUGGESTIONS[page] || PAGE_SUGGESTIONS.home).map(byId).filter(Boolean);
    botSay(`<p>هذا سؤال لا أعرف إجابته بعد 🙈 أنا أعرف عن المادة وحالاتها وتحولاتها. جرّب أن تسأل بطريقة أخرى، أو اسأل معلمك. وسأخبر معلمك بسؤالك حتى يعلّمني إجابته!</p>
      <p class="as-also">جرّب أن تسألني:</p><div class="as-chips">${sug.map(chipBtn).join('')}</div>`, 'لا أعرف إجابة هذا السؤال بعد. جرّب سؤالًا آخر أو اسأل معلمك.');
  }
}

function lockedMsg() {
  const t = `أنت الآن في «${LOCKED[page]}». هنا أريد أن أرى ما تعرفه أنت، لذلك لن أعطيك إجابات 💪 بعد أن تنتهي، اسألني ما تشاء!`;
  botSay(`<p>${t}</p>`, t);
}

function hint() {
  const list = PAGE_HINTS[page] || PAGE_HINTS.home;
  const i = hintStep[page] || 0;
  hintStep[page] = (i + 1) % list.length;
  botSay(`<p>💡 <strong>تلميح ${(i + 1).toLocaleString('ar-EG')}:</strong> ${esc(list[i])}</p>${list.length > 1 ? '<p class="as-also">اضغط «تلميح» مرة أخرى لتلميح أوضح.</p>' : ''}`, list[i]);
}

function paintChips() {
  const sug = (PAGE_SUGGESTIONS[page] || PAGE_SUGGESTIONS.home).map(byId).filter(Boolean);
  chips.innerHTML = `<button type="button" class="as-chip as-hint" data-hint>💡 تلميح لهذه الصفحة</button>${sug.map(chipBtn).join('')}`;
}

/* ---------- الفتح والإغلاق ---------- */
function open() {
  panel.hidden = false;
  fab.setAttribute('aria-expanded', 'true');
  fab.classList.remove('as-new');
  try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) { /* تجاهل */ }
  document.body.classList.add('as-open');
  paintChips();
  if (!log.children.length) {
    add('bot', `<p>مرحبًا! أنا <strong>العالِم الصغير</strong> 🔬<br>اسألني أي سؤال عن المادة وحالاتها وتحولاتها، أو اضغط «💡 تلميح» إذا احتجت مساعدة في هذه الصفحة.</p>`);
  }
  requestAnimationFrame(() => input.focus());
}

function close() {
  panel.hidden = true;
  fab.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('as-open');
  fab.focus();
}

function send(text) {
  const q = text.trim().slice(0, MAX_LEN);
  if (!q) return;
  add('me', `<p>${esc(q)}</p>`);
  input.value = '';
  reply(q);
}

/* ---------- التركيب ---------- */
export function mountAssistant(router) {
  let seen = false;
  try { seen = !!localStorage.getItem(SEEN_KEY); } catch (_) { /* تجاهل */ }
  fab = html(`
    <button type="button" class="as-fab ${seen ? '' : 'as-new'}" aria-expanded="false" aria-controls="assistant-panel">
      <img src="${IMG.avatar}" alt="" aria-hidden="true">
      <span class="as-fab-label">اسألني</span>
      <span class="sr-only">افتح المساعد الذكي: العالِم الصغير</span>
    </button>`);
  panel = html(`
    <section id="assistant-panel" class="as-panel glass" role="dialog" aria-modal="false" aria-labelledby="as-title" hidden>
      <header class="as-head">
        <img src="${IMG.avatar}" alt="" aria-hidden="true">
        <div><h2 id="as-title">العالِم الصغير</h2><small>مساعدك في حالات المادة · يعمل بدون إنترنت</small></div>
        <button type="button" class="as-x" aria-label="إغلاق المساعد">✕</button>
      </header>
      <div class="as-log" role="log" aria-live="polite" aria-label="المحادثة"></div>
      <div class="as-chips as-suggest" aria-label="اقتراحات"></div>
      <form class="as-form" autocomplete="off">
        <label for="as-input" class="sr-only">اكتب سؤالك</label>
        <input id="as-input" type="text" maxlength="${MAX_LEN}" placeholder="اكتب سؤالك هنا... مثلًا: هل الهواء مادة؟" enterkeyhint="send">
        <button type="submit" class="btn btn-primary as-send" aria-label="أرسل السؤال">إرسال ⬅️</button>
      </form>
    </section>`);
  document.body.append(fab, panel);
  log = panel.querySelector('.as-log');
  input = panel.querySelector('#as-input');
  chips = panel.querySelector('.as-suggest');

  fab.addEventListener('click', () => (panel.hidden ? open() : close()));
  panel.querySelector('.as-x').addEventListener('click', close);
  panel.querySelector('.as-form').addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  panel.addEventListener('click', (e) => {
    const c = e.target.closest('[data-ask]');
    if (c) { const en = byId(c.dataset.ask); add('me', `<p>${esc(en.q)}</p>`); reply(en.q, en); return; }
    if (e.target.closest('[data-hint]')) { add('me', '<p>💡 أريد تلميحًا</p>'); hint(); return; }
    // على الهاتف: إغلاق المساعد عند الانتقال إلى محطة
    if (e.target.closest('.as-link') && window.matchMedia('(max-width: 760px)').matches) close();
  });

  router.onChange((p) => {
    page = p;
    if (!panel.hidden) paintChips();
  });
}
