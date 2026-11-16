/** نقطة البداية: تسجيل الصفحات وتشغيل الموجّه وشريط النقاط */
import { router } from './core/router.js';
import { mountScoreboard } from './components/scoreboard.js';
import { homePage } from './pages/home.js';
import { statePage } from './pages/statePage.js';
import { changesPage } from './pages/changes.js';
import { activityPage } from './pages/activity.js';
import { challengePage } from './pages/challenge.js';
import { endingPage, certificatePage } from './pages/ending.js';
import { matterPage } from './pages/matter.js';
import { labPage } from './pages/lab.js';
import { gamesPage } from './pages/games.js';
import { resultsPage } from './pages/results.js';
import { teacherPage } from './pages/teacher.js';
import { adaptivePage } from './pages/adaptive.js';
import { applySettings } from './core/settings.js';
import { mountBadges } from './components/badges.js';
import { openA11yPanel } from './components/a11yPanel.js';
import { STAGES } from './data/stages.js';

applySettings();

router.register('home', homePage);
router.register('matter', matterPage);
router.register('solid', statePage('solid'));
router.register('liquid', statePage('liquid'));
router.register('gas', statePage('gas'));
router.register('lab', labPage);
router.register('changes', changesPage);
router.register('games', gamesPage);
router.register('activity', activityPage);
router.register('adaptive', adaptivePage);
router.register('challenge', challengePage);
router.register('ending', endingPage);
router.register('certificate', certificatePage);
router.register('results', resultsPage);
router.register('teacher', teacherPage);

// شريطا التنقل (العلوي والسفلي) يُبنيان من قائمة المحطات حتى يبقيا متطابقين معها
const navLinks = (cls) => STAGES.map((s) =>
  `<a href="#${s.route}" data-nav="${s.id}" title="${s.title}"><span aria-hidden="true">${s.emoji}</span><span class="${cls}">${s.short}</span></a>`).join('');
document.querySelector('.quick-nav').innerHTML = navLinks('qn-text');
document.querySelector('.bottom-nav').innerHTML = navLinks('bn-text');

mountScoreboard();
mountBadges();
document.querySelector('.btn-a11y')?.addEventListener('click', openA11yPanel);

// تمييز الرابط الحالي في القائمة
router.onChange((page) => {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.toggleAttribute('aria-current', a.dataset.nav === page);
  });
  // الشريط السفلي يتحرك أفقيًا ليظهر رابط المحطة الحالية دائمًا
  const bar = document.querySelector('.bottom-nav');
  const cur = bar?.querySelector('[aria-current]');
  if (bar && cur && bar.scrollWidth > bar.clientWidth) {
    const b = bar.getBoundingClientRect(); const c = cur.getBoundingClientRect();
    bar.scrollBy({ left: c.left + c.width / 2 - (b.left + b.width / 2), behavior: 'auto' });
  }
});

router.start(document.getElementById('app'));

// تفعيل العمل بدون إنترنت (يتطلب https أو localhost)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* تجاهل: الموقع يعمل بدونه */ });
  });
}
