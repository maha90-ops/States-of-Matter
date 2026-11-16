/**
 * إعدادات الوصول (تُحفظ على الجهاز، منفصلة عن تقدّم الطالب فلا تُمسح عند «أعد الرحلة»).
 *  sound    : أصوات التغذية الراجعة والشرح
 *  contrast : تباين مرتفع
 *  fontSize : 0 عادي، 1 كبير، 2 كبير جدًا
 *  motion   : الحركة والزخارف (إيقافها يُبطئ المحاكاة ويوقف المؤثرات)
 *  reading  : قراءة مساعدة (مسافات أوسع وخط أثقل)
 */
const KEY = 'matter-journey-settings-v1';

const systemReduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const defaults = () => ({ sound: true, contrast: false, fontSize: 0, motion: !systemReduced(), reading: false });

let settings = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch (_) { /* التخزين غير متاح */ }
  return defaults();
}

export function applySettings() {
  const h = document.documentElement;
  h.classList.toggle('high-contrast', settings.contrast);
  h.classList.toggle('reduce-motion', !settings.motion);
  h.classList.toggle('reading-assist', settings.reading);
  h.classList.toggle('sound-off', !settings.sound);
  h.classList.remove('fs-1', 'fs-2');
  if (settings.fontSize > 0) h.classList.add(`fs-${settings.fontSize}`);
}

export const settingsStore = {
  get: () => settings,
  set(key, value) {
    settings = { ...settings, [key]: value };
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) { /* تجاهل */ }
    applySettings();
    listeners.forEach((fn) => fn(settings, key));
  },
  reset() {
    Object.entries(defaults()).forEach(([k, v]) => { settings[k] = v; });
    settingsStore.set('sound', settings.sound);
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
