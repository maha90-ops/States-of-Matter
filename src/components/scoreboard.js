/** شريط النجوم والنقاط والتقدم في أعلى الموقع */
import { store } from '../core/store.js';
import { num, announce } from '../core/dom.js';

export function mountScoreboard() {
  const starsEl = document.getElementById('stars-count');
  const pointsEl = document.getElementById('points-count');
  const starsBox = starsEl.closest('.score-chip');
  const pointsBox = pointsEl.closest('.score-chip');
  const progress = document.getElementById('journey-progress');
  const progressFill = progress.querySelector('span');

  const paint = () => {
    const s = store.get();
    starsEl.textContent = num(s.stars);
    pointsEl.textContent = num(s.points);
    const p = Math.round(store.progress() * 100);
    progressFill.style.width = p + '%';
    progress.setAttribute('aria-valuenow', p);
    progress.title = `تقدمك في الرحلة: ${p}%`;
  };

  const bump = (box, text) => {
    box.classList.remove('bump');
    void box.offsetWidth; // إعادة تشغيل الحركة
    box.classList.add('bump');
    const f = document.createElement('span');
    f.className = 'score-float';
    f.textContent = text;
    f.setAttribute('aria-hidden', 'true');
    box.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  };

  store.subscribe((_, ev) => {
    paint();
    if (ev?.type === 'award') {
      if (ev.points) bump(pointsBox, `+${num(ev.points)}`);
      if (ev.stars) bump(starsBox, `+${num(ev.stars)}`);
      announce(`${ev.reason}: حصلت على ${ev.points} نقطة${ev.stars ? ' ونجمة' : ''}.`);
    }
  });
  paint();
}
