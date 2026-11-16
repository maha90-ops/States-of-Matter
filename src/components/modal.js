/**
 * نافذة حوار يمكن الوصول إليها: حبس التركيز، الإغلاق بـ Esc، إعادة التركيز للزر الأصلي.
 */
import { html, $$ } from '../core/dom.js';

let uid = 0;
let open = 0;

export function openModal({ title, icon = '', body, className = '', actions = [], onClose }) {
  const id = `dlg-${++uid}`;
  const prev = document.activeElement;
  const el = html(`
    <div class="modal ${className}">
      <div class="modal-backdrop" data-close></div>
      <div class="modal-card glass" role="dialog" aria-modal="true" aria-labelledby="${id}">
        <header class="modal-head">
          <h2 id="${id}" class="modal-title">${icon ? `<span aria-hidden="true">${icon}</span> ` : ''}${title}</h2>
          <button type="button" class="modal-x" data-close aria-label="إغلاق">✕</button>
        </header>
        <div class="modal-body"></div>
        <footer class="modal-foot"></footer>
      </div>
    </div>`);
  const bodyEl = el.querySelector('.modal-body');
  if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
  const foot = el.querySelector('.modal-foot');
  actions.forEach((a) => {
    const b = html(`<button type="button" class="btn ${a.cls || 'btn-primary'}">${a.label}</button>`);
    b.addEventListener('click', () => { a.onClick?.(); if (a.close !== false) close(); });
    foot.appendChild(b);
  });
  if (!actions.length) foot.remove();

  const card = el.querySelector('.modal-card');
  const focusables = () => $$('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])', card);
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  };

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey, true);
    el.classList.add('closing');
    setTimeout(() => el.remove(), 200);
    if (--open <= 0) document.body.classList.remove('has-modal');
    onClose?.();
    if (prev && document.contains(prev)) prev.focus?.();
  }

  el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(el);
  open++;
  document.body.classList.add('has-modal');
  requestAnimationFrame(() => {
    const f = focusables();
    (f.find((n) => !n.classList.contains('modal-x')) || f[0])?.focus();
  });
  return { close, el, body: bodyEl };
}
