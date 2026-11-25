import { loadAll, store } from '../store.js';
import { esc, money, dm, dmy, today, monthKey, monthLabel, DOW, formModal, toast, exportImage, initials } from '../ui.js';
import { byId, pkgLeft, pkgUsed, pkgEndDate, testTotal, testMax } from '../calc.js';
import { app } from '../app.js';

const state = { selected: null, tpl: 1 };
const DRAFT = id => 'lh-receipt-' + id;
const TPL = { 1: ['#3F5A35', '#DCE8C8'], 2: ['#2F5F86', '#D6E6F5'], 3: ['#8E445A', '#F6DEE5'] };

function loadDraft(id) { try { return JSON.parse(localStorage.getItem(DRAFT(id)) || 'null'); } catch { return null; } }
function saveDraft(id, v) { try { localStorage.setItem(DRAFT(id), JSON.stringify(v)); } catch { } }

export async function render(el, ctx) {
  const d = await loadAll(['classes', 'students', 'logs', 'tests', 'payments']);
  const cmap = byId(d.classes); const set = app.settings; const priv = set.priv || {};
  const expiring = d.students.filter(s => pkgLeft(s, d.logs) <= 4 || s.status === 'unpaid').sort((a, b) => pkgLeft(a, d.logs) - pkgLeft(b, d.logs));
  const ps = ctx.params.get('student');
  if (ps && d.students.some(s => s.id === ps)) state.selected = ps;
  if (!d.students.some(s => s.id === state.selected)) state.selected = (expiring[0] || d.students[0])?.id || null;
  history.replaceState(null, '', '#/tuition');

  const defaults = s => {
    const c = cmap[s.classId];
    const mock = d.tests.filter(t => t.studentId === s.id && t.kind === 'mock').sort((a, b) => b.date.localeCompare(a.date))[0];
    const parts = mock ? ['listening', 'reading', 'writing'].filter(k => mock[k] != null).map(k => ({ listening: 'Nghe', reading: 'Đọc', writing: 'Viết' }[k] + ' ' + mock[k])).join(' · ') : '';
    return {
      overall: '', listenSpeak: '', readWrite: '',
      result: mock ? `${mock.name || 'Thi thử'} ngày ${dm(mock.date)}: ${testTotal(mock)}/${testMax(mock, c)} (${parts})` : '',
      route: c?.book ? `Tiếp tục ${c.book}, ${c.unit || 'bài'} ${Math.min((c.doneUnits || 0) + 1, c.totalUnits || 0)}–${c.totalUnits || ''}` : '',
      schedule: (c?.schedule || []).map(x => `${x.dow === 0 ? 'Chủ nhật' : 'Thứ ' + (x.dow + 1)}: ${x.start} – ${x.end}`).join('\n'),
      sessions: c?.pkgSessions || 24, fee: c?.fee || set.defaultFee || 0
    };
  };

  const receiptHtml = (s, v) => {
    const c = cmap[s.classId]; const [rc, rcs] = TPL[state.tpl];
    const mk = monthKey(new Date());
    const dates = d.logs.filter(l => l.studentId === s.id && l.date.startsWith(mk)).map(l => l.date).sort();
    const left = pkgLeft(s, d.logs);
    const total = (Number(v.sessions) || 0) * (Number(v.fee) || 0);
    const block = (t, x) => x && x.trim() ? `<div><b>${t}:</b>${x.includes('\n') ? '<br>' : ' '}${esc(x).replace(/\n/g, '<br>')}</div>` : '';
    return `<article class="receipt m${state.tpl}" id="receipt" style="--rc:${rc};--rcs:${rcs}">
      <div class="between" style="font-size:14px;font-weight:600;color:#444"><span>GV. ${esc((set.teacherName || '[Tên giáo viên]').toUpperCase())}</span><span>${priv.phone ? 'SĐT. ' + esc(priv.phone) : ''}</span></div>
      <h2>GIA HẠN GÓI HỌC</h2><div style="text-align:center;margin-top:-10px;font-size:14px;color:#666">Báo cáo học tập ${monthLabel(mk).toLowerCase()}</div>
      <div class="row" style="gap:14px">
        <div class="rbox"><b style="font-size:16px">Thông tin học viên</b>
          <div class="rrow"><span>Họ và tên</span><b>${esc(s.name)} – ${esc(c?.name || '')}</b></div>
          <div class="rrow"><span>Gói hiện tại</span><b>${s.pkgTotal || 0} buổi</b></div>
          <div class="rrow"><span>Đã học / còn lại</span><b>${pkgUsed(s, d.logs)} / ${left} buổi</b></div>
          <div class="rrow"><span>Gói mới</span><b>${Number(v.sessions) || 0} buổi × ${money(v.fee)}</b></div>
          ${left ? `<div class="rrow"><span>Dự kiến hết gói cũ</span><b>${dmy(pkgEndDate(s, c, d.logs))}</b></div>` : ''}
          ${dates.length ? `<div style="font-size:14px;color:#666;margin:10px 0 8px">Ngày học trong tháng</div><div class="hstack" style="gap:6px">${dates.map(x => `<span class="date">${dm(x)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="rbox stack" style="align-items:center;text-align:center;gap:10px">
          <div style="font-size:12px;font-weight:700;letter-spacing:.12em;color:#666">HỌC PHÍ GÓI MỚI</div>
          <div style="font-size:32px;font-weight:700">${money(total)}</div>
          ${priv.qr ? `<img src="${esc(priv.qr)}" alt="Mã QR chuyển khoản" style="width:140px;height:140px;object-fit:contain;border-radius:12px">` : ''}
          <div style="font-size:14px;line-height:1.6">${priv.account ? `Số TK: <b>${esc(priv.account)}${priv.bank ? ' – ' + esc(priv.bank) : ''}</b><br>` : ''}${priv.holder ? `Chủ TK: <b>${esc(priv.holder)}</b>` : ''}${!priv.account ? '<span style="color:#999">Thêm số tài khoản trong Cài đặt</span>' : ''}</div>
        </div>
      </div>
      ${(v.overall || v.listenSpeak || v.readWrite || v.result) ? `<div class="stack" style="gap:8px;font-size:15px;line-height:1.6"><h3>NHẬN XÉT HỌC TẬP</h3>${block('Tổng quan', v.overall)}${block('Nghe – Nói', v.listenSpeak)}${block('Đọc – Viết', v.readWrite)}${block('Kết quả kiểm tra', v.result)}</div>` : ''}
      ${v.route ? `<div class="stack" style="gap:8px;font-size:15px;line-height:1.6"><h3>LỘ TRÌNH</h3><div>${esc(v.route).replace(/\n/g, '<br>')}</div></div>` : ''}
      ${v.schedule ? `<div class="stack" style="gap:8px;font-size:15px;line-height:1.6"><h3>LỊCH HỌC</h3><div>${esc(v.schedule).replace(/\n/g, '<br>')}</div></div>` : ''}
    </article>`;
  };

  const draw = () => {
    const s = d.students.find(x => x.id === state.selected);
    const v = s ? { ...defaults(s), ...(loadDraft(s.id) || {}) } : null;
    const hist = s ? d.payments.filter(p => p.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5) : [];
    const ta = (k, label, ph = '') => `<label class="lbl" style="flex-basis:100%">${label}<textarea class="field" data-k="${k}" placeholder="${esc(ph)}">${esc(v[k] || '')}</textarea></label>`;
    el.innerHTML = `
      <header class="card head"><h1>HỌC PHÍ</h1><p>Học phí theo gói buổi: theo dõi gói sắp hết, tạo phiếu gia hạn và ghi nhận khoản đã thu.</p></header>
      <section class="card pad stack">
        <div class="between"><div><h2 style="font-size:20px">Gói học sắp hết</h2><div class="muted" style="font-size:14px">Học viên còn ≤ 4 buổi hoặc chưa đóng gói mới</div></div></div>
        ${expiring.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">${expiring.map(x => { const l = pkgLeft(x, d.logs); return `<button class="panel stack" data-sel="${esc(x.id)}" style="padding:14px 16px;gap:8px;text-align:left;font:inherit;color:inherit;cursor:pointer;${x.id === state.selected ? 'outline:2px solid var(--pri)' : ''}">
          <span class="between"><b>${esc(x.name)}</b><span class="muted" style="font-size:13px">${esc(cmap[x.classId]?.name || '')}</span></span>
          <span style="font-size:14px">${x.status === 'unpaid' ? '<span class="pill bad">Chưa đóng gói mới</span>' : `Còn <b>${l}</b> / ${x.pkgTotal} buổi`}</span>
          <span class="bar"><i style="width:${x.pkgTotal ? Math.round(l / x.pkgTotal * 100) : 0}%;background:#C0822E"></i></span></button>`; }).join('')}</div>` : '<div class="empty">Không có gói nào sắp hết.</div>'}
      </section>
      ${s ? `<section class="card" style="overflow:hidden">
        <div class="between" style="padding:20px 26px;border-bottom:1px solid rgba(var(--rgb),.12)">
          <div><h2 style="font-size:24px">Tạo phiếu học phí</h2><div class="muted" style="font-size:14px">${esc(s.name)} · ${esc(cmap[s.classId]?.name || '')}</div></div>
          <div class="hstack">
            <label class="lbl" style="flex:0 1 220px"><span class="sr">Học viên</span><select class="field" data-student>${d.students.slice().sort((a, b) => a.name.localeCompare(b.name, 'vi')).map(x => `<option value="${esc(x.id)}" ${x.id === s.id ? 'selected' : ''}>${esc(x.name)} · ${esc(cmap[x.classId]?.name || '')}</option>`).join('')}</select></label>
            <div class="seg" role="group" aria-label="Chọn mẫu phiếu">${[1, 2, 3].map(n => `<button data-tpl="${n}" aria-pressed="${state.tpl === n}">Mẫu ${n}</button>`).join('')}</div>
          </div></div>
        <div class="row" style="gap:0">
          <div class="stack" style="flex:1 1 400px;min-width:0;padding:22px 26px;gap:14px;border-right:1px solid rgba(var(--rgb),.12)">
            <div class="panel stack" style="padding:16px 18px"><div class="muted" style="font-size:12px;font-weight:700;letter-spacing:.12em">PHẦN 01 · GÓI MỚI</div>
              <div class="hstack" style="gap:12px"><label class="lbl">Số buổi<input class="field" type="number" min="1" data-k="sessions" value="${esc(v.sessions)}"></label><label class="lbl">Học phí/buổi (₫)<input class="field" type="number" min="0" step="1000" data-k="fee" value="${esc(v.fee)}"></label></div></div>
            <div class="panel stack" style="padding:16px 18px"><div class="muted" style="font-size:12px;font-weight:700;letter-spacing:.12em">PHẦN 02 · NHẬN XÉT</div><div class="hstack" style="gap:12px">
              ${ta('overall', 'Tổng quan', 'Có ý thức, hoàn thành BTVN đầy đủ…')}${ta('listenSpeak', 'Nghe – Nói', '+ …')}${ta('readWrite', 'Đọc – Viết', '+ …')}${ta('result', 'Kết quả kiểm tra')}</div></div>
            <div class="panel stack" style="padding:16px 18px"><div class="muted" style="font-size:12px;font-weight:700;letter-spacing:.12em">PHẦN 03 · LỘ TRÌNH &amp; LỊCH HỌC</div><div class="hstack" style="gap:12px">${ta('route', 'Lộ trình sắp tới')}${ta('schedule', 'Lịch học hiển thị trên phiếu')}</div></div>
            <button class="btn btn-ghost" data-reset style="align-self:flex-start">Khôi phục nội dung gợi ý</button>
            ${hist.length ? `<div class="stack" style="gap:6px"><b>Lịch sử đóng phí</b>${hist.map(p => `<div class="between" style="font-size:14px;border-bottom:1px dashed rgba(var(--rgb),.2);padding:6px 0"><span>${dmy(p.date)} · ${p.sessions || '–'} buổi</span><b>${money(p.amount)}</b></div>`).join('')}</div>` : ''}
          </div>
          <div class="stack" style="flex:1 1 440px;min-width:0;padding:22px 26px;background:var(--glass);gap:14px">
            <div><b>Phiếu hiển thị trực tiếp · Mẫu ${state.tpl}</b><div class="muted" style="font-size:13px">Cập nhật ngay khi bạn nhập. Nội dung nháp được lưu trên trình duyệt này.</div></div>
            <div data-preview>${receiptHtml(s, v)}</div>
          </div>
        </div>
        <div class="hstack" style="padding:16px 26px;justify-content:flex-end;border-top:1px solid rgba(var(--rgb),.12)">
          <button class="btn btn-ghost" data-unpaid style="margin-right:auto">Đánh dấu chưa đóng</button>
          <button class="btn btn-ghost" data-pdf>Xuất PDF</button>
          <button class="btn btn-ghost" data-png>Xuất phiếu (ảnh)</button>
          <button class="btn btn-primary" data-paid>Ghi nhận đã thu</button>
        </div>
      </section>` : '<div class="card empty">Chưa có học viên.</div>'}`;

    el.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { state.selected = b.dataset.sel; draw(); });
    if (!s) return;
    el.querySelector('[data-student]').onchange = e => { state.selected = e.target.value; draw(); };
    el.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { state.tpl = Number(b.dataset.tpl); draw(); });
    const cur = () => { const o = { ...v }; el.querySelectorAll('[data-k]').forEach(i => o[i.dataset.k] = i.value); return o; };
    el.querySelectorAll('[data-k]').forEach(i => i.oninput = () => { const o = cur(); saveDraft(s.id, o); el.querySelector('[data-preview]').innerHTML = receiptHtml(s, o); });
    el.querySelector('[data-reset]').onclick = () => { try { localStorage.removeItem(DRAFT(s.id)); } catch { } draw(); };
    el.querySelector('[data-png]').onclick = async () => { try { await exportImage(el.querySelector('#receipt'), `phieu-hoc-phi-${s.name}.png`); } catch (e) { toast(e.message); } };
    el.querySelector('[data-pdf]').onclick = () => {
      const w = window.open('', '_blank'); if (!w) { toast('Trình duyệt đã chặn cửa sổ mới'); return; }
      w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Phiếu học phí ${esc(s.name)}</title><link rel="stylesheet" href="${new URL('css/app.css', location.href)}"><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet"><style>body{background:#fff;padding:24px;max-width:760px;margin:auto}@page{margin:12mm}</style></head><body>${el.querySelector('#receipt').outerHTML}<script>setTimeout(()=>print(),600)<\/script></body></html>`);
      w.document.close();
    };
    el.querySelector('[data-unpaid]').onclick = async () => { await store.update('students', s.id, { status: 'unpaid' }); s.status = 'unpaid'; toast('Đã đánh dấu chưa đóng'); ctx.rerender(); };
    el.querySelector('[data-paid]').onclick = () => {
      const o = cur(); const sessions = Number(o.sessions) || 0; const fee = Number(o.fee) || 0;
      formModal({
        title: 'Ghi nhận đã thu · ' + s.name,
        extra: `<p style="margin:0">Gói mới <b>${sessions} buổi</b>. Số buổi còn lại của gói cũ (${pkgLeft(s, d.logs)}) được cộng dồn vào gói mới.</p>`,
        fields: [
          { name: 'amount', label: 'Số tiền đã thu (₫)', type: 'number', value: sessions * fee, min: 0, step: 1000, required: true },
          { name: 'date', label: 'Ngày thu', type: 'date', value: today(), required: true }
        ],
        submit: 'Ghi nhận',
        onSubmit: async x => {
          const left = pkgLeft(s, d.logs);
          await store.add('payments', { studentId: s.id, classId: s.classId, amount: x.amount, sessions, date: x.date });
          await store.update('students', s.id, { pkgTotal: left + sessions, pkgUsed: 0, pkgStart: today(), status: 'ok' });
          toast('Đã ghi nhận ' + money(x.amount)); ctx.rerender();
        }
      });
    };
  };
  draw();
}
