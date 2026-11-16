/** أدوات صغيرة للتعامل مع DOM */

/** تحويل نص إلى HTML آمن */
export function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** إنشاء عنصر من نص HTML */
export function html(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** تقليل الحركة: من إعداد النظام أو من «إعدادات الوصول» داخل الموقع */
export const prefersReducedMotion = () =>
  document.documentElement.classList.contains('reduce-motion') ||
  (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/** خلط عناصر مصفوفة (نسخة جديدة) */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** صورة بتحميل كسول */
export function img(src, alt, cls = '', extra = '') {
  return `<img src="${esc(src)}" alt="${esc(alt)}" class="${cls}" loading="lazy" decoding="async" ${extra}>`;
}

/** إعلان نص لقارئ الشاشة */
export function announce(text) {
  const live = document.getElementById('sr-live');
  if (!live) return;
  live.textContent = '';
  setTimeout(() => (live.textContent = text), 40);
}

/** تحويل الأرقام إلى صيغة عربية مقروءة */
export const num = (n) => Number(n).toLocaleString('ar-EG');
