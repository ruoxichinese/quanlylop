import { loadAll, isTeacher, store } from '../store.js';
import { esc, money, DOW, dmy, formModal, toast, CLASS_COLORS, COLOR_NAMES, chipBg, dotColor, isDark, icon } from '../ui.js';
import { daysUntil } from '../calc.js';

const state = { q: '' };
const HSK_RUBRIC = 'Nghe · Nói · Đọc · Viết';

export const schedText = sch => (sch || []).map(s => `${DOW[s.dow]} ${s.start}-${s.end}`).join('\n');
export function parseSched(text) {
  const out = [];
  for (const line of String(text).split(/\n|;|,/)) {
    const m = /(T\s*[2-7]|CN)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/i.exec(line.trim());
    if (!m) { if (line.trim()) throw new Error(`Không hiểu lịch: "${line.trim()}". Viết dạng: T2 17:00-19:00`); continue; }
    const key = m[1].toUpperCase().replace(/\s/g, '');
    const dow = key === 'CN' ? 0 : Number(key.slice(1)) - 1;
    const pad = t => t.padStart(5, '0');
    out.push({ dow, start: pad(m[2]), end: pad(m[3]) });
  }
  if (!out.length) throw new Error('Cần ít nhất một buổi trong lịch cố định.');
  return out;
}

export function classForm(c, onDone) {
  const isNew = !c;
  c = c || { type: 'HSK', level: 'HSK 1', mode: 'Offline', color: 'green', unit: 'Bài', totalUnits: 15, doneUnits: 0, pkgSessions: 24, fee: 200000, rubric: HSK_RUBRIC, schedule: [] };
  formModal({
    title: isNew ? 'Tạo lớp mới' : 'Sửa lớp ' + c.name,
    fields: [
      { name: 'name', label: 'Tên lớp', value: c.name, required: true, placeholder: 'VD: HSK 3 tối' },
      { name: 'type', label: 'Loại khoá', type: 'select', value: c.type, options: ['HSK', 'Tiếng Trung công sở', 'Speaking', 'Giao tiếp', 'Khác'] },
      { name: 'level', label: 'Cấp độ HSK', type: 'select', value: c.level, options: [['', 'Không theo HSK'], 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'HSK 7-9'] },
      { name: 'mode', label: 'Hình thức', type: 'select', value: c.mode, options: ['Offline', 'Online'] },
      { name: 'color', label: 'Màu trên lịch', type: 'select', value: c.color, options: Object.keys(CLASS_COLORS).map(k => [k, COLOR_NAMES[k]]) },
      { name: 'link', label: 'Link học online', value: c.link, placeholder: 'https://meet.google.com/…' },
      { name: 'schedule', label: 'Lịch cố định', type: 'textarea', value: schedText(c.schedule), required: true, full: true, hint: 'Mỗi dòng một buổi, ví dụ: T2 17:00-19:00 hoặc CN 09:30-11:30' },
      { name: 'book', label: 'Giáo trình / tài liệu', value: c.book, placeholder: 'HSK 标准教程 3' },
      { name: 'unit', label: 'Đơn vị tiến độ', type: 'select', value: c.unit, options: ['Bài', 'Chủ đề', 'Chương'] },
      { name: 'totalUnits', label: 'Tổng số bài', type: 'number', value: c.totalUnits, min: 1 },
      { name: 'doneUnits', label: 'Đã học xong', type: 'number', value: c.doneUnits, min: 0 },
      { name: 'pkgSessions', label: 'Số buổi mỗi gói', type: 'number', value: c.pkgSessions, min: 1 },
      { name: 'fee', label: 'Học phí mỗi buổi (₫)', type: 'number', value: c.fee, min: 0, step: 1000 },
      { name: 'rubric', label: 'Tiêu chí đánh giá', value: c.rubric, full: true },
      { name: 'goal', label: 'Mục tiêu lớp', value: c.goal, placeholder: 'Thi HSK 3' },
      { name: 'examDate', label: 'Ngày thi dự kiến', type: 'date', value: c.examDate }
    ],
    submit: isNew ? 'Tạo lớp' : 'Lưu',
    danger: isNew ? null : { label: 'Xoá lớp', confirm: `Xoá lớp ${c.name}? Học viên của lớp sẽ không còn gắn lớp.`, onClick: async () => { await store.remove('classes', c.id); toast('Đã xoá lớp'); onDone(); } },
    onSubmit: async v => {
      const data = { ...v, schedule: parseSched(v.schedule), assistants: c.assistants || [] };
      if (isNew) await store.add('classes', data); else await store.update('classes', c.id, data);
      toast(isNew ? 'Đã tạo lớp' : 'Đã lưu lớp'); onDone();
    }
  });
}

export async function render(el, ctx) {
  const d = await loadAll(['classes', 'students']);
  const teacher = isTeacher();
  const draw = () => {
    const list = d.classes.filter(c => !state.q || c.name.toLowerCase().includes(state.q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    el.innerHTML = `
      <header class="card head between"><div><h1>LỚP HỌC</h1><p>Cấp độ, giáo trình, lịch cố định, gói học phí và tiến độ của từng lớp.</p></div>
        ${teacher ? '<button class="btn btn-primary" data-new>+ Tạo lớp mới</button>' : ''}</header>
      <section class="card pad stack" style="gap:20px">
        <div class="between"><b>${list.length} lớp</b>
          <label class="lbl" style="flex:0 1 300px"><span class="sr">Tìm lớp</span><input class="field" type="search" placeholder="Tìm lớp…" value="${esc(state.q)}" data-q></label></div>
        ${list.length ? `<div class="grid g-cards">${list.map(c => {
          const n = d.students.filter(s => s.classId === c.id).length;
          const pct = c.totalUnits ? Math.min(100, Math.round((c.doneUnits || 0) / c.totalUnits * 100)) : 0;
          const left = daysUntil(c.examDate);
          return `<article class="panel" style="overflow:hidden;display:flex;flex-direction:column">
            <div style="height:8px;background:${dotColor(c.color)}"></div>
            <div class="stack" style="padding:18px 20px;gap:4px">
              <div class="between"><h2 style="font-size:22px;font-weight:700">${esc(c.name)}</h2><span class="hstack"><span class="pill soft">${esc(c.type || '')}</span><span class="pill line">${esc(c.mode || '')}</span></span></div>
              ${[['Học viên', n + ' học viên'], ['Lịch cố định', (c.schedule || []).map(s => `${DOW[s.dow]} ${s.start}–${s.end}`).join(' · ')], ['Giáo trình', c.book], ['Gói học phí', teacher ? `${c.pkgSessions || 0} buổi · ${money(c.fee)}/buổi` : `${c.pkgSessions || 0} buổi`], ['Đánh giá theo', c.rubric], ['Mục tiêu', (c.goal || '–') + (c.examDate ? ` · ${dmy(c.examDate)}${left >= 0 ? ` (còn ${left} ngày)` : ''}` : '')], ['Trợ giảng', (c.assistants || []).join(', ') || '–']]
                .map(([k, v]) => `<div class="between" style="font-size:14px;padding:7px 0;border-bottom:1px dashed rgba(var(--rgb),.2)"><span class="muted">${k}</span><b style="text-align:right;max-width:65%;overflow-wrap:anywhere">${esc(v || '–')}</b></div>`).join('')}
              <div class="between muted" style="font-size:13px;margin-top:10px"><span>Tiến độ giáo trình</span><span>${esc(c.unit || 'Bài')} ${c.doneUnits || 0}/${c.totalUnits || 0}</span></div>
              <div class="bar"><i style="width:${pct}%"></i></div>
            </div>
            <div class="hstack" style="margin-top:auto;padding:0 20px 18px">
              ${c.link && /^https?:\/\//i.test(c.link) ? `<a class="btn btn-ghost" href="${esc(c.link)}" target="_blank" rel="noopener" style="flex:1">Vào lớp online</a>` : ''}
              <a class="btn btn-ghost" href="#/journal?class=${encodeURIComponent(c.id)}" style="flex:1">Nhật ký</a>
              <a class="btn btn-ghost" href="#/grades?class=${encodeURIComponent(c.id)}" style="flex:1">Điểm số</a>
              ${teacher ? `<button class="btn btn-ghost btn-icon" data-edit="${esc(c.id)}" aria-label="Sửa ${esc(c.name)}">${icon('edit', 18)}</button>` : ''}
            </div></article>`;
        }).join('')}</div>` : `<div class="empty">${teacher ? 'Chưa có lớp nào. Bấm “Tạo lớp mới” để bắt đầu.' : 'Bạn chưa được giao lớp nào.'}</div>`}
      </section>`;
    const q = el.querySelector('[data-q]'); q.oninput = () => { state.q = q.value; const pos = q.selectionStart; draw(); const n = el.querySelector('[data-q]'); n.focus(); n.setSelectionRange(pos, pos); };
    const nb = el.querySelector('[data-new]'); if (nb) nb.onclick = () => classForm(null, () => ctx.rerender());
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => classForm(d.classes.find(c => c.id === b.dataset.edit), () => ctx.rerender()));
  };
  draw();
}
