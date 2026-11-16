/**
 * ♿ لوحة إعدادات الوصول: الصوت، التباين، حجم الخط، الحركة، القراءة المساعدة.
 */
import { html, $$ } from '../core/dom.js';
import { settingsStore } from '../core/settings.js';
import { openModal } from './modal.js';

const SWITCHES = [
  { key: 'sound', icon: '🔊', label: 'الصوت', desc: 'الشرح الصوتي وأصوات التشجيع.' },
  { key: 'contrast', icon: '🔆', label: 'التباين المرتفع', desc: 'ألوان أقوى وحدود أوضح.' },
  { key: 'motion', icon: '🎞️', label: 'الحركة', desc: 'عند الإيقاف: تتوقف الزخارف وتبطؤ المحاكاة.' },
  { key: 'reading', icon: '📖', label: 'القراءة المساعدة', desc: 'مسافات أوسع بين الكلمات والأسطر وخط أوضح.' },
];

export function openA11yPanel() {
  const s = settingsStore.get();
  const body = html(`
    <div class="a11y">
      <ul class="a11y-list">
        ${SWITCHES.map((sw) => `
          <li class="a11y-row">
            <span class="a11y-ico" aria-hidden="true">${sw.icon}</span>
            <span class="a11y-txt"><strong id="lb-${sw.key}">${sw.label}</strong><small id="ds-${sw.key}">${sw.desc}</small></span>
            <button type="button" class="switch" role="switch" data-key="${sw.key}" aria-checked="${!!s[sw.key]}" aria-labelledby="lb-${sw.key}" aria-describedby="ds-${sw.key}">
              <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
              <span class="switch-state">${s[sw.key] ? 'مُفعّل' : 'متوقف'}</span>
            </button>
          </li>`).join('')}
        <li class="a11y-row">
          <span class="a11y-ico" aria-hidden="true">🔠</span>
          <span class="a11y-txt"><strong id="lb-fs">حجم الخط</strong><small>اختر الحجم المريح لك.</small></span>
          <div class="fs-seg" role="radiogroup" aria-labelledby="lb-fs">
            ${['عادي', 'كبير', 'كبير جدًا'].map((t, i) => `
              <button type="button" role="radio" class="fs-btn fs-btn-${i}" data-v="${i}" aria-checked="${s.fontSize === i}" tabindex="${s.fontSize === i ? 0 : -1}">
                <span aria-hidden="true">أ</span><span class="sr-only">${t}</span>
              </button>`).join('')}
          </div>
        </li>
      </ul>
      <p class="a11y-note">💾 تُحفظ هذه الإعدادات على هذا الجهاز، ولا تُمسح عند إعادة الرحلة.</p>
    </div>`);

  const paint = () => {
    const cur = settingsStore.get();
    $$('.switch', body).forEach((b) => {
      const on = !!cur[b.dataset.key];
      b.setAttribute('aria-checked', String(on));
      b.querySelector('.switch-state').textContent = on ? 'مُفعّل' : 'متوقف';
    });
    $$('.fs-btn', body).forEach((b) => {
      const on = +b.dataset.v === cur.fontSize;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
  };

  $$('.switch', body).forEach((b) => b.addEventListener('click', () => {
    settingsStore.set(b.dataset.key, !settingsStore.get()[b.dataset.key]);
    paint();
  }));

  const radios = $$('.fs-btn', body);
  radios.forEach((b, i) => {
    b.addEventListener('click', () => { settingsStore.set('fontSize', i); paint(); });
    b.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = (i + d + radios.length) % radios.length;
      settingsStore.set('fontSize', n);
      paint();
      radios[n].focus();
    });
  });

  openModal({
    title: 'إعدادات الوصول',
    icon: '♿',
    body,
    className: 'modal-a11y',
    actions: [
      { label: 'استعادة الافتراضي', cls: 'btn-ghost', close: false, onClick: () => { settingsStore.reset(); paint(); } },
      { label: 'تم ✓', cls: 'btn-primary' },
    ],
  });
}
