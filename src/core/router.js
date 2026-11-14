/**
 * موجّه بسيط يعتمد على الروابط (#solid, #gas ...)
 * مناسب لـ GitHub Pages لأنه لا يحتاج إعدادات خادم.
 */
import { audio } from '../components/audioPlayer.js';

const routes = new Map();
let current = null; // { name, cleanup }
let outlet;
const hooks = new Set();

export const router = {
  register(name, page) { routes.set(name, page); },
  onChange(fn) { hooks.add(fn); },
  go(name) {
    if (location.hash === `#${name}`) render();
    else location.hash = name;
  },
  start(el) {
    outlet = el;
    window.addEventListener('hashchange', render);
    render();
  },
  current: () => current?.name,
};

function render() {
  const name = (location.hash || '#home').slice(1).split('?')[0];
  // روابط داخل الصفحة الرئيسية (مثل #home-states)
  const [page, anchor] = routes.has(name) ? [name, null] : name.startsWith('home-') ? ['home', name] : ['home', null];

  if (current?.name === page && anchor) {
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  audio.stopAll();
  current?.cleanup?.();
  // تنظيف المكونات (مشغلات الصوت، المحاكاة) في الصفحة السابقة
  outlet.querySelectorAll('.audio-ctrl, .sim-panel, .experiment').forEach((c) => c.destroy?.());

  const view = routes.get(page);
  const result = view.render();
  const el = result.el ?? result;

  outlet.replaceChildren(el);
  el.classList.add('view-enter');
  current = { name: page, cleanup: result.cleanup };

  if (anchor) {
    requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
  } else {
    window.scrollTo({ top: 0 });
  }

  // نقل التركيز إلى عنوان الصفحة لمستخدمي لوحة المفاتيح وقارئات الشاشة
  const h = el.querySelector('h1, h2');
  if (h && page !== 'home') {
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }
  document.title = `${view.title ? view.title + ' | ' : ''}رحلة في عالم حالات المادة`;
  hooks.forEach((fn) => fn(page));
}
