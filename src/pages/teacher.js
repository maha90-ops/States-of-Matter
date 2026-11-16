/** 👩‍🏫 وضع المعلم: الأنشطة والإجابات والزمن، أسئلة التفكير، المفاهيم الخاطئة، إعادة الضبط */
import { html, esc, num } from '../core/dom.js';
import { store } from '../core/store.js';
import { STAGES } from '../data/stages.js';
import { TEACHER } from '../data/teacher.js';
import { openModal } from '../components/modal.js';

export const teacherPage = {
  title: 'وضع المعلم',
  render() {
    const s = store.get();
    const stage = (id) => STAGES.find((x) => x.id === id);
    const el = html(`
      <div class="page teacher">
        <header class="page-head">
          <span class="eyebrow">👩‍🏫 للمعلمين وأولياء الأمور</span>
          <h1>👩‍🏫 وضع المعلم</h1>
          <p class="lead">دليل الدرس كاملًا: الأنشطة والإجابات والزمن المقترح لكل محطة. الزمن الكلي: حصتان تقريبًا.</p>
        </header>

        <section class="glass t-tools" aria-labelledby="tt">
          <h2 id="tt" class="section-title">🛠️ أدوات المعلم</h2>
          <p class="t-stat">التقدّم الحالي على هذا الجهاز: ⭐ ${num(s.stars)} · 🏆 ${num(s.points)} · 🗺️ ${num(s.completed.length)} من ${num(STAGES.length)} محطات · 🏅 ${num(s.badges.length)} شارات</p>
          <div class="result-actions">
            <a class="btn btn-secondary" href="#results">📊 لوحة إنجاز الطالب</a>
            <button type="button" class="btn btn-ghost btn-danger" data-reset>🗑️ إعادة ضبط تقدّم الطالب</button>
          </div>
        </section>

        <section class="glass" aria-labelledby="ts">
          <h2 id="ts" class="section-title">🗺️ المحطات: الأنشطة والإجابات والزمن</h2>
          <div class="t-table-wrap">
            <table class="t-table">
              <thead><tr><th scope="col">المحطة</th><th scope="col">الأنشطة</th><th scope="col">الإجابات</th><th scope="col">الزمن</th></tr></thead>
              <tbody>
                ${TEACHER.stations.map((r, i) => `<tr>
                  <th scope="row"><span aria-hidden="true">${stage(r.id).emoji}</span> ${num(i + 1)}. ${esc(stage(r.id).title)}</th>
                  <td>${esc(r.activity)}</td><td>${esc(r.answers)}</td><td class="t-time">${esc(r.time)}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </section>

        <div class="t-grid">
          <article class="glass about-card"><h3>💭 أسئلة التفكير</h3><ul class="check-list">${TEACHER.thinking.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></article>
          <article class="glass about-card"><h3>⚠️ مفاهيم خاطئة شائعة</h3><ul class="check-list">${TEACHER.misconceptions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></article>
          <article class="glass about-card"><h3>💡 نصائح للتدريس</h3><ul class="check-list">${TEACHER.tips.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></article>
        </div>
      </div>`);

    el.querySelector('[data-reset]').addEventListener('click', () => {
      openModal({
        title: 'تأكيد', icon: '🗑️',
        body: '<p>سيتم مسح النقاط والنجوم والشارات والمحطات المكتملة واسم الطالب على هذا الجهاز. هل تريد المتابعة؟</p>',
        actions: [
          { label: 'إلغاء', cls: 'btn-ghost' },
          { label: 'نعم، امسح التقدّم', cls: 'btn-warm', onClick: () => { store.reset(); store.setName(''); location.hash = 'home'; } },
        ],
      });
    });
    return el;
  },
};
