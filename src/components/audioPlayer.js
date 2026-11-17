/**
 * مشغل الصوت: يشغل ملفات الشرح المسجلة فقط (لا يوجد أي صوت اصطناعي بديل).
 * - صوت واحد فقط يعمل في كل لحظة.
 * - الزر يتغير أثناء التشغيل ويظهر مؤشر حركة وشريط تقدم.
 * - إذا لم يوجد الملف بعد، يظهر الزر بحالة "غير متوفر" دون أخطاء.
 */
import { AUDIO_BASE, NARRATION, FEEDBACK_SOUNDS } from '../data/config.js';
import { esc, html } from '../core/dom.js';
import { settingsStore } from '../core/settings.js';

const availability = new Map(); // url -> Promise<boolean>

/** التحقق من وجود الملف الصوتي */
function exists(url) {
  if (!availability.has(url)) {
    availability.set(
      url,
      fetch(url, { method: 'HEAD', cache: 'no-cache' })
        .then((r) => r.ok && !(r.headers.get('content-type') || '').includes('text/html'))
        .catch(() => false)
    );
  }
  return availability.get(url);
}

const players = new Set();

// إيقاف كل الأصوات فورًا عند إطفاء الصوت من إعدادات الوصول
settingsStore.subscribe((s, key) => { if (key === 'sound' && !s.sound) players.forEach((p) => p.stop()); });

export const audio = {
  stopAll(except) {
    players.forEach((p) => p !== except && p.stop());
  },
};

const fmt = (s) => {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const ss = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${ss}`;
};

/**
 * إنشاء مشغل صوت.
 * @param {string} key مفتاح من NARRATION في config.js
 * @param {string} label نص الزر
 */
export function createAudioButton(key, label = 'استمع إلى الشرح') {
  const file = NARRATION[key] || key;
  const url = AUDIO_BASE + file;

  const el = html(`
    <div class="audio-ctrl" data-state="loading">
      <button type="button" class="audio-btn" aria-pressed="false">
        <span class="audio-ico" aria-hidden="true">🔊</span>
        <span class="audio-lbl">${esc(label)}</span>
        <span class="audio-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </button>
      <button type="button" class="audio-restart" aria-label="أعد تشغيل الشرح من البداية" title="من البداية">↺</button>
      <div class="audio-meta">
        <div class="audio-bar" role="progressbar" aria-label="تقدم الشرح الصوتي" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
        <span class="audio-time" dir="ltr">0:00</span>
      </div>
    </div>`);

  const btn = el.querySelector('.audio-btn');
  const ico = el.querySelector('.audio-ico');
  const lbl = el.querySelector('.audio-lbl');
  const bar = el.querySelector('.audio-bar');
  const fill = bar.querySelector('span');
  const time = el.querySelector('.audio-time');
  const restart = el.querySelector('.audio-restart');

  let a = null;

  const setState = (s) => {
    el.dataset.state = s;
    const map = {
      idle: ['🔊', label, false],
      playing: ['⏸️', 'إيقاف مؤقت', true],
      paused: ['▶️', 'أكمل الاستماع', false],
      ended: ['🔁', 'استمع مرة أخرى', false],
      missing: ['🔇', 'الشرح الصوتي سيُضاف قريبًا', false],
      loading: ['🔊', label, false],
    };
    const [i, t, pressed] = map[s];
    ico.textContent = i;
    lbl.textContent = t;
    btn.setAttribute('aria-pressed', String(pressed));
    btn.disabled = s === 'missing';
    restart.disabled = s === 'missing';
    if (s === 'missing') btn.title = `أضف الملف ${file} داخل المجلد assets/audio/`;
  };

  const ensure = () => {
    if (a) return a;
    a = new Audio(url);
    a.preload = 'metadata';
    a.addEventListener('timeupdate', () => {
      const p = a.duration ? (a.currentTime / a.duration) * 100 : 0;
      fill.style.width = p + '%';
      bar.setAttribute('aria-valuenow', Math.round(p));
      time.textContent = `${fmt(a.currentTime)} / ${fmt(a.duration)}`;
    });
    a.addEventListener('loadedmetadata', () => (time.textContent = `0:00 / ${fmt(a.duration)}`));
    a.addEventListener('ended', () => setState('ended'));
    a.addEventListener('error', () => setState('missing'));
    return a;
  };

  const player = {
    stop() {
      if (a && !a.paused) {
        a.pause();
        setState('paused');
      }
    },
  };
  players.add(player);

  const play = () => {
    if (!settingsStore.get().sound) {
      // الصوت متوقف من إعدادات الوصول: نوضّح ذلك بدل الصمت
      const lbl = el.querySelector('.audio-lbl');
      const old = lbl.textContent;
      lbl.textContent = '🔇 الصوت متوقف من ♿ إعدادات الوصول';
      setTimeout(() => { lbl.textContent = old; }, 2600);
      return;
    }
    ensure();
    audio.stopAll(player);
    a.play().then(() => setState('playing')).catch(() => setState(a.error ? 'missing' : 'paused'));
  };

  btn.addEventListener('click', () => {
    if (a && !a.paused) {
      a.pause();
      setState('paused');
    } else {
      if (a && a.ended) a.currentTime = 0;
      play();
    }
  });

  restart.addEventListener('click', () => {
    ensure();
    a.currentTime = 0;
    play();
  });

  // النقر على شريط التقدم للانتقال
  bar.addEventListener('click', (e) => {
    if (!a || !a.duration) return;
    const r = bar.getBoundingClientRect();
    const ratio = (r.right - e.clientX) / r.width; // RTL: البداية من اليمين
    a.currentTime = Math.max(0, Math.min(1, ratio)) * a.duration;
  });

  exists(url).then((ok) => setState(ok ? 'idle' : 'missing'));

  /**
   * تشغيل تلقائي: يحاول التشغيل فورًا. المتصفحات تمنع الصوت قبل أي تفاعل من الزائر،
   * فإن مُنع، يبدأ عند أول لمسة أو نقرة أو ضغطة مفتاح في أي مكان في الصفحة.
   * لا يتدخل إذا كانت اللمسة على زر الصوت نفسه أو على رابط أو حقل كتابة.
   * @param {Function} onStart يُستدعى عندما يبدأ التشغيل فعلًا
   * @returns {Function} لإلغاء الانتظار
   */
  const GESTURES = ['pointerdown', 'keydown', 'touchend'];
  let waiting = false;
  const stopWaiting = () => {
    waiting = false;
    GESTURES.forEach((t) => document.removeEventListener(t, onGesture, true));
  };
  const startNow = (onStart) => ensure().play().then(() => {
    audio.stopAll(player);
    setState('playing');
    stopWaiting();
    onStart?.();
    return true;
  }).catch(() => false);
  let pendingStart = null;
  function onGesture(e) {
    if (!waiting) return;
    if (!el.isConnected || el.dataset.state === 'missing' || !settingsStore.get().sound) { stopWaiting(); return; }
    if (e.target.closest?.('.audio-ctrl, a[href], input, textarea, select, .as-fab, .as-panel')) { stopWaiting(); return; }
    if (a && !a.paused) { stopWaiting(); return; }
    startNow(pendingStart);
  }
  el.autoplay = (onStart) => {
    if (!settingsStore.get().sound) return stopWaiting;
    pendingStart = onStart;
    startNow(onStart).then((ok) => {
      if (ok || !el.isConnected) return;
      waiting = true;
      GESTURES.forEach((t) => document.addEventListener(t, onGesture, true));
    });
    return stopWaiting;
  };

  // إزالة المشغل عند حذف العنصر من الصفحة
  el.destroy = () => {
    stopWaiting();
    player.stop();
    players.delete(player);
  };

  return el;
}

/* ---------- أصوات التغذية الراجعة (اختيارية) ---------- */
const sfxCache = new Map();

/**
 * تشغيل صوت تغذية راجعة إن كان الملف موجودًا (correct / tryAgain / hint).
 * لا يحدث شيء إذا لم يُضف الملف بعد.
 */
export async function playSfx(name) {
  if (!settingsStore.get().sound) return; // الصوت متوقف من إعدادات الوصول
  const file = FEEDBACK_SOUNDS[name];
  if (!file) return;
  const url = AUDIO_BASE + file;
  if (!(await exists(url))) return;
  let a = sfxCache.get(url);
  if (!a) {
    a = new Audio(url);
    sfxCache.set(url, a);
  }
  try {
    a.currentTime = 0;
    await a.play();
  } catch (_) { /* تجاهل */ }
}
