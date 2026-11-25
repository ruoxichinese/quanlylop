import { store } from '../store.js';
import { esc, THEMES, swatch, toast } from '../ui.js';
import { app, setTheme, reloadSettings } from '../app.js';
import { DEMO } from '../config.js';

async function shrinkImage(file, size = 360) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const k = Math.min(1, size / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  return c.toDataURL('image/png');
}

export async function render(el, ctx) {
  const s = app.settings; const p = s.priv || {};
  let qr = p.qr || '';
  el.innerHTML = `
    <header class="card head between"><div><h1>CÀI ĐẶT</h1><p>Thông tin hiển thị, nhận học phí và giao diện.</p></div><button class="btn btn-primary" data-save>Lưu thay đổi</button></header>
    <div class="row">
      <div class="stack" style="flex:1 1 420px;min-width:0;gap:20px">
        <section class="card pad stack"><h2 style="font-size:20px">Thông tin hiển thị</h2><p class="muted" style="margin:0">Dùng trên menu, trang đăng nhập và phiếu học phí.</p>
          <div class="hstack" style="gap:14px">
            <label class="lbl">Tên lớp / thương hiệu<input class="field" data-f="brand" value="${esc(s.brand)}"></label>
            <label class="lbl">Tên giáo viên<input class="field" data-f="teacherName" value="${esc(s.teacherName)}" placeholder="Họ tên hiện trên phiếu"></label>
            <label class="lbl">Số điện thoại (chỉ giáo viên thấy)<input class="field" type="tel" data-p="phone" value="${esc(p.phone)}"></label>
            <label class="lbl">Môn dạy<input class="field" data-f="subject" value="${esc(s.subject)}"></label>
          </div></section>
        <section class="card pad stack"><h2 style="font-size:20px">Nhận học phí</h2><p class="muted" style="margin:0">Hiện trên phiếu học phí. Chỉ tài khoản giáo viên đọc được.</p>
          <div class="hstack" style="gap:14px">
            <label class="lbl">Ngân hàng<input class="field" data-p="bank" value="${esc(p.bank)}" placeholder="VD: MB Bank"></label>
            <label class="lbl">Số tài khoản<input class="field" inputmode="numeric" data-p="account" value="${esc(p.account)}"></label>
            <label class="lbl">Chủ tài khoản<input class="field" data-p="holder" value="${esc(p.holder)}" placeholder="VIET HOA KHONG DAU"></label>
          </div>
          <div class="hstack" style="gap:14px">
            <div data-qrbox style="width:110px;height:110px;border-radius:14px;border:2px dashed rgba(var(--rgb),.35);display:flex;align-items:center;justify-content:center;font-size:12px;overflow:hidden" class="muted">${qr ? `<img src="${esc(qr)}" alt="Mã QR" style="width:100%;height:100%;object-fit:contain">` : 'Mã QR'}</div>
            <label class="btn btn-ghost">Tải ảnh mã QR<input type="file" accept="image/*" data-qr class="sr"></label>
            ${qr ? '<button class="btn btn-ghost" data-qrdel>Xoá mã QR</button>' : ''}
          </div></section>
      </div>
      <div class="stack" style="flex:1 1 380px;min-width:0;gap:20px">
        <section class="card pad stack"><h2 style="font-size:20px">Giao diện</h2><p class="muted" style="margin:0">Mỗi người có thể tự chọn giao diện ở menu trái. Mục này đặt giao diện mặc định cho người mới.</p>
          <div class="grid" role="group" aria-label="Giao diện mặc định" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px">
            ${THEMES.map(([id, n, a, b]) => `<button class="thm panel" data-def="${id}" aria-pressed="${(s.theme || 'forest') === id}" style="flex-direction:column;align-items:flex-start;padding:14px;min-height:80px"><span class="sw" style="${swatch(a, b)};width:30px;height:30px"></span>${n}</button>`).join('')}
          </div></section>
        <section class="card pad stack"><h2 style="font-size:20px">Học tập</h2>
          <div class="hstack" style="gap:14px">
            <label class="lbl">Chuẩn số từ HSK<select class="field" data-f="hskStandard"><option value="2.0" ${s.hskStandard !== '3.0' ? 'selected' : ''}>HSK 2.0 (6 cấp)</option><option value="3.0" ${s.hskStandard === '3.0' ? 'selected' : ''}>HSK 3.0 (9 cấp)</option></select></label>
            <label class="lbl">Học phí mặc định/buổi (₫)<input class="field" type="number" min="0" step="1000" data-f="defaultFee" value="${esc(s.defaultFee)}"></label>
          </div></section>
        ${DEMO ? `<section class="card pad stack"><h2 style="font-size:20px">Dữ liệu demo</h2><p class="muted" style="margin:0">Đang chạy chế độ demo: dữ liệu chỉ nằm trong trình duyệt này.</p><button class="btn btn-danger" data-reset style="align-self:flex-start">Tạo lại dữ liệu mẫu</button></section>` : ''}
      </div>
    </div>`;

  let def = s.theme || 'forest';
  el.querySelectorAll('[data-def]').forEach(b => b.onclick = () => { def = b.dataset.def; el.querySelectorAll('[data-def]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); setTheme(def); });
  el.querySelector('[data-qr]').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { qr = await shrinkImage(f); el.querySelector('[data-qrbox]').innerHTML = `<img src="${qr}" alt="Mã QR" style="width:100%;height:100%;object-fit:contain">`; toast('Đã chọn ảnh, bấm Lưu thay đổi'); }
    catch { toast('Không đọc được ảnh'); }
  };
  const qd = el.querySelector('[data-qrdel]'); if (qd) qd.onclick = () => { qr = ''; el.querySelector('[data-qrbox]').textContent = 'Mã QR'; };
  el.querySelector('[data-save]').onclick = async () => {
    const pub = { brand: s.brand, teacherName: s.teacherName, subject: s.subject, hskStandard: s.hskStandard, defaultFee: s.defaultFee, defaultDuration: s.defaultDuration, theme: def };
    el.querySelectorAll('[data-f]').forEach(i => pub[i.dataset.f] = i.type === 'number' ? Number(i.value) || 0 : i.value.trim());
    const priv = { qr };
    el.querySelectorAll('[data-p]').forEach(i => priv[i.dataset.p] = i.value.trim());
    await store.set('settings', 'public', pub);
    await store.set('settings', 'private', priv);
    await reloadSettings(); toast('Đã lưu cài đặt'); ctx.rerender();
  };
  const r = el.querySelector('[data-reset]'); if (r) r.onclick = async () => { if (!confirm('Xoá mọi thay đổi và tạo lại dữ liệu mẫu?')) return; await store.reset(); await reloadSettings(); toast('Đã tạo lại dữ liệu mẫu'); ctx.rerender(); };
}
