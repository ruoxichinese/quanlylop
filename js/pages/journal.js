import { loadAll, store, isTeacher } from '../store.js';
import { esc, today, dm, DOW_LONG, parseYmd, monthKey, addMonths, monthLabel, formModal, toast, icon, csv, downloadText, exportImage } from '../ui.js';
import { byId, pkgUsed } from '../calc.js';
import { pickInitial, pickerHtml, bindPicker } from '../picker.js';

const state = { selected: null, open: new Set(), q: '', month: null, prefill: null };

function logForm(log, student, cls, onDone) {
  const isNew = !log.id;
  formModal({
    title: (isNew ? 'Ghi buổi học · ' : 'Sửa buổi học · ') + student.name,
    fields: [
      { name: 'date', label: 'Ngày', type: 'date', value: log.date, required: true },
      { name: 'start', label: 'Bắt đầu', type: 'time', value: log.start, required: true },
      { name: 'end', label: 'Kết thúc', type: 'time', value: log.end, required: true },
      { name: 'lesson', label: 'Bài học / chủ đề', value: log.lesson, required: true, full: true, placeholder: 'BÀI 14 · 她买了不少衣服' },
      { name: 'content', label: 'Nội dung (từ mới, ngữ pháp, BTVN)', type: 'textarea', value: log.content, full: true, placeholder: 'Từ mới: …\nNgữ pháp: …\nBTVN: …' },
      { name: 'hw', label: 'Hoàn thành BTVN (%)', type: 'number', value: log.hw, min: 0, max: 100, step: 5 },
      { name: 'pron', label: 'Phát âm', value: log.pron ?? 'Tốt', placeholder: 'Tốt / Sửa thanh 3 / Sửa âm zh-ch' },
      { name: 'attitude', label: 'Ý thức', type: 'select', value: log.attitude || 'Tốt', options: ['Tốt', 'Khá', 'Trung bình', 'Cần cố gắng'] },
      { name: 'pronOk', label: 'Phát âm đạt yêu cầu', type: 'checkbox', value: log.pronOk ?? true },
      { name: 'comment', label: 'Nhận xét', type: 'textarea', value: log.comment, full: true, placeholder: '+ …\n+ …' },
      { name: 'counted', label: 'Trừ 1 buổi trong gói học', type: 'checkbox', value: log.counted ?? true, full: true }
    ],
    danger: isNew ? null : { label: 'Xoá buổi', confirm: 'Xoá buổi học này khỏi nhật ký?', onClick: async () => { await store.remove('logs', log.id); toast('Đã xoá'); onDone(); } },
    onSubmit: async v => {
      if (v.end <= v.start) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
      const data = { ...v, studentId: student.id, classId: student.classId };
      if (isNew) await store.add('logs', data); else await store.update('logs', log.id, data);
      // Lớp có bài mới: cập nhật tiến độ giáo trình (chỉ giáo viên được sửa lớp)
      toast('Đã lưu nhật ký'); onDone();
    }
  });
}

export async function render(el, ctx) {
  const d = await loadAll(['classes', 'students', 'logs']);
  const cmap = byId(d.classes);
  const p = ctx.params;
  if (!state.month) state.month = monthKey(new Date());
  if (p.get('student') || p.get('class') || !state.selected || !d.students.some(s => s.id === state.selected)) state.selected = pickInitial(p, d.classes, d.students);
  if (p.get('date')) { state.prefill = { date: p.get('date'), start: p.get('start'), end: p.get('end') }; state.month = p.get('date').slice(0, 7); }
  history.replaceState(null, '', '#/journal');

  const draw = () => {
    const s = d.students.find(x => x.id === state.selected);
    const c = s && cmap[s.classId];
    const logs = s ? d.logs.filter(l => l.studentId === s.id && l.date.startsWith(state.month)).sort((a, b) => a.date.localeCompare(b.date)) : [];
    const allLogs = s ? d.logs.filter(l => l.studentId === s.id).sort((a, b) => a.date.localeCompare(b.date)) : [];
    const siblings = s ? d.students.filter(x => x.classId === s.classId).sort((a, b) => a.name.localeCompare(b.name, 'vi')) : [];
    const used = s ? pkgUsed(s, d.logs) : 0;

    el.innerHTML = `
      <header class="card head between"><div><h1>NHẬT KÝ HỌC TẬP</h1><p>Bài học, từ vựng, phát âm và nhận xét qua từng buổi${s ? ' của ' + esc(s.name) : ''}.</p></div>
        <div class="hstack panel" style="padding:2px;border-radius:14px"><button class="btn btn-icon" style="background:none" data-m="-1" aria-label="Tháng trước">‹</button><b style="padding:0 6px">${monthLabel(state.month)}</b><button class="btn btn-icon" style="background:none" data-m="1" aria-label="Tháng sau">›</button></div></header>
      <div class="row">
        ${pickerHtml({ classes: d.classes, students: d.students, selected: state.selected, open: state.open, q: state.q })}
        <section class="stack" style="flex:4 1 620px;min-width:0;gap:12px">
          ${s ? `<div class="card between" style="padding:10px">
            <div class="hstack" style="overflow-x:auto;flex:1;min-width:200px;flex-wrap:nowrap">${siblings.map(x => `<button class="btn ${x.id === s.id ? 'btn-ghost' : ''}" style="${x.id === s.id ? '' : 'background:none'}" data-pick="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>
            <div class="hstack"><button class="btn btn-ghost" data-xls>Xuất Excel</button><button class="btn btn-ghost" data-img>Xuất ảnh</button><button class="btn btn-primary" data-add>+ Ghi buổi học</button></div></div>
          <div id="journal-sheet" class="stack" style="gap:0">
            <div style="background:var(--pri);color:#fff;padding:18px 24px;border-radius:20px 20px 0 0;display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;justify-content:center">
              <span style="font-size:24px;font-weight:700;letter-spacing:.04em">${esc(s.name.toUpperCase())} · ${esc((c?.name || '').toUpperCase())}</span><span style="opacity:.6">|</span><span style="font-weight:600;letter-spacing:.06em">${monthLabel(state.month).toUpperCase()}</span></div>
            <div class="tbl-wrap" style="border-radius:0 0 20px 20px">
              ${logs.length ? `<table class="tbl" style="min-width:1000px"><thead><tr><th class="c">STT</th><th class="c">NGÀY</th><th>BÀI HỌC</th><th class="c">BTVN</th><th class="c">PHÁT ÂM</th><th class="c">Ý THỨC</th><th>NHẬN XÉT</th><th class="c">SỬA</th></tr></thead><tbody>
                ${logs.map(l => { const idx = allLogs.indexOf(l) + 1; return `<tr>
                  <td class="c" style="white-space:nowrap"><b>Buổi ${idx}</b><div class="muted" style="font-size:13px;margin-top:4px">${esc(l.start)} – ${esc(l.end)}</div>${l.counted ? '<div class="muted" style="font-size:12px;margin-top:4px">trừ gói</div>' : ''}</td>
                  <td class="c" style="white-space:nowrap"><b>${DOW_LONG[parseYmd(l.date).getDay()]}</b><div class="muted" style="font-size:13px;margin-top:4px">${dm(l.date)}</div></td>
                  <td class="pre zh" style="min-width:240px;font-family:'Quicksand','Noto Sans SC',sans-serif"><b>${esc(l.lesson)}</b>${l.content ? '\n' + esc(l.content) : ''}</td>
                  <td class="c"><span class="pill ${Number(l.hw) >= 100 ? 'ok' : 'soft'}" style="font-size:14px;padding:6px 12px">${l.hw ?? '–'}%</span></td>
                  <td class="c"><span class="pill ${l.pronOk ? 'ok' : 'warn'}">${esc(l.pron || '–')}</span></td>
                  <td class="c">${esc(l.attitude || '–')}</td>
                  <td class="pre" style="min-width:240px">${esc(l.comment || '')}</td>
                  <td class="c"><button class="btn btn-ghost btn-icon" data-edit="${esc(l.id)}" aria-label="Sửa buổi ${dm(l.date)}">${icon('edit', 18)}</button></td></tr>`; }).join('')}
              </tbody></table>` : `<div class="empty" style="margin:16px;background:var(--glass2)">Chưa có buổi học nào trong ${monthLabel(state.month).toLowerCase()}.</div>`}
            </div></div>
          ${isTeacher() ? `<p class="muted" style="margin:4px 6px">Gói hiện tại: đã học ${used}/${s.pkgTotal || 0} buổi.</p>` : ''}`
          : '<div class="card empty">Chọn một học viên ở cột bên trái.</div>'}
        </section></div>`;

    bindPicker(el, state, draw);
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { state.month = addMonths(state.month, Number(b.dataset.m)); draw(); });
    if (!s) return;
    const refresh = async () => { d.logs = await store.list('logs'); draw(); };
    el.querySelector('[data-add]').onclick = () => {
      const pf = state.prefill || {}; state.prefill = null;
      const t = pf.date || today(); const dow = parseYmd(t).getDay();
      const sch = (c?.schedule || []).find(x => Number(x.dow) === dow) || c?.schedule?.[0] || { start: '17:00', end: '19:00' };
      logForm({ date: t, start: pf.start || sch.start, end: pf.end || sch.end, counted: true, pronOk: true, hw: 100 }, s, c, refresh);
    };
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => logForm(d.logs.find(l => l.id === b.dataset.edit), s, c, refresh));
    el.querySelector('[data-xls]').onclick = () => downloadText(`nhat-ky-${s.name}-${state.month}.csv`, csv([
      ['STT', 'Ngày', 'Giờ', 'Bài học', 'Nội dung', 'BTVN %', 'Phát âm', 'Ý thức', 'Nhận xét'],
      ...logs.map(l => [allLogs.indexOf(l) + 1, dm(l.date), `${l.start}-${l.end}`, l.lesson, l.content, l.hw, l.pron, l.attitude, l.comment])
    ]));
    el.querySelector('[data-img]').onclick = async () => { try { await exportImage(el.querySelector('#journal-sheet'), `nhat-ky-${s.name}-${state.month}.png`); } catch (e) { toast(e.message); } };
    if (state.prefill) el.querySelector('[data-add]').click();
  };
  draw();
}
