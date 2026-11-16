/**
 * عامل الخدمة: يحفظ ملفات الموقع في الجهاز ليعمل بدون إنترنت داخل الصف.
 * عند تعديل أي ملف في الموقع، غيّر رقم VERSION حتى يحصل الطلاب على النسخة الجديدة.
 */
const VERSION = 'v3';
const CACHE = `matter-journey-${VERSION}`;
const FONT_CACHE = 'matter-journey-fonts';

const ASSETS = [
  "./",
  "assets/audio/before-activity.mp3",
  "assets/audio/changes.mp3",
  "assets/audio/correct.mp3",
  "assets/audio/ending.mp3",
  "assets/audio/gas.mp3",
  "assets/audio/hint.mp3",
  "assets/audio/intro.mp3",
  "assets/audio/liquid.mp3",
  "assets/audio/solid.mp3",
  "assets/audio/try-again.mp3",
  "assets/icons/apple-touch-icon.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-512.png",
  "assets/images/activity.webp",
  "assets/images/avatar.webp",
  "assets/images/beaker-gas.webp",
  "assets/images/beaker-liquid.webp",
  "assets/images/beaker-solid.webp",
  "assets/images/certificate-frame.webp",
  "assets/images/changes.webp",
  "assets/images/gas.webp",
  "assets/images/hero.webp",
  "assets/images/liquid.webp",
  "assets/images/particles-compare.webp",
  "assets/images/solid.webp",
  "assets/images/success.webp",
  "index.html",
  "manifest.webmanifest",
  "src/components/a11yPanel.js",
  "src/components/audioPlayer.js",
  "src/components/badges.js",
  "src/components/certificate.js",
  "src/components/containerExperiment.js",
  "src/components/discoveryLab.js",
  "src/components/effects.js",
  "src/components/layout.js",
  "src/components/modal.js",
  "src/components/particleSim.js",
  "src/components/question.js",
  "src/components/scenarios.js",
  "src/components/scoreboard.js",
  "src/components/simPanel.js",
  "src/components/thermoSim.js",
  "src/core/dom.js",
  "src/core/pdf.js",
  "src/core/router.js",
  "src/core/settings.js",
  "src/core/store.js",
  "src/data/activityQuestions.js",
  "src/data/challengeQuestions.js",
  "src/data/config.js",
  "src/data/extras.js",
  "src/data/stages.js",
  "src/data/states.js",
  "src/data/teacher.js",
  "src/data/transitions.js",
  "src/main.js",
  "src/pages/activity.js",
  "src/pages/challenge.js",
  "src/pages/changes.js",
  "src/pages/ending.js",
  "src/pages/games.js",
  "src/pages/home.js",
  "src/pages/lab.js",
  "src/pages/matter.js",
  "src/pages/results.js",
  "src/pages/statePage.js",
  "src/pages/teacher.js",
  "src/styles/extras.css",
  "src/styles/main.css"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // الخطوط من Google: من الذاكرة أولًا ثم تحديثها في الخلفية
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONT_CACHE).then(async (c) => {
        const hit = await c.match(request);
        const net = fetch(request).then((r) => { if (r.ok || r.type === 'opaque') c.put(request, r.clone()); return r; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // من الذاكرة أولًا (يعمل بدون إنترنت)، مع تحديث النسخة المحفوظة في الخلفية
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(request, { ignoreSearch: true });
      const net = fetch(request).then((r) => {
        if (r.ok && r.status === 200) c.put(request, r.clone());
        return r;
      }).catch(() => (request.mode === 'navigate' ? c.match('index.html') : hit));
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })
  );
});
