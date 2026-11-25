import { loadAll, store } from '../store.js';
import { esc, num, formModal, toast, icon, VOCAB, hskLevel, csv, downloadText } from '../ui.js';
import { byId } from '../calc.js';
import { pickInitial, pickerHtml, bindPicker } from '../picker.js';
import { app } from '../app.js';

const state = { selected: null, open: new Set(), q: '' };

export async function render(el, ctx) {
  const d = await loadAll(['classes', 'students', 'words', 'vocab']);
  const cmap = byId(d.classes);
  if (ctx.params.get('student') || ctx.params.get('class') || !d.students.some(s => s.id === state.selected)) state.selected = pickInitial(ctx.params, d.classes, d.students);
  history.replaceState(null, '', '#/vocab');
  const std = app.settings.hskStandard === '3.0' ? '3.0' : '2.0';
  const table = VOCAB[std];

  const draw = () => {
    const s = d.students.find(x => x.id === state.selected);
    const c = s && cmap[s.classId];
    const lv = hskLevel(c); const need = lv ? table[Math.min(lv, std === '3.0' ? 7 : 6)] : 0;
    const v = (s && d.vocab.find(x => x.studentId === s.id)) || { words: 0, hanzi: 0 };
    const words = s ? d.words.filter(w => w.studentId === s.id).sort((a, b) => (b.wrong || 0) - (a.wrong || 0)) : [];
    const pct = need ? Math.min(100, Math.round((v.words || 0) / need * 100)) : 0;
    const review = words.filter(w => w.review).length;

    el.innerHTML = `
      <header class="card head between"><div><h1>TỪ VỰNG &amp; CHỮ HÁN</h1><p>Số từ đã học so với yêu cầu cấp độ và các từ học viên hay sai.</p></div>
        ${s ? '<div class="hstack"><button class="btn btn-ghost" data-csv>Xuất danh sách ôn</button><button class="btn btn-primary" data-addw>+ Thêm từ hay sai</button></div>' : ''}</header>
      <div class="row">
        ${pickerHtml({ classes: d.classes, students: d.students, selected: state.selected, open: state.open, q: state.q, title: 'HỌC VIÊN', meta: x => { const vv = d.vocab.find(y => y.studentId === x.id); return vv ? num(vv.words) + ' từ' : ''; } })}
        <div class="stack" style="flex:4 1 620px;min-width:0;gap:20px">
        ${s ? `
          <section class="card pad row" style="gap:24px;align-items:center">
            ${need ? `<div class="donut" role="img" aria-label="Đã học ${v.words} trên ${need} từ" style="background:conic-gradient(var(--pri) 0 ${pct * 3.6}deg,rgba(var(--rgb),.14) ${pct * 3.6}deg 360deg)"><div><b style="font-size:28px">${pct}%</b><span class="muted" style="font-size:12px">từ vựng ${esc(c.level)}</span></div></div>` : ''}
            <div class="stack" style="flex:1 1 300px">
              <div class="between"><h2 style="font-size:22px">${esc(s.name)} · ${esc(c?.name || '')}</h2><button class="btn btn-ghost" data-stat>${icon('edit', 18)} Cập nhật số từ</button></div>
              <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
                <div class="panel" style="padding:12px 14px"><div class="muted" style="font-size:13px">Đã học</div><b style="font-size:22px">${num(v.words || 0)}${need ? ' / ' + num(need) : ''} từ</b></div>
                <div class="panel" style="padding:12px 14px"><div class="muted" style="font-size:13px">Viết được chữ Hán</div><b style="font-size:22px">${num(v.hanzi || 0)} chữ</b></div>
                <div class="panel" style="padding:12px 14px"><div class="muted" style="font-size:13px">Cần ôn lại</div><b style="font-size:22px">${review} từ</b></div>
              </div>
              ${need ? `<div class="muted" style="font-size:14px">${v.words >= need ? 'Đã đủ lượng từ của cấp độ.' : `Còn ${num(need - (v.words || 0))} từ để đủ yêu cầu ${esc(c.level)}.`}</div>` : '<div class="muted" style="font-size:14px">Lớp không theo cấp độ HSK nên không có mốc số từ.</div>'}
            </div>
          </section>
          <section class="card pad stack">
            <h2 style="font-size:20px">Lượng từ theo cấp độ</h2>
            <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px">
              ${Object.entries(table).map(([k, n]) => { const cur = Number(k) === lv || (std === '3.0' && k === '7' && lv >= 7); const done = (v.words || 0) >= n; return `<div style="border-radius:16px;padding:12px 14px;border:1px solid rgba(var(--rgb),.14);${cur ? 'background:var(--pri);color:#fff' : done ? 'background:var(--soft)' : 'background:var(--glass2)'}"><b>HSK ${k === '7' ? '7–9' : k}</b><div style="font-size:20px;font-weight:700;margin-top:4px">${num(n)}</div><div style="font-size:12px">${cur ? 'đang học' : done ? 'đã đủ' : 'từ cộng dồn'}</div></div>`; }).join('')}
            </div>
            <div class="muted" style="font-size:13px">Chuẩn HSK ${std}. Đổi chuẩn trong Cài đặt.</div>
          </section>
          <section class="card pad stack">
            <div class="between"><h2 style="font-size:20px">Từ hay sai</h2><span class="muted" style="font-size:14px">${words.length} từ</span></div>
            ${words.length ? `<div class="tbl-wrap"><table class="tbl" style="min-width:760px"><thead><tr><th>TỪ</th><th>PINYIN</th><th>NGHĨA</th><th class="c">SỐ LẦN SAI</th><th>LỖI THƯỜNG GẶP</th><th class="c">CẦN ÔN</th><th class="c">SỬA</th></tr></thead><tbody>
              ${words.map(w => `<tr><td><span class="zh" style="font-size:24px;font-weight:700">${esc(w.zh)}</span></td><td>${esc(w.py)}</td><td>${esc(w.vi)}</td>
                <td class="c"><div class="hstack" style="justify-content:center;flex-wrap:nowrap"><button class="btn btn-ghost btn-icon" data-dec="${esc(w.id)}" aria-label="Giảm số lần sai">−</button><b style="min-width:24px">${w.wrong || 0}</b><button class="btn btn-ghost btn-icon" data-inc="${esc(w.id)}" aria-label="Tăng số lần sai">+</button></div></td>
                <td style="font-size:14px">${esc(w.err || '')}</td>
                <td class="c"><input type="checkbox" data-rev="${esc(w.id)}" ${w.review ? 'checked' : ''} aria-label="Cần ôn ${esc(w.zh)}" style="width:20px;height:20px;accent-color:var(--pri)"></td>
                <td class="c"><button class="btn btn-ghost btn-icon" data-editw="${esc(w.id)}" aria-label="Sửa ${esc(w.zh)}">${icon('edit', 18)}</button></td></tr>`).join('')}
            </tbody></table></div>` : '<div class="empty">Chưa ghi từ hay sai nào.</div>'}
          </section>` : '<div class="card empty">Chọn một học viên ở cột bên trái.</div>'}
        </div></div>`;

    bindPicker(el, state, draw);
    if (!s) return;
    const reload = async () => { [d.words, d.vocab] = await Promise.all([store.list('words'), store.list('vocab')]); draw(); };
    const wordForm = w => formModal({
      title: w ? 'Sửa từ ' + w.zh : 'Thêm từ hay sai',
      fields: [
        { name: 'zh', label: 'Chữ Hán', value: w?.zh, required: true },
        { name: 'py', label: 'Pinyin', value: w?.py, placeholder: 'gūjì' },
        { name: 'vi', label: 'Nghĩa', value: w?.vi },
        { name: 'wrong', label: 'Số lần sai', type: 'number', value: w?.wrong ?? 1, min: 0 },
        { name: 'err', label: 'Lỗi thường gặp', value: w?.err, full: true },
        { name: 'review', label: 'Cần ôn lại', type: 'checkbox', value: w?.review ?? true }
      ],
      danger: w ? { label: 'Xoá từ', onClick: async () => { await store.remove('words', w.id); reload(); } } : null,
      onSubmit: async x => {
        const data = { ...x, studentId: s.id, classId: s.classId };
        if (w) await store.update('words', w.id, data); else await store.add('words', data);
        toast('Đã lưu'); reload();
      }
    });
    el.querySelector('[data-addw]').onclick = () => wordForm(null);
    el.querySelectorAll('[data-editw]').forEach(b => b.onclick = () => wordForm(words.find(w => w.id === b.dataset.editw)));
    el.querySelectorAll('[data-inc],[data-dec]').forEach(b => b.onclick = async () => {
      const id = b.dataset.inc || b.dataset.dec; const w = words.find(x => x.id === id);
      await store.update('words', id, { ...w, wrong: Math.max(0, (w.wrong || 0) + (b.dataset.inc ? 1 : -1)) }); reload();
    });
    el.querySelectorAll('[data-rev]').forEach(b => b.onchange = async () => { const w = words.find(x => x.id === b.dataset.rev); await store.update('words', w.id, { ...w, review: b.checked }); reload(); });
    el.querySelector('[data-stat]').onclick = () => formModal({
      title: 'Cập nhật số từ · ' + s.name,
      fields: [{ name: 'words', label: 'Số từ đã học', type: 'number', value: v.words || 0, min: 0 }, { name: 'hanzi', label: 'Số chữ Hán viết được', type: 'number', value: v.hanzi || 0, min: 0 }],
      onSubmit: async x => { await store.set('vocab', s.id, { studentId: s.id, classId: s.classId, words: x.words || 0, hanzi: x.hanzi || 0 }); toast('Đã cập nhật'); reload(); }
    });
    el.querySelector('[data-csv]').onclick = () => downloadText(`tu-can-on-${s.name}.csv`, csv([['Chữ Hán', 'Pinyin', 'Nghĩa', 'Số lần sai', 'Lỗi thường gặp'], ...words.filter(w => w.review).map(w => [w.zh, w.py, w.vi, w.wrong, w.err])]));
  };
  draw();
}
