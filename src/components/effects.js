/** مؤثرات النجاح: انفجار نجوم، قصاصات احتفال. خفيفة ومحترمة لتفضيل تقليل الحركة. */
import { prefersReducedMotion } from '../core/dom.js';

/** انفجار نجوم من مركز عنصر */
export function starBurst(target, count = 9) {
  if (prefersReducedMotion() || !target) return;
  const r = target.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  layer.style.left = `${r.left + r.width / 2}px`;
  layer.style.top = `${r.top + r.height / 2}px`;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'fx-star';
    s.textContent = i % 3 === 0 ? '✨' : '⭐';
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const d = 70 + Math.random() * 60;
    s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    s.style.animationDelay = `${Math.random() * 80}ms`;
    layer.appendChild(s);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1100);
}

/** قصاصات احتفال خفيفة لصفحات النتيجة */
export function confetti(container, count = 36) {
  if (prefersReducedMotion() || !container) return;
  const colors = ['#29b6f6', '#26c6da', '#ffca28', '#ff8a65', '#ffffff', '#66bb6a'];
  const wrap = document.createElement('div');
  wrap.className = 'confetti';
  wrap.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const c = document.createElement('i');
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = `${Math.random() * 0.8}s`;
    c.style.animationDuration = `${2.2 + Math.random() * 1.6}s`;
    c.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    wrap.appendChild(c);
  }
  container.appendChild(wrap);
  setTimeout(() => wrap.remove(), 4800);
}
