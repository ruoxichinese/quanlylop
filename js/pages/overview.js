import { loadAll, isTeacher } from '../store.js';
import { esc, money, num, today, ymd, monthKey, addMonths, monthLabel, DOW_LONG, dm, dotColor, parseYmd } from '../ui.js';
import { sessionsBetween, pkgLeft, byId, daysUntil } from '../calc.js';

export async function render(el) {
  const teacher = isTeacher();
  const d = await loadAll(['classes', 'students', 'logs', ...(teacher ? ['payments'] : [])]);
  const classes = d.classes, cmap = byId(classes);
  const now = new Date(); const mk = monthKey(now);
  const monthStart = mk + '-01';
  const monthEnd = ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const monthSessions = sessionsBetween(classes, monthStart, monthEnd);
  const totalHours = monthSessions.reduce((a, s) => a + s.hours, 0);
  const t = today(); const tm = new Date(); tm.setDate(tm.getDate() + 1); const tmr = ymd(tm);
  const up = sessionsBetween(classes, t, tmr);

  const pay = d.payments || [];
  const monthRev = pay.filter(p => p.date.startsWith(mk)).reduce((a, p) => a + p.amount, 0);
  const kpis = [
    [classes.length, 'Lớp đang dạy'],
    [d.students.length, 'Học viên đang theo học'],
    [monthSessions.length, 'Buổi dạy trong tháng'],
    [num(totalHours.toFixed(1)) + 'h', 'Giờ dạy trong tháng'],
    ...(teacher ? [[money(monthRev), 'Học phí thu trong tháng']] : [])
  ];

  const dayBlock = (date, label) => {
    const items = up.filter(s => s.date === date);
    return `<div class="stack" style="gap:10px;margin-top:6px"><b style="font-size:16px">${label} · ${DOW_LONG[parseYmd(date).getDay()]} · ${dm(date)}</b>
      ${items.length ? items.map(s => `<a href="#/journal?class=${encodeURIComponent(s.classId)}" class="panel" style="display:flex;gap:14px;padding:14px 16px;text-decoration:none;color:inherit">
        <span style="width:6px;border-radius:6px;background:${dotColor(s.cls.color)}"></span>
        <span class="stack" style="gap:4px;flex:1"><span class="between" style="font-size:14px;font-weight:600;color:var(--ink2)"><span>${s.start} – ${s.end}</span><span class="pill soft">${esc(s.cls.mode || 'Lớp học')}</span></span>
        <b style="font-size:18px">${esc(s.cls.name)}</b><span class="muted" style="font-size:14px">${esc(s.cls.book || '')}${s.cls.unit ? ` · ${esc(s.cls.unit)} ${s.cls.doneUnits + 1}/${s.cls.totalUnits}` : ''}</span></span></a>`).join('')
        : '<div class="empty">Không có buổi dạy</div>'}</div>`;
  };

  // Cần chú ý
  const low = d.students.filter(s => pkgLeft(s, d.logs) <= 4 || s.status === 'unpaid');
  const exams = classes.filter(c => c.examDate && daysUntil(c.examDate) >= 0 && daysUntil(c.examDate) <= 60);
  const alerts = [
    ...exams.map(c => `<div class="hstack"><span class="pill warn">Thi</span> <b>${esc(c.name)}</b> thi ngày ${dm(c.examDate)} · còn ${daysUntil(c.examDate)} ngày</div>`),
    ...(teacher ? low.map(s => `<div class="hstack"><span class="pill ${s.status === 'unpaid' ? 'bad' : 'warn'}">${s.status === 'unpaid' ? 'Chưa đóng' : 'Gói'}</span> <b>${esc(s.name)}</b> (${esc(cmap[s.classId]?.name || '')}) còn ${pkgLeft(s, d.logs)} buổi</div>`) : [])
  ];

  let revenue = '';
  if (teacher) {
    const months = Array.from({ length: 12 }, (_, i) => addMonths(mk, i - 11));
    const vals = months.map(m => pay.filter(p => p.date.startsWith(m)).reduce((a, p) => a + p.amount, 0));
    const max = Math.max(1, ...vals); const total = vals.reduce((a, b) => a + b, 0);
    const byClass = {}; pay.filter(p => p.date.startsWith(mk)).forEach(p => { byClass[p.classId] = (byClass[p.classId] || 0) + p.amount; });
    const rows = Object.entries(byClass).map(([cid, v]) => ({ c: cmap[cid], v })).filter(r => r.c).sort((a, b) => b.v - a.v);
    const sum = rows.reduce((a, r) => a + r.v, 0) || 1; let acc = 0;
    const stops = rows.map(r => { const a = acc / sum * 360; acc += r.v; return `${dotColor(r.c.color)} ${a}deg ${acc / sum * 360}deg`; });
    revenue = `<section class="card pad">
        <h2 style="font-size:20px">Doanh thu 12 tháng</h2>
        <div style="font-size:26px;font-weight:700;color:var(--pri-t);margin-top:6px">${money(total)}</div>
        <div class="bars" role="img" aria-label="Biểu đồ doanh thu 12 tháng" style="margin-top:18px">
          ${vals.map((v, i) => `<div><small>${(v / 1e6).toFixed(1).replace('.', ',')}tr</small><div class="track"><div class="fill ${i === 11 ? 'cur' : ''}" style="height:${Math.round(v / max * 100)}%"></div></div><b style="font-size:12px;color:var(--ink2)">T${Number(months[i].slice(5))}</b></div>`).join('')}
        </div></section>
      <section class="card pad">
        <h2 style="font-size:20px">Doanh thu theo lớp</h2><div class="muted" style="font-size:14px;margin-top:4px">${monthLabel(mk)} · theo tiền thực thu</div>
        ${rows.length ? `<div class="row" style="margin-top:18px;align-items:center;gap:24px">
          <div class="donut" role="img" aria-label="Biểu đồ tròn doanh thu theo lớp" style="background:conic-gradient(${stops.join(',')})"><div><b>${money(sum)}</b><span class="muted" style="font-size:12px">${monthLabel(mk)}</span></div></div>
          <div class="stack" style="flex:1 1 200px">${rows.map(r => `<div class="stack" style="gap:6px"><div class="between" style="font-size:14px"><span class="hstack"><span class="dot" style="background:${dotColor(r.c.color)}"></span><b>${esc(r.c.name)}</b></span><span>${money(r.v)}</span></div><div class="bar"><i style="width:${Math.round(r.v / rows[0].v * 100)}%;background:${dotColor(r.c.color)}"></i></div></div>`).join('')}</div>
        </div>` : '<div class="empty" style="margin-top:14px">Chưa có khoản thu trong tháng</div>'}
      </section>`;
  }

  el.innerHTML = `
    <header class="card head between"><div><h1>TỔNG QUAN LỚP HỌC</h1><p>Bảng điều khiển học tập và lịch dạy cá nhân.</p></div><span class="pill soft" style="font-size:14px;padding:8px 14px">${monthLabel(mk)}</span></header>
    <section class="grid g-kpi">${kpis.map(([v, l]) => `<div class="card kpi"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</section>
    <div class="row">
      <div class="stack" style="flex:3 1 460px;min-width:0;gap:20px">
        <section class="card pad stack" style="gap:14px">
          <div class="between"><h2 style="font-size:22px">Lịch dạy sắp tới</h2><a class="btn btn-primary" href="#/schedule">Xem toàn bộ lịch dạy</a></div>
          ${dayBlock(t, 'Hôm nay')}${dayBlock(tmr, 'Ngày mai')}
        </section>
        <section class="card pad stack" style="gap:10px"><h2 style="font-size:20px">Cần chú ý</h2>
          ${alerts.length ? alerts.join('') : '<div class="empty">Không có việc cần chú ý</div>'}</section>
      </div>
      ${teacher ? `<div class="stack" style="flex:2 1 380px;min-width:0;gap:20px">${revenue}</div>` : ''}
    </div>`;
}
