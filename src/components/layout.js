/** عناصر مشتركة بين الصفحات */
import { esc, img } from '../core/dom.js';
import { STAGES } from '../data/stages.js';
import { IMG } from '../data/config.js';

/** فقاعة كلام للعالِم الصغير */
export function mascot(text, { mood = '' } = {}) {
  return `
    <div class="mascot ${mood}">
      ${img(IMG.avatar, 'العالِم الصغير', 'mascot-img')}
      <p class="mascot-bubble"><span class="sr-only">العالِم الصغير يقول: </span>${esc(text)}</p>
    </div>`;
}

/** أزرار التنقل بين المراحل (السابق / التالي) */
export function stageNav(currentId) {
  const i = STAGES.findIndex((s) => s.id === currentId);
  const prev = STAGES[i - 1];
  const next = STAGES[i + 1];
  return `
    <nav class="stage-nav" aria-label="التنقل بين المراحل">
      ${prev
        ? `<a class="btn btn-ghost" href="#${prev.route}">➡️ ${esc(prev.title)}</a>`
        : `<a class="btn btn-ghost" href="#home">➡️ الرئيسية</a>`}
      <a class="btn btn-ghost btn-map" href="#home-journey">🗺️ خريطة الرحلة</a>
      ${next
        ? `<a class="btn btn-primary next-stage" href="#${next.route}">${esc(next.title)} ⬅️</a>`
        : `<a class="btn btn-primary next-stage" href="#ending">النهاية ⬅️</a>`}
    </nav>`;
}

/** رقم المرحلة بالكلمات */
export function stageLabel(id) {
  const words = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];
  const i = STAGES.findIndex((s) => s.id === id);
  return `المرحلة ${words[i]}`;
}
