// Danh sách học viên theo lớp (cột trái của Nhật ký / Từ vựng / Điểm số)
import { esc, initials, dotColor } from './ui.js';

export function pickInitial(params, classes, students) {
  const sid = params.get('student');
  if (sid && students.some(s => s.id === sid)) return sid;
  const cid = params.get('class');
  const inClass = students.filter(s => s.classId === cid).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  if (inClass.length) return inClass[0].id;
  const first = classes.map(c => students.filter(s => s.classId === c.id).sort((a, b) => a.name.localeCompare(b.name, 'vi'))[0]).find(Boolean);
  return first?.id || null;
}

export function pickerHtml({ classes, students, selected, open, q, title = 'HỌC VIÊN', meta }) {
  const sel = students.find(s => s.id === selected);
  const ql = (q || '').toLowerCase();
  const groups = classes.slice().sort((a, b) => a.name.localeCompare(b.name, 'vi')).map(c => {
    const list = students.filter(s => s.classId === c.id && (!ql || s.name.toLowerCase().includes(ql))).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    if (ql && !list.length) return '';
    const isOpen = ql || open.has(c.id) || sel?.classId === c.id;
    return `<div class="pgroup"><button data-toggle="${esc(c.id)}" aria-expanded="${!!isOpen}"><span class="dot" style="width:14px;height:14px;background:${dotColor(c.color)}"></span><span style="flex:1">${esc(c.name)}</span><span class="pill soft">${students.filter(s => s.classId === c.id).length}</span><span aria-hidden="true">${isOpen ? '⌄' : '›'}</span></button>
      ${isOpen ? list.map(s => `<button class="pitem ${s.id === selected ? 'on' : ''}" data-pick="${esc(s.id)}" aria-current="${s.id === selected}"><span class="ini">${esc(initials(s.name))}</span><span style="flex:1"><b>${esc(s.name)}</b>${meta ? `<div class="muted" style="font-size:12px">${esc(meta(s))}</div>` : ''}</span></button>`).join('') || '<div class="muted" style="padding:10px 14px">Chưa có học viên</div>' : ''}</div>`;
  }).join('');
  return `<section class="card pad stack" aria-label="Danh sách học viên" style="flex:1 1 260px;min-width:0;padding:22px 18px;gap:12px">
    <h2 style="font-size:20px;margin:0 4px">${title}</h2>
    <label class="lbl"><span class="sr">Tìm học viên</span><input class="field" type="search" placeholder="Tìm học viên…" value="${esc(q || '')}" data-pq></label>
    <div class="picker">${groups || '<div class="empty">Chưa có học viên</div>'}</div></section>`;
}

export function bindPicker(el, state, redraw) {
  el.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => { const id = b.dataset.toggle; state.open.has(id) ? state.open.delete(id) : state.open.add(id); redraw(); });
  el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { state.selected = b.dataset.pick; redraw(); });
  const q = el.querySelector('[data-pq]');
  if (q) q.oninput = () => { state.q = q.value; const p = q.selectionStart; redraw(); const n = el.querySelector('[data-pq]'); n.focus(); n.setSelectionRange(p, p); };
}
