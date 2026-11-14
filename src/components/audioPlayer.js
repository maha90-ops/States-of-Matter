/**
 * مشغل الصوت: يشغل ملفات الشرح المسجلة فقط (لا يوجد أي صوت اصطناعي بديل).
 * - صوت واحد فقط يعمل في كل لحظة.
 * - الزر يتغير أثناء التشغيل ويظهر مؤشر حركة وشريط تقدم.
 * - إذا لم يوجد الملف بعد، يظهر الزر بحالة "غير متوفر" دون أخطاء.
 */
import { AUDIO_BASE, NARRATION, FEEDBACK_SOUNDS } from '../data/config.js';
import { esc, html } from '../core/dom.js';

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

  // إزالة المشغل عند حذف العنصر من الصفحة
  el.destroy = () => {
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
