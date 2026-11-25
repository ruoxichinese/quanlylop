import { DEMO, OWNER_EMAIL } from './config.js';
import { store, session, isTeacher, getSettings } from './store.js';
import { esc, icon, initials, THEMES, swatch, toast } from './ui.js';

// Trang: [đường dẫn, nhãn, icon, nhóm, chỉ giáo viên]
const PAGES = [
  ['overview', 'Tổng quan', 'overview', '', false],
  ['schedule', 'Lịch dạy', 'schedule', 'QUẢN LÝ', false],
  ['classes', 'Lớp học', 'classes', 'QUẢN LÝ', false],
  ['students', 'Học viên', 'students', 'QUẢN LÝ', false],
  ['assistants', 'Trợ giảng', 'assistants', 'QUẢN LÝ', true],
  ['journal', 'Nhật ký học tập', 'journal', 'TIẾN ĐỘ', false],
  ['vocab', 'Từ vựng', 'vocab', 'TIẾN ĐỘ', false],
  ['grades', 'Điểm số', 'grades', 'TIẾN ĐỘ', false],
  ['tuition', 'Học phí', 'tuition', 'TIẾN ĐỘ', true]
];
const MODULES = {
  overview: () => import('./pages/overview.js'), schedule: () => import('./pages/schedule.js'),
  classes: () => import('./pages/classes.js'), students: () => import('./pages/students.js'),
  assistants: () => import('./pages/assistants.js'), journal: () => import('./pages/journal.js'),
  vocab: () => import('./pages/vocab.js'), grades: () => import('./pages/grades.js'),
  tuition: () => import('./pages/tuition.js'), settings: () => import('./pages/settings.js')
};

export const app = { settings: null, theme: 'forest' };
const root = document.getElementById('app');

export function setTheme(id) {
  app.theme = id;
  document.body.className = 't-' + id;
  try { localStorage.setItem('lh-theme', id); } catch { }
  document.querySelectorAll('.thm').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === id)));
}

function route() {
  const [path, qs] = (location.hash.replace(/^#\/?/, '') || 'overview').split('?');
  return { path, params: new URLSearchParams(qs || '') };
}
export function go(path, params) { location.hash = '#/' + path + (params ? '?' + new URLSearchParams(params) : ''); }

function sidebar(active) {
  const u = session.user; const teacher = isTeacher();
  let lastGrp = '';
  const links = PAGES.filter(p => teacher || !p[4]).map(([path, label, ic, grp]) => {
    const g = grp && grp !== lastGrp ? `<div class="grp">${grp}</div>` : ''; lastGrp = grp || lastGrp;
    return `${g}<a class="nav ${active === path ? 'on' : ''}" href="#/${path}" ${active === path ? 'aria-current="page"' : ''}>${icon(ic)}${label}</a>`;
  }).join('');
  const avatar = u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : esc(initials(u.name));
  return `<aside class="card side" aria-label="Điều hướng chính">
    <div class="brand"><div class="logo">${esc(initials(app.settings.brand || 'LH'))}</div><b>${esc(app.settings.brand || 'LỚP HỌC')}</b></div>
    <div class="me"><div class="avatar">${avatar}</div><div class="stack" style="gap:4px;min-width:0">
      <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(u.name)}</div>
      <span class="role">${teacher ? 'GIÁO VIÊN' : 'TRỢ GIẢNG'}</span></div></div>
    ${links}
    <div class="grp">GIAO DIỆN</div>
    <div role="group" aria-label="Chọn giao diện" class="stack" style="gap:2px">
      ${THEMES.map(([id, name, a, b]) => `<button class="thm" data-theme="${id}" aria-pressed="${app.theme === id}"><span class="sw" style="${swatch(a, b)}"></span>${name}</button>`).join('')}
    </div>
    ${teacher ? `<a class="nav ${active === 'settings' ? 'on' : ''}" href="#/settings" style="margin-top:12px">${icon('settings')}Cài đặt</a>` : ''}
    <button class="nav" data-logout style="border:1px solid rgba(var(--rgb),.18);background:none;cursor:pointer;font:inherit;margin-top:6px">${icon('logout')}Đăng xuất</button>
    ${DEMO ? '<p class="muted" style="font-size:12px;margin:10px 6px 0">Chế độ demo: dữ liệu chỉ lưu trong trình duyệt này.</p>' : ''}
  </aside>`;
}

async function draw() {
  const u = session.user;
  if (!u) return renderLogin();
  if (u.role === 'none') return renderNoAccess();
  const { path, params } = route();
  const allowed = PAGES.find(p => p[0] === path && (isTeacher() || !p[4])) || (path === 'settings' && isTeacher());
  const page = allowed ? path : 'overview';
  root.innerHTML = sidebar(page) + '<main class="main" id="main"><div class="card head"><p class="muted">Đang tải…</p></div></main>';
  root.querySelectorAll('.thm').forEach(b => b.onclick = () => setTheme(b.dataset.theme));
  root.querySelector('[data-logout]').onclick = async () => { await store.logout(); app.settings = { brand: app.settings.brand }; render(); };
  const main = document.getElementById('main');
  try {
    const mod = await MODULES[page]();
    await mod.render(main, { params, rerender: render, app });
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="card head"><h1>Có lỗi khi tải trang</h1><p>${esc(e.message || e)}</p></div>`;
  }
  document.title = (PAGES.find(p => p[0] === page)?.[1] || 'Cài đặt') + ' · ' + (app.settings.brand || 'Lớp học');
}

function renderLogin() {
  const brand = esc(app.settings?.brand || 'LỚP HỌC');
  root.innerHTML = `<div class="login"><div class="login-inner">
    <section class="card pad stack" style="flex:1 1 380px;padding:40px 36px;gap:22px">
      <div class="brand" style="padding:0"><div class="logo" style="width:52px;height:52px">${esc(initials(app.settings?.brand || 'LH'))}</div><b style="font-size:24px">${brand}</b></div>
      <div><h1 style="font-size:34px;font-weight:700">Chào mừng trở lại</h1>
      <p class="muted" style="margin:10px 0 0;font-size:16px;line-height:1.55">Đăng nhập bằng tài khoản Google để vào lớp học của bạn.</p></div>
      ${DEMO ? `
        <button class="btn btn-primary" data-demo="teacher" style="min-height:50px">Vào bản demo · Giáo viên</button>
        <button class="btn btn-ghost" data-demo="assistant" style="min-height:50px">Vào bản demo · Trợ giảng</button>
        <p class="muted" style="margin:0;font-size:14px;line-height:1.5">Chưa cấu hình Firebase nên trang đang chạy chế độ demo với dữ liệu mẫu. Xem README.md để bật đăng nhập Google.</p>`
      : `<button class="gbtn" data-google><span aria-hidden="true" style="width:26px;height:26px;border-radius:50%;border:1px solid #DADCE0;display:flex;align-items:center;justify-content:center;font-weight:700;color:#4285F4">G</span>Tiếp tục với Google</button>
        <p class="err" style="margin:0;color:#B3261E;font-weight:600" hidden></p>`}
      <div class="panel" style="padding:14px 16px;font-size:14px;line-height:1.5">Chỉ email Google đã được giáo viên mời mới đăng nhập được. Chưa có quyền? Hãy nhờ giáo viên gửi lời mời.</div>
    </section>
    <section class="card pad stack" style="flex:1.3 1 440px;padding:36px;gap:16px">
      <div><h2 style="font-size:24px;font-weight:700">Phân quyền theo vai trò</h2><p class="muted" style="margin:6px 0 0">Sau khi đăng nhập, mỗi người chỉ thấy đúng phần việc của mình.</p></div>
      <div class="panel stack" style="padding:18px 20px;gap:8px"><div class="hstack"><b style="font-size:18px">Giáo viên</b><span class="pill" style="background:var(--pri);color:#fff">TOÀN QUYỀN</span></div>
        <div>✓ Quản lý lớp, học viên, lịch dạy, nhật ký, từ vựng và điểm số</div><div>✓ Xem doanh thu, gói học, tạo và xuất phiếu học phí</div><div>✓ Mời trợ giảng bằng email Google, cấp hoặc thu hồi quyền</div></div>
      <div class="panel stack" style="padding:18px 20px;gap:8px"><div class="hstack"><b style="font-size:18px">Trợ giảng</b><span class="pill soft">THEO LỚP ĐƯỢC GIAO</span></div>
        <div>✓ Xem lịch dạy và học viên của lớp phụ trách</div><div>✓ Ghi nhật ký buổi học, nhập điểm, cập nhật từ vựng</div><div>✕ Không xem học phí, doanh thu, liên hệ và cài đặt</div></div>
    </section></div></div>`;
  root.querySelectorAll('[data-demo]').forEach(b => b.onclick = async () => { await store.demoLogin(b.dataset.demo); render(); });
  const g = root.querySelector('[data-google]');
  if (g) g.onclick = async () => {
    const err = root.querySelector('.err');
    try { await store.googleLogin(); await store.restore(); render(); }
    catch (e) { err.hidden = false; err.textContent = e.code === 'auth/popup-closed-by-user' ? 'Bạn đã đóng cửa sổ đăng nhập.' : 'Không đăng nhập được: ' + (e.message || e); }
  };
}

function renderNoAccess() {
  root.innerHTML = `<div class="login"><section class="card pad stack" style="max-width:520px;gap:16px">
    <h1>Chưa được cấp quyền</h1>
    <p>Tài khoản <b>${esc(session.user.email)}</b> chưa được giáo viên mời vào lớp. Hãy gửi email này cho giáo viên để được thêm, rồi đăng nhập lại.</p>
    ${!OWNER_EMAIL ? '<p class="muted">Ghi chú cho giáo viên: chưa điền OWNER_EMAIL trong js/config.js.</p>' : ''}
    <button class="btn btn-ghost" data-out>Đăng nhập bằng tài khoản khác</button></section></div>`;
  root.querySelector('[data-out]').onclick = async () => { await store.logout(); render(); };
}

async function boot() {
  try { setTheme(localStorage.getItem('lh-theme') || 'forest'); } catch { setTheme('forest'); }
  try {
    await store.init();
    await store.restore();
    app.settings = session.user && session.user.role !== 'none' ? await getSettings() : { brand: 'LỚP HỌC' };
    if (session.user && !localStorage.getItem('lh-theme') && app.settings.theme) setTheme(app.settings.theme);
  } catch (e) {
    console.error(e);
    root.innerHTML = `<div class="login"><section class="card pad"><h1>Không khởi động được</h1><p>${esc(e.message || e)}</p><p class="muted">Kiểm tra cấu hình trong js/config.js.</p></section></div>`;
    return;
  }
  window.addEventListener('hashchange', render);
  render();
}

// Sau đăng nhập cần nạp cài đặt trước khi vẽ
async function render() {
  if (session.user && session.user.role !== 'none' && (!app.settings || !app.settings.priv)) app.settings = await getSettings();
  return draw();
}
export async function reloadSettings() { app.settings = await getSettings(); }

export { toast };
boot();
