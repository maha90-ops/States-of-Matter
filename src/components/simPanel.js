/**
 * لوحة محاكاة الجسيمات: لوحة رسم + أزرار التحكم (إيقاف الحركة، تغيير حجم الوعاء).
 */
import { html, esc, prefersReducedMotion } from '../core/dom.js';
import { ParticleSim } from './particleSim.js';

export function createSimPanel({ state, caption, note, containerControls = true, height = 300 }) {
  const el = html(`
    <figure class="sim-panel glass">
      <div class="sim-canvas-wrap" style="--sim-h:${height}px">
        <canvas class="sim-canvas" role="img" aria-label="${esc(caption)}"></canvas>
        <span class="sim-label">🔬 نموذج الجسيمات</span>
      </div>
      <figcaption>${esc(caption)}</figcaption>
      <div class="sim-controls">
        <button type="button" class="btn btn-small btn-ghost sim-pause" aria-pressed="false">⏸️ أوقف الحركة</button>
        ${containerControls ? `
          <div class="seg" role="group" aria-label="حجم الوعاء">
            <button type="button" class="seg-btn" data-w="0.5" aria-pressed="false"><span aria-hidden="true">🫙</span> <span class="seg-word">وعاء</span> ضيق</button>
            <button type="button" class="seg-btn" data-w="0.66" aria-pressed="true"><span aria-hidden="true">🥛</span> <span class="seg-word">وعاء</span> متوسط</button>
            <button type="button" class="seg-btn" data-w="0.92" aria-pressed="false"><span aria-hidden="true">🛁</span> <span class="seg-word">وعاء</span> واسع</button>
          </div>` : ''}
      </div>
      ${note ? `<p class="sim-note">👀 ${esc(note)}</p>` : ''}
    </figure>`);

  // الغاز: عدد أقل من الجسيمات ليظهر التباعد الكبير بينها
  const sim = new ParticleSim(el.querySelector('canvas'), { state, count: state === 'gas' ? 14 : 36 });
  sim.widthFrac = sim.targetWidthFrac = 0.66;
  sim._box();
  sim._layoutHomes();
  sim.setState(state, { instant: true });

  const pause = el.querySelector('.sim-pause');
  const syncPause = () => {
    pause.setAttribute('aria-pressed', String(sim.paused));
    pause.textContent = sim.paused ? '▶️ شغّل الحركة' : '⏸️ أوقف الحركة';
  };
  pause.addEventListener('click', () => {
    sim.setPaused(!sim.paused);
    syncPause();
  });
  if (prefersReducedMotion()) syncPause();

  el.querySelectorAll('.seg-btn').forEach((b) =>
    b.addEventListener('click', () => {
      el.querySelectorAll('.seg-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      sim.setContainerWidth(Number(b.dataset.w));
    })
  );

  el.sim = sim;
  el.destroy = () => sim.destroy();
  return el;
}
