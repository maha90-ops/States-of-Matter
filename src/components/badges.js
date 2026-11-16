/**
 * الشارات: تُفحص بعد كل تغيير في التقدّم، وتظهر الجديدة منها بحركة احتفالية.
 */
import { store } from '../core/store.js';
import { BADGES } from '../data/extras.js';
import { CHALLENGE_QUESTIONS } from '../data/challengeQuestions.js';
import { POINTS, CERTIFICATE_THRESHOLD } from '../data/config.js';
import { openModal } from './modal.js';
import { playSfx } from './audioPlayer.js';
import { esc } from '../core/dom.js';

const MAX = CHALLENGE_QUESTIONS.length * POINTS.correctAnswer;

export const passedChallenge = () => {
  const b = store.get().bestScore;
  return b !== null && b / MAX >= CERTIFICATE_THRESHOLD;
};

const queue = [];
let showing = false;

function showNext() {
  if (showing || !queue.length) return;
  showing = true;
  const b = queue.shift();
  playSfx('correct');
  openModal({
    title: 'شارة جديدة!',
    icon: '🏅',
    className: 'modal-badge',
    body: `
      <div class="badge-pop">
        <div class="badge-medal" aria-hidden="true"><span>${b.icon}</span></div>
        <p class="badge-pop-name">${esc(b.title)}</p>
        <p class="badge-pop-desc">${esc(b.desc)}</p>
      </div>`,
    actions: [{ label: 'رائع! 🎉', cls: 'btn-primary' }],
    onClose: () => { showing = false; setTimeout(showNext, 250); },
  });
}

/** فحص الشارات وعرض الجديدة */
export function checkBadges({ silent = false } = {}) {
  const s = store.get();
  const ctx = { passed: passedChallenge() };
  const fresh = BADGES.filter((b) => !s.badges.includes(b.id) && b.test(s, ctx));
  if (!fresh.length) return;
  store.addBadges(fresh.map((b) => b.id));
  if (!silent) { queue.push(...fresh); showNext(); }
}

export function mountBadges() {
  store.subscribe((_, ev) => {
    if (ev?.type === 'badges' || ev?.type === 'reset') return;
    // ننتظر قليلًا حتى تظهر التغذية الراجعة أولًا
    setTimeout(() => checkBadges(), 900);
  });
  checkBadges({ silent: true });
}
