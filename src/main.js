/** نقطة البداية: تسجيل الصفحات وتشغيل الموجّه وشريط النقاط */
import { router } from './core/router.js';
import { mountScoreboard } from './components/scoreboard.js';
import { homePage } from './pages/home.js';
import { statePage } from './pages/statePage.js';
import { changesPage } from './pages/changes.js';
import { activityPage } from './pages/activity.js';
import { challengePage } from './pages/challenge.js';
import { endingPage, certificatePage } from './pages/ending.js';

router.register('home', homePage);
router.register('solid', statePage('solid'));
router.register('liquid', statePage('liquid'));
router.register('gas', statePage('gas'));
router.register('changes', changesPage);
router.register('activity', activityPage);
router.register('challenge', challengePage);
router.register('ending', endingPage);
router.register('certificate', certificatePage);

mountScoreboard();

// تمييز الرابط الحالي في القائمة
router.onChange((page) => {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.toggleAttribute('aria-current', a.dataset.nav === page);
  });
});

router.start(document.getElementById('app'));

// تفعيل العمل بدون إنترنت (يتطلب https أو localhost)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* تجاهل: الموقع يعمل بدونه */ });
  });
}
