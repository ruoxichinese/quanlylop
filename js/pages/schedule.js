import { loadAll, isTeacher } from '../store.js';
import { esc, money, today, ymd, parseYmd, monthKey, addMonths, monthLabel, DOW, chipBg, isDark, dotColor, num } from '../ui.js';
import { sessionsBetween } from '../calc.js';
import { go } from '../app.js';

const state = { view: 'month', month: null, weekStart: null, classId: '' };

function mondayOf(d) { const x = new Date(d); const k = (x.getDay() + 6) % 7; x.setDate(x.getDate() - k); x.setHours(0, 0, 0, 0); return x; }

export async function render(el) {
  const d = await loadAll(['classes', 'students']);
  if (!state.month) state.month = monthKey(new Date());
  if (!state.weekStart) state.weekStart = ymd(mondayOf(new Date()));
  const draw = () => {
    const classes = state.classId ? d.classes.filter(c => c.id === state.classId) : d.classes;
    let from, to, cells;
    if (state.view === 'month') {
      const [y, m] = state.month.split('-').map(Number);
      const first = new Date(y, m - 1, 1), last = new Date(y, m, 0);
      const start = mondayOf(first); const end = new Date(last); end.setDate(end.getDate() + (7 - ((last.getDay() + 6) % 7)) - 1);
      from = ymd(start); to = ymd(end); cells = [];
      for (let x = new Date(start); x <= end; x.setDate(x.getDate() + 1)) cells.push(ymd(x));
    } else {
      const s = parseYmd(state.weekStart); from = ymd(s); const e = new Date(s); e.setDate(e.getDate() + 6); to = ymd(e);
      cells = Array.from({ length: 7 }, (_, i) => { const x = new Date(s); x.setDate(x.getDate() + i); return ymd(x); });
    }
    const all = sessionsBetween(classes, from, to);
    const inRange = state.view === 'month' ? all.filter(s => s.date.startsWith(state.month)) : all;
    const hrs = inRange.reduce((a, s) => a + s.hours, 0);
    const count = cid => d.students.filter(s => s.classId === cid).length;
    const expected = inRange.reduce((a, s) => a + (Number(s.cls.fee) || 0) * count(s.classId), 0);
    const t = today();
    const title = state.view === 'month' ? monthLabel(state.month) : `Tuần ${cells[0].slice(8)}/${cells[0].slice(5, 7)} – ${cells[6].slice(8)}/${cells[6].slice(5, 7)}`;

    const cell = date => {
      const out = state.view === 'month' && !date.startsWith(state.month);
      const evs = all.filter(s => s.date === date);
      return `<div class="cal-d ${out ? 'out' : ''} ${date === t ? 'today' : ''}" style="${state.view === 'week' ? 'min-height:260px' : ''}">
        <div class="cal-n">${Number(date.slice(8))}</div>
        ${evs.map((s, i) => `<button class="ev ${isDark(s.cls.color) ? 'dark' : ''}" style="background:${chipBg(s.cls.color)}" data-ev="${date}|${s.classId}|${s.start}|${s.end}"><span>${esc(s.cls.name.toUpperCase())}</span><span style="font-weight:500">${s.start}-${s.end}</span></button>`).join('')}
      </div>`;
    };
    const rows = []; for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    el.innerHTML = `
      <header class="card head between"><div><h1>LỊCH DẠY</h1><p>Lịch dạy tự sinh từ lịch cố định của từng lớp. Bấm vào buổi để ghi nhật ký.</p></div>
        <a class="btn btn-primary" href="#/journal">+ Ghi buổi học mới</a></header>
      <section class="card pad stack" style="gap:18px">
        <div class="between">
          <div class="seg" role="group" aria-label="Chế độ xem"><button data-view="week" aria-pressed="${state.view === 'week'}">Tuần</button><button data-view="month" aria-pressed="${state.view === 'month'}">Tháng</button></div>
          <div class="hstack"><button class="btn btn-ghost btn-icon" data-nav="-1" aria-label="Trước">‹</button><button class="btn btn-ghost" data-nav="0">Hôm nay</button><button class="btn btn-ghost btn-icon" data-nav="1" aria-label="Sau">›</button><b style="font-size:20px;margin-left:8px">${title}</b></div>
          <label class="lbl" style="flex:0 1 220px"><span class="sr">Lọc theo lớp</span><select class="field" data-cls><option value="">Tất cả lớp</option>${d.classes.map(c => `<option value="${esc(c.id)}" ${c.id === state.classId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
        </div>
        <div class="grid g-kpi" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">
          <div class="panel" style="padding:12px 16px;text-align:center"><div class="muted" style="font-size:12px;font-weight:700;letter-spacing:.1em">TỔNG BUỔI</div><b style="font-size:26px">${inRange.length}</b></div>
          <div class="panel" style="padding:12px 16px;text-align:center"><div class="muted" style="font-size:12px;font-weight:700;letter-spacing:.1em">TỔNG GIỜ</div><b style="font-size:26px">${num(hrs.toFixed(1))}</b></div>
          <div class="panel" style="padding:12px 16px;text-align:center"><div class="muted" style="font-size:12px;font-weight:700;letter-spacing:.1em">SỐ LỚP</div><b style="font-size:26px">${classes.length}</b></div>
          ${isTeacher() ? `<div class="panel" style="padding:12px 16px;text-align:center"><div class="muted" style="font-size:12px;font-weight:700;letter-spacing:.1em">HỌC PHÍ DỰ KIẾN</div><b style="font-size:26px">${money(expected)}</b></div>` : ''}
        </div>
        <div class="hstack" style="gap:14px;font-size:13px">${d.classes.map(c => `<span class="hstack" style="gap:6px"><span class="dot" style="background:${dotColor(c.color)}"></span>${esc(c.name)}</span>`).join('')}</div>
        <div class="tbl-wrap" style="background:var(--glass)"><div class="cal">
          <div class="cal-row">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(x => `<div class="cal-h">${x}</div>`).join('')}</div>
          ${rows.map(r => `<div class="cal-row">${r.map(cell).join('')}</div>`).join('')}
        </div></div>
      </section>`;

    el.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { state.view = b.dataset.view; draw(); });
    el.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      const n = Number(b.dataset.nav);
      if (state.view === 'month') state.month = n ? addMonths(state.month, n) : monthKey(new Date());
      else { const s = n ? parseYmd(state.weekStart) : mondayOf(new Date()); if (n) s.setDate(s.getDate() + 7 * n); state.weekStart = ymd(s); }
      draw();
    });
    el.querySelector('[data-cls]').onchange = e => { state.classId = e.target.value; draw(); };
    el.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => {
      const [date, classId, start, end] = b.dataset.ev.split('|');
      go('journal', { class: classId, date, start, end });
    });
  };
  draw();
}
