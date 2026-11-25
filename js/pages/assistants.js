import { loadAll, store } from '../store.js';
import { esc, initials, dmy, today, formModal, toast } from '../ui.js';
import { byId } from '../calc.js';
import { DEMO } from '../config.js';

const PERMS = [
  ['Xem lịch dạy', 'Chỉ các lớp được giao', true],
  ['Ghi nhật ký buổi học', 'Bài học, BTVN, phát âm, nhận xét', true],
  ['Nhập và sửa điểm', 'Thi thử, đánh giá nói, bài kiểm tra', true],
  ['Cập nhật từ vựng', 'Số từ đã học, từ hay sai', true],
  ['Xem danh sách học viên', 'Tên, lớp, mục tiêu, kết quả gần nhất', true],
  ['Xem liên hệ phụ huynh / học viên', 'Tên liên hệ, số điện thoại', false],
  ['Xem học phí, gói học và doanh thu', '', false],
  ['Tạo và sửa lớp, học viên', '', false],
  ['Mời và quản lý trợ giảng', '', false]
];

export async function render(el, ctx) {
  const d = await loadAll(['users', 'classes']);
  const cmap = byId(d.classes);
  const tas = d.users.filter(u => u.role === 'assistant').sort((a, b) => (a.status === 'invited') - (b.status === 'invited'));
  const active = tas.filter(u => u.status === 'active').length;
  const opts = d.classes.map(c => [c.id, c.name]);

  // Giữ danh sách trợ giảng trên lớp (để hiển thị ở thẻ lớp) đồng bộ với quyền
  async function syncClasses(email, classIds) {
    for (const c of d.classes) {
      const has = (c.assistants || []).includes(email); const want = classIds.includes(c.id);
      if (has !== want) await store.update('classes', c.id, { assistants: want ? [...(c.assistants || []), email] : (c.assistants || []).filter(e => e !== email) });
    }
  }

  el.innerHTML = `
    <header class="card head"><h1>TRỢ GIẢNG</h1><p>Mời trợ giảng bằng email Google, giao lớp và thu hồi quyền.</p></header>
    <div class="row">
      <section class="card pad stack" style="flex:1 1 340px;min-width:0;gap:16px">
        <h2 style="font-size:20px">Mời trợ giảng mới</h2>
        <form class="stack" data-invite style="gap:14px">
          <label class="lbl">Email Google<input class="field" type="email" name="email" required placeholder="ten.trogiang@gmail.com" autocomplete="off"></label>
          <fieldset class="lbl" style="border:0;margin:0;padding:0"><legend style="margin-bottom:8px">Lớp phụ trách</legend>
            <div class="hstack">${opts.map(([id, n]) => `<label class="pill line" style="min-height:40px;padding:0 12px;font-size:14px;cursor:pointer"><input type="checkbox" name="cls" value="${esc(id)}"> ${esc(n)}</label>`).join('') || '<span class="muted">Chưa có lớp</span>'}</div></fieldset>
          <button class="btn btn-primary" type="submit">Gửi lời mời</button>
          <p class="muted" style="margin:0;font-size:13px;line-height:1.5">Trang không tự gửi email. Sau khi thêm, hãy nhắn trợ giảng mở trang và bấm “Tiếp tục với Google” bằng đúng email này.${DEMO ? ' (Chế độ demo: không đăng nhập thật được.)' : ''}</p>
        </form>
      </section>
      <section class="card pad stack" style="flex:2 1 480px;min-width:0;gap:14px">
        <div class="between"><h2 style="font-size:20px">Danh sách trợ giảng</h2><span class="muted" style="font-size:14px">${active} đang hoạt động · ${tas.length - active} chờ đăng nhập</span></div>
        ${tas.length ? tas.map(u => `<article class="panel hstack" style="padding:16px 18px;gap:14px">
          <span class="ini" style="width:48px;height:48px;flex-basis:48px">${esc(initials(u.name || u.id))}</span>
          <div class="stack" style="flex:1 1 220px;gap:4px;min-width:0">
            <div class="hstack"><b style="font-size:17px">${esc(u.name || 'Chưa đăng nhập')}</b><span class="pill ${u.status === 'active' ? 'ok' : 'warn'}">${u.status === 'active' ? 'Đang hoạt động' : 'Chờ đăng nhập'}</span></div>
            <div class="muted" style="font-size:14px;overflow-wrap:anywhere">${esc(u.id)}</div>
            <div class="hstack" style="gap:6px">${(u.classIds || []).map(id => `<span class="pill soft">${esc(cmap[id]?.name || 'Lớp đã xoá')}</span>`).join('') || '<span class="muted" style="font-size:13px">Chưa giao lớp</span>'}</div>
          </div>
          <div class="muted" style="font-size:13px">Mời ngày ${dmy(u.invitedAt)}</div>
          <div class="hstack"><button class="btn btn-ghost" data-edit="${esc(u.id)}">Sửa lớp</button><button class="btn btn-danger" data-revoke="${esc(u.id)}">${u.status === 'active' ? 'Thu hồi' : 'Huỷ lời mời'}</button></div>
        </article>`).join('') : '<div class="empty">Chưa có trợ giảng nào.</div>'}
      </section>
    </div>
    <section class="card pad stack">
      <div><h2 style="font-size:20px">Quyền của trợ giảng</h2><p class="muted" style="margin:4px 0 0">Được áp dụng bằng quy tắc bảo mật Firestore (file firestore.rules), không chỉ ẩn trên giao diện.</p></div>
      <div class="tbl-wrap"><table class="tbl" style="min-width:600px"><thead><tr><th>CHỨC NĂNG</th><th class="c" style="width:140px">GIÁO VIÊN</th><th class="c" style="width:140px">TRỢ GIẢNG</th></tr></thead><tbody>
        ${PERMS.map(([n, desc, ta]) => `<tr><td><b>${n}</b>${desc ? `<div class="muted" style="font-size:13px">${desc}</div>` : ''}</td><td class="c"><span class="pill ok">Có</span></td><td class="c"><span class="pill ${ta ? 'ok' : 'bad'}">${ta ? 'Có' : 'Không'}</span></td></tr>`).join('')}
      </tbody></table></div>
    </section>`;

  el.querySelector('[data-invite]').onsubmit = async e => {
    e.preventDefault();
    const f = e.target; const email = f.email.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Email chưa đúng định dạng'); return; }
    if (d.users.some(u => u.id === email)) { toast('Email này đã có trong danh sách'); return; }
    const classIds = [...f.querySelectorAll('[name=cls]:checked')].map(i => i.value);
    await store.set('users', email, { role: 'assistant', status: 'invited', name: '', classIds, invitedAt: today() });
    await syncClasses(email, classIds);
    toast('Đã thêm ' + email); ctx.rerender();
  };
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const u = tas.find(x => x.id === b.dataset.edit);
    formModal({
      title: 'Lớp phụ trách · ' + (u.name || u.id),
      fields: [{ name: 'classIds', label: 'Lớp', type: 'multi', value: u.classIds || [], options: opts, full: true }],
      onSubmit: async v => { await store.update('users', u.id, { classIds: v.classIds }); await syncClasses(u.id, v.classIds); toast('Đã cập nhật'); ctx.rerender(); }
    });
  });
  el.querySelectorAll('[data-revoke]').forEach(b => b.onclick = async () => {
    const u = tas.find(x => x.id === b.dataset.revoke);
    if (!confirm(`Thu hồi quyền của ${u.id}? Người này sẽ không vào được lớp nữa. Nhật ký và điểm họ đã nhập vẫn được giữ.`)) return;
    await store.remove('users', u.id); await syncClasses(u.id, []); toast('Đã thu hồi quyền'); ctx.rerender();
  });
}
