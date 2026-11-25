import { loadAll, store } from '../store.js';
import { esc, dm, dmy, today, formModal, toast, icon, hskLevel, hskScale, exportImage } from '../ui.js';
import { byId, testTotal, testLabel, daysUntil } from '../calc.js';
import { pickInitial, pickerHtml, bindPicker } from '../picker.js';

const state = { selected: null, open: new Set(), q: '' };
const KIND = { mock: 'Thi thử HSK', speaking: 'Đánh giá nói', quiz: 'Kiểm tra' };
const SK = { listening: 'Nghe 听力', reading: 'Đọc 阅读', writing: 'Viết 书写' };

function chart(points, max, refs) {
  if (!points.length) return '<div class="empty">Chưa có dữ liệu để vẽ biểu đồ.</div>';
  const n = points.length;
  const xy = points.map((p, i) => ({ ...p, x: n === 1 ? 50 : i / (n - 1) * 100, y: 100 - p.v / max * 100 }));
  const line = xy.map(p => `${p.x},${p.y}`).join(' ');
  const ticks = [1, .8, .6, .4, .2, 0].map(f => Math.round(max * f));
  return `<div class="hstack" style="gap:8px;flex-wrap:nowrap;align-items:stretch;margin-top:16px">
    <div style="display:flex;flex-direction:column;justify-content:space-between;font-size:12px;height:220px;text-align:right;width:30px" class="muted">${ticks.map(t => `<span>${t}</span>`).join('')}</div>
    <div style="flex:1;min-width:0" class="stack">
      <div class="lchart">
        ${refs.map(r => `<div class="ref ${r.cls || ''}" style="top:${100 - r.v / max * 100}%"></div>`).join('')}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,100 ${line} 100,100" fill="rgba(var(--rgb),.14)"/><polyline points="${line}" fill="none" stroke="var(--pri)" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>
        ${xy.map(p => `<div class="pt" style="left:${p.x}%;top:${p.y}%"></div><div class="pv" style="left:${p.x}%;top:${p.y}%">${p.v}</div>`).join('')}
      </div>
      <div class="between muted" style="font-size:12px;flex-wrap:nowrap">${xy.map(p => `<span>${dm(p.date)}</span>`).join('')}</div>
    </div></div>`;
}

export async function render(el, ctx) {
  const d = await loadAll(['classes', 'students', 'tests']);
  const cmap = byId(d.classes);
  if (ctx.params.get('student') || ctx.params.get('class') || !d.students.some(s => s.id === state.selected)) state.selected = pickInitial(ctx.params, d.classes, d.students);
  history.replaceState(null, '', '#/grades');

  const draw = () => {
    const s = d.students.find(x => x.id === state.selected);
    const c = s && cmap[s.classId];
    const lv = hskLevel(c); const sc = hskScale(lv);
    const tests = s ? d.tests.filter(t => t.studentId === s.id).sort((a, b) => a.date.localeCompare(b.date)) : [];
    const mocks = tests.filter(t => t.kind === 'mock');
    const last = mocks[mocks.length - 1], prev = mocks[mocks.length - 2];
    const speak = tests.filter(t => t.kind === 'speaking').pop();
    const quizzes = tests.filter(t => t.kind !== 'mock');
    const left = daysUntil(c?.examDate);
    let body = '';
    if (s) {
      const kpis = sc ? `
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
          <div class="panel" style="padding:18px 20px"><div class="muted" style="font-size:14px">Thi thử gần nhất</div><div class="hstack" style="align-items:baseline"><b style="font-size:30px">${last ? testTotal(last) : '–'}</b><span class="muted">/ ${sc.max}</span>${last && prev ? `<span style="font-size:14px;font-weight:600;color:var(--pri-t)">${testTotal(last) - testTotal(prev) >= 0 ? '+' : ''}${testTotal(last) - testTotal(prev)} so với lần trước</span>` : ''}</div></div>
          <div class="panel" style="padding:18px 20px"><div class="muted" style="font-size:14px">Điểm mục tiêu</div><div class="hstack" style="align-items:baseline"><b style="font-size:30px">${s.targetScore || '–'}</b><span class="muted">/ ${sc.max}</span>${s.targetScore && last ? `<span style="font-size:14px;font-weight:600;color:var(--pri-t)">${testTotal(last) >= s.targetScore ? 'đã đạt' : 'còn thiếu ' + (s.targetScore - testTotal(last))}</span>` : ''}</div></div>
          <div class="panel" style="padding:18px 20px"><div class="muted" style="font-size:14px">Mức đỗ ${esc(c.level)}</div><div class="hstack" style="align-items:baseline"><b style="font-size:30px">${sc.pass}</b><span class="muted">/ ${sc.max}</span>${mocks.length ? `<span style="font-size:14px;font-weight:600">Vượt ${mocks.filter(m => testTotal(m) >= sc.pass).length}/${mocks.length} đề</span>` : ''}</div></div>
        </div>` : '';
      const skills = sc && last ? [...sc.parts.map(k => [SK[k], Number(last[k]) || 0]), ...(speak ? [['Nói 口语 (trong lớp)', Number(speak.speaking) || 0]] : [])] : [];
      const weakest = skills.slice().sort((a, b) => a[1] - b[1])[0];
      body = `
        <div class="between"><div class="hstack"><h2 style="font-size:26px">${esc(s.name)} · ${esc(c?.name || '')}</h2>
          ${c?.examDate && left >= 0 ? `<span class="pill warn" style="font-size:13px">Thi ${dmy(c.examDate)} · còn ${left} ngày</span>` : ''}</div>
          <div class="hstack"><button class="btn btn-ghost" data-img>Xuất ảnh điểm</button><button class="btn btn-primary" data-add>+ Nhập điểm</button></div></div>
        ${kpis}
        ${sc ? `<div class="row" style="gap:16px">
          <div class="panel" style="flex:3 1 420px;min-width:0;padding:20px 22px">
            <div class="between"><div><h3 style="font-size:18px">Điểm thi thử ${esc(c.level)}</h3><div class="muted" style="font-size:13px">${mocks.length} đề · thang ${sc.max}</div></div>
              <div class="hstack muted" style="font-size:12px;gap:14px">${s.targetScore ? `<span class="hstack" style="gap:6px"><span style="width:18px;border-top:2px dashed var(--pri)"></span>Mục tiêu ${s.targetScore}</span>` : ''}<span class="hstack" style="gap:6px"><span style="width:18px;border-top:2px dashed #C0822E"></span>Mức đỗ ${sc.pass}</span></div></div>
            ${chart(mocks.slice(-10).map(m => ({ date: m.date, v: testTotal(m) })), sc.max, [...(s.targetScore ? [{ v: s.targetScore }] : []), { v: sc.pass, cls: 'pass' }])}
          </div>
          <div class="panel stack" style="flex:2 1 300px;min-width:0;padding:20px 22px;gap:14px">
            <div><h3 style="font-size:18px">Các kỹ năng</h3><div class="muted" style="font-size:13px">${last ? 'Đề ' + dm(last.date) : 'Chưa có đề thi thử'}${speak ? ' · Nói chấm trong lớp' : ''}</div></div>
            ${skills.map(([k, v]) => `<div class="stack" style="gap:6px"><div class="between" style="font-size:14px"><b>${k}</b><span><b>${v}</b> / 100</span></div><div class="bar" style="height:10px"><i style="width:${v}%;${weakest && k === weakest[0] ? 'background:#C0822E' : ''}"></i></div></div>`).join('') || '<div class="empty">Nhập điểm thi thử để xem kỹ năng.</div>'}
            ${weakest ? `<div style="padding:12px 14px;border-radius:14px;background:#FCEBCB;color:#5C3A00;font-size:14px;line-height:1.5"><b>Cần tập trung: ${weakest[0]}</b><br>Giao thêm bài luyện cho kỹ năng này trong các buổi tới.</div>` : ''}
          </div></div>` : `<div class="panel" style="padding:20px 22px"><h3 style="font-size:18px">Điểm đánh giá</h3><div class="muted" style="font-size:13px">${esc(c?.rubric || '')}</div>
            ${chart(quizzes.slice(-10).map(t => ({ date: t.date, v: t.kind === 'speaking' ? Number(t.speaking) || 0 : Math.round((Number(t.score) || 0) / (Number(t.max) || 10) * 100) })), 100, [])}</div>`}
        <h3 style="font-size:22px;margin-top:4px">DANH SÁCH BÀI KIỂM TRA</h3>
        ${tests.length ? `<div class="tbl-wrap"><table class="tbl" style="min-width:860px"><thead><tr><th class="c">NGÀY</th><th>BÀI</th>${sc ? `${sc.parts.map(k => `<th class="c">${SK[k].toUpperCase()}</th>`).join('')}` : ''}<th class="c">KẾT QUẢ</th><th>NHẬN XÉT</th><th class="c">SỬA</th></tr></thead><tbody>
          ${tests.slice().reverse().map(t => `<tr><td class="c" style="white-space:nowrap"><b>${dmy(t.date)}</b></td>
            <td><span class="pill line">${KIND[t.kind] || 'Kiểm tra'}</span><div style="margin-top:6px;font-size:14px">${esc(t.name || '')}</div></td>
            ${sc ? sc.parts.map(k => `<td class="c">${t.kind === 'mock' ? (t[k] ?? '–') : '–'}</td>`).join('') : ''}
            <td class="c" style="white-space:nowrap"><b style="font-size:17px">${esc(testLabel(t, c))}</b></td>
            <td style="font-size:14px">${esc(t.note || '–')}</td>
            <td class="c"><button class="btn btn-ghost btn-icon" data-edit="${esc(t.id)}" aria-label="Sửa bài ${dm(t.date)}">${icon('edit', 18)}</button></td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty">Chưa có bài kiểm tra nào.</div>'}`;
    }

    el.innerHTML = `
      <header class="card head"><h1>ĐIỂM SỐ</h1><p>Thi thử HSK theo thang điểm thật, điểm từng kỹ năng và các bài đánh giá trong lớp.</p></header>
      <div class="row">
        ${pickerHtml({ classes: d.classes, students: d.students, selected: state.selected, open: state.open, q: state.q, title: 'DANH SÁCH LỚP' })}
        <section class="card pad stack" id="grade-sheet" style="flex:4 1 620px;min-width:0;gap:20px">${body || '<div class="empty">Chọn một học viên ở cột bên trái.</div>'}</section>
      </div>`;

    bindPicker(el, state, draw);
    if (!s) return;
    const reload = async () => { d.tests = await store.list('tests'); draw(); };
    const form = t => {
      const kinds = sc ? ['mock', 'speaking', 'quiz'] : ['speaking', 'quiz'];
      const kind = t?.kind || kinds[0];
      formModal({
        title: t ? 'Sửa điểm' : 'Nhập điểm · ' + s.name,
        extra: sc ? `<p class="muted" style="margin:0;font-size:14px">${esc(c.level)}: thi thử chấm ${sc.parts.map(k => SK[k]).join(', ')}, mỗi phần 100 điểm, tổng ${sc.max}. Nói chấm riêng trong lớp (0–100). Bài kiểm tra khác chấm theo thang tự chọn.</p>` : `<p class="muted" style="margin:0;font-size:14px">Đánh giá nói chấm 0–100. Bài kiểm tra chấm theo thang tự chọn (ví dụ 8/10).</p>`,
        fields: [
          { name: 'kind', label: 'Loại', type: 'select', value: kind, options: kinds.map(k => [k, KIND[k]]) },
          { name: 'date', label: 'Ngày', type: 'date', value: t?.date || today(), required: true },
          { name: 'name', label: 'Tên bài / đề', value: t?.name, placeholder: sc ? `Thi thử ${c.level} · Đề 1` : 'Email xin nghỉ phép' , full: true },
          ...(sc ? sc.parts.map(k => ({ name: k, label: SK[k] + ' (0–100, cho thi thử)', type: 'number', value: t?.[k], min: 0, max: 100 })) : []),
          { name: 'speaking', label: 'Nói (0–100, cho đánh giá nói)', type: 'number', value: t?.speaking, min: 0, max: 100 },
          { name: 'score', label: 'Điểm (cho bài kiểm tra)', type: 'number', value: t?.score, min: 0, step: 0.25 },
          { name: 'max', label: 'Thang điểm', type: 'number', value: t?.max ?? 10, min: 1 },
          { name: 'note', label: 'Nhận xét', type: 'textarea', value: t?.note, full: true }
        ],
        danger: t ? { label: 'Xoá', confirm: 'Xoá bài kiểm tra này?', onClick: async () => { await store.remove('tests', t.id); reload(); } } : null,
        onSubmit: async v => {
          if (v.kind === 'mock' && sc.parts.some(k => v[k] == null)) throw new Error('Thi thử cần đủ điểm ' + sc.parts.map(k => SK[k]).join(', ') + '.');
          if (v.kind === 'speaking' && v.speaking == null) throw new Error('Nhập điểm nói (0–100).');
          if (v.kind === 'quiz' && v.score == null) throw new Error('Nhập điểm bài kiểm tra.');
          const data = { ...v, studentId: s.id, classId: s.classId };
          if (t) await store.update('tests', t.id, data); else await store.add('tests', data);
          toast('Đã lưu điểm'); reload();
        }
      });
    };
    el.querySelector('[data-add]').onclick = () => form(null);
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => form(tests.find(t => t.id === b.dataset.edit)));
    el.querySelector('[data-img]').onclick = async () => { try { await exportImage(el.querySelector('#grade-sheet'), `diem-${s.name}.png`); } catch (e) { toast(e.message); } };
  };
  draw();
}
