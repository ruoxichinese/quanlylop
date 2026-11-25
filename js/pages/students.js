import { loadAll, isTeacher, store } from '../store.js';
import { esc, initials, formModal, toast, dotColor, icon, csv, downloadText } from '../ui.js';
import { byId, pkgLeft, pkgUsed, pkgStatus, lastTest, testLabel } from '../calc.js';

const state = { q: '', classId: '', status: '' };

export function studentForm(s, classes, priv, onDone) {
  const isNew = !s;
  s = s || { classId: classes[0]?.id, pkgTotal: classes[0]?.pkgSessions || 24, pkgUsed: 0, status: 'ok', since: new Date().toISOString().slice(0, 7) };
  priv = priv || {};
  formModal({
    title: isNew ? 'Thêm học viên' : 'Sửa học viên ' + s.name,
    fields: [
      { name: 'name', label: 'Họ tên', value: s.name, required: true },
      { name: 'classId', label: 'Lớp', type: 'select', value: s.classId, options: classes.map(c => [c.id, c.name]), required: true },
      { name: 'since', label: 'Vào học từ', type: 'month', value: s.since },
      { name: 'goal', label: 'Mục tiêu', value: s.goal, placeholder: 'Thi HSK 3 · 03/2027' },
      { name: 'targetScore', label: 'Điểm thi mục tiêu', type: 'number', value: s.targetScore, min: 0, max: 300, hint: 'HSK 1–2 thang 200, HSK 3 trở lên thang 300' },
      { name: 'contact', label: 'Liên hệ (phụ huynh / học viên)', value: priv.contact, placeholder: 'PH · Chị Hương' },
      { name: 'phone', label: 'Số điện thoại', type: 'tel', value: priv.phone },
      { name: 'pkgTotal', label: 'Số buổi trong gói', type: 'number', value: s.pkgTotal, min: 0 },
      { name: 'pkgUsed', label: 'Đã học', type: 'number', value: s.pkgUsed, min: 0 },
      { name: 'status', label: 'Tình trạng đóng phí', type: 'select', value: s.status, options: [['ok', 'Đã đóng'], ['unpaid', 'Chưa đóng gói mới']] }
    ],
    submit: isNew ? 'Thêm' : 'Lưu',
    danger: isNew ? null : { label: 'Xoá học viên', confirm: `Xoá ${s.name}? Nhật ký, điểm và từ vựng của học viên vẫn được giữ.`, onClick: async () => { await store.remove('students', s.id); await store.remove('studentPrivate', s.id); toast('Đã xoá học viên'); onDone(); } },
    onSubmit: async v => {
      const { contact, phone, ...pub } = v;
      let id = s.id;
      if (isNew) id = await store.add('students', { ...pub, pkgStart: new Date().toISOString().slice(0, 10) }); else await store.update('students', id, pub);
      await store.set('studentPrivate', id, { contact, phone, note: priv.note || '' });
      toast('Đã lưu học viên'); onDone();
    }
  });
}

export async function render(el, ctx) {
  const teacher = isTeacher();
  const d = await loadAll(['classes', 'students', 'tests', 'logs', ...(teacher ? ['studentPrivate'] : [])]);
  const cmap = byId(d.classes); const pmap = byId(d.studentPrivate || []);
  const draw = () => {
    const rows = d.students.filter(s => (!state.classId || s.classId === state.classId)
      && (!state.q || (s.name + ' ' + (pmap[s.id]?.contact || '')).toLowerCase().includes(state.q.toLowerCase()))
      && (!state.status || pkgStatus(s, d.logs)[1] === state.status))
      .sort((a, b) => (cmap[a.classId]?.name || '').localeCompare(cmap[b.classId]?.name || '', 'vi') || a.name.localeCompare(b.name, 'vi'));
    const low = d.students.filter(s => pkgStatus(s, d.logs)[1] === 'warn').length;
    const unpaid = d.students.filter(s => s.status === 'unpaid').length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    el.innerHTML = `
      <header class="card head between"><div><h1>HỌC VIÊN</h1><p>Hồ sơ học viên, mục tiêu học tập${teacher ? ' và số buổi còn lại trong gói' : ''}.</p></div>
        ${teacher ? '<div class="hstack"><button class="btn btn-ghost" data-csv>Xuất Excel</button><button class="btn btn-primary" data-new>+ Thêm học viên</button></div>' : ''}</header>
      ${teacher ? `<section class="grid g-kpi">
        <div class="card kpi"><b>${d.students.length}</b><span>Tổng học viên</span></div>
        <div class="card kpi"><b>${low}</b><span>Sắp hết gói (≤ 4 buổi)</span></div>
        <div class="card kpi"><b>${unpaid}</b><span>Chưa đóng gói mới</span></div>
        <div class="card kpi"><b>${d.students.filter(s => s.since === thisMonth).length}</b><span>Học viên mới tháng này</span></div></section>` : ''}
      <section class="card pad stack" style="gap:18px">
        <div class="hstack" style="gap:12px;align-items:flex-end">
          <label class="lbl" style="flex:2 1 240px">Tìm học viên${teacher ? ' hoặc liên hệ' : ''}<input class="field" type="search" data-q value="${esc(state.q)}" placeholder="Nhập tên…"></label>
          <label class="lbl" style="flex:1 1 160px">Lớp<select class="field" data-c><option value="">Tất cả lớp</option>${d.classes.map(c => `<option value="${esc(c.id)}" ${state.classId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
          ${teacher ? `<label class="lbl" style="flex:1 1 160px">Trạng thái gói<select class="field" data-s>${[['', 'Tất cả'], ['ok', 'Đang học'], ['warn', 'Sắp hết gói'], ['bad', 'Chưa đóng gói mới']].map(([v, l]) => `<option value="${v}" ${state.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
        </div>
        ${rows.length ? `<div class="tbl-wrap"><table class="tbl" style="min-width:${teacher ? 1040 : 700}px">
          <thead><tr><th>HỌC VIÊN</th><th>LỚP</th>${teacher ? '<th>LIÊN HỆ</th><th class="c">GÓI CÒN LẠI</th>' : ''}<th>MỤC TIÊU</th>${teacher ? '<th>TRẠNG THÁI</th>' : ''}<th>KẾT QUẢ GẦN NHẤT</th><th class="c">THAO TÁC</th></tr></thead>
          <tbody>${rows.map(s => {
            const c = cmap[s.classId]; const p = pmap[s.id] || {}; const [st, tone] = pkgStatus(s, d.logs); const lt = lastTest(s.id, d.tests);
            return `<tr>
              <td><div class="hstack" style="flex-wrap:nowrap"><span class="ini">${esc(initials(s.name))}</span><div><b>${esc(s.name)}</b><div class="muted" style="font-size:12px">Vào học ${esc(s.since || '–')}</div></div></div></td>
              <td><span class="hstack" style="gap:6px;flex-wrap:nowrap"><span class="dot" style="background:${dotColor(c?.color)}"></span><b style="font-size:14px">${esc(c?.name || '–')}</b></span></td>
              ${teacher ? `<td><b style="font-size:14px">${esc(p.contact || '–')}</b><div class="muted" style="font-size:12px">${esc(p.phone || '')}</div></td><td class="c" style="white-space:nowrap"><b>${pkgLeft(s, d.logs)}</b> / ${s.pkgTotal || 0} buổi</td>` : ''}
              <td style="font-size:14px">${esc(s.goal || '–')}</td>
              ${teacher ? `<td><span class="pill ${tone}">${st}</span></td>` : ''}
              <td style="font-size:14px;font-weight:600;white-space:nowrap">${lt ? esc(testLabel(lt, c)) : '–'}</td>
              <td class="c" style="white-space:nowrap">
                <a class="btn btn-ghost btn-icon" href="#/journal?student=${encodeURIComponent(s.id)}" aria-label="Nhật ký của ${esc(s.name)}">${icon('journal', 18)}</a>
                ${teacher ? `<a class="btn btn-ghost btn-icon" href="#/tuition?student=${encodeURIComponent(s.id)}" aria-label="Phiếu học phí của ${esc(s.name)}">${icon('tuition', 18)}</a>
                <button class="btn btn-ghost btn-icon" data-edit="${esc(s.id)}" aria-label="Sửa ${esc(s.name)}">${icon('edit', 18)}</button>` : ''}
              </td></tr>`;
          }).join('')}</tbody></table></div>` : `<div class="empty">${d.students.length ? 'Không có học viên phù hợp bộ lọc.' : 'Chưa có học viên.'}</div>`}
      </section>`;
    const q = el.querySelector('[data-q]'); q.oninput = () => { state.q = q.value; const p = q.selectionStart; draw(); const n = el.querySelector('[data-q]'); n.focus(); n.setSelectionRange(p, p); };
    el.querySelector('[data-c]').onchange = e => { state.classId = e.target.value; draw(); };
    const sf = el.querySelector('[data-s]'); if (sf) sf.onchange = e => { state.status = e.target.value; draw(); };
    const nb = el.querySelector('[data-new]'); if (nb) nb.onclick = () => d.classes.length ? studentForm(null, d.classes, null, () => ctx.rerender()) : toast('Hãy tạo lớp trước');
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => studentForm(d.students.find(s => s.id === b.dataset.edit), d.classes, pmap[b.dataset.edit], () => ctx.rerender()));
    const cb = el.querySelector('[data-csv]'); if (cb) cb.onclick = () => downloadText('hoc-vien.csv', csv([
      ['Học viên', 'Lớp', 'Liên hệ', 'Số điện thoại', 'Đã học', 'Tổng buổi gói', 'Còn lại', 'Trạng thái', 'Mục tiêu'],
      ...rows.map(s => [s.name, cmap[s.classId]?.name, pmap[s.id]?.contact, pmap[s.id]?.phone, pkgUsed(s, d.logs), s.pkgTotal, pkgLeft(s, d.logs), pkgStatus(s, d.logs)[0], s.goal])
    ]));
  };
  draw();
}
