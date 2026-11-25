// Lớp dữ liệu: cùng một API cho chế độ demo (localStorage) và Firebase (Firestore)
import { DEMO, firebaseConfig, OWNER_EMAIL } from './config.js';
import { uid } from './ui.js';

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
// Các bộ dữ liệu được lọc theo lớp khi người dùng là trợ giảng
const BY_CLASS = ['students', 'logs', 'tests', 'words', 'vocab'];

export const session = { user: null }; // {email,name,photo,role,classIds}

export const isTeacher = () => session.user?.role === 'teacher';

/* ---------------- DEMO ---------------- */
const KEY = 'lh-demo-v1';
class DemoStore {
  async init() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch { /* bị chặn */ }
    if (raw) this.db = JSON.parse(raw);
    else { const { buildSeed } = await import('./seed.js'); this.db = buildSeed(); this.save(); }
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.db)); } catch { /* bỏ qua */ } }
  async reset() { const { buildSeed } = await import('./seed.js'); this.db = buildSeed(); this.save(); }
  scopeOk(col, doc, id) {
    const u = session.user; if (!u || u.role === 'teacher') return true;
    if (col === 'settings') return id === 'public';
    if (col === 'classes') return u.classIds.includes(id);
    if (BY_CLASS.includes(col)) return u.classIds.includes(doc.classId);
    return false;
  }
  async list(col) {
    const c = this.db[col] || {};
    return Object.entries(c).filter(([id, d]) => this.scopeOk(col, d, id)).map(([id, d]) => ({ id, ...d }));
  }
  async get(col, id) { const d = this.db[col]?.[id]; return d && this.scopeOk(col, d, id) ? { id, ...d } : null; }
  async add(col, data) { const id = uid(); return this.set(col, id, data).then(() => id); }
  async set(col, id, data) { this.guard(col, data); (this.db[col] ||= {})[id] = strip(data); this.save(); }
  async update(col, id, patch) { const cur = this.db[col]?.[id] || {}; this.guard(col, { ...cur, ...patch }); this.db[col][id] = { ...cur, ...strip(patch) }; this.save(); }
  async remove(col, id) { this.guard(col, this.db[col]?.[id] || {}); delete this.db[col]?.[id]; this.save(); }
  guard(col, data) {
    const u = session.user; if (!u || u.role === 'teacher') return;
    const ok = ['logs', 'tests', 'words', 'vocab'].includes(col) && u.classIds.includes(data.classId);
    if (!ok) throw new Error('Tài khoản trợ giảng không có quyền thay đổi mục này.');
  }
  // Đăng nhập demo
  async demoLogin(role) {
    if (role === 'teacher') session.user = { email: 'giaovien@demo', name: 'Giáo viên (demo)', role: 'teacher', classIds: [] };
    else { const u = this.db.users['minhanh.tg@gmail.com']; session.user = { email: 'minhanh.tg@gmail.com', name: u.name, role: 'assistant', classIds: u.classIds }; }
    try { sessionStorage.setItem('lh-demo-user', JSON.stringify(session.user)); } catch { }
  }
  async restore() { try { const s = sessionStorage.getItem('lh-demo-user'); if (s) session.user = JSON.parse(s); } catch { } return session.user; }
  async logout() { session.user = null; try { sessionStorage.removeItem('lh-demo-user'); } catch { } }
}

/* ---------------- FIREBASE ---------------- */
class FireStore {
  async init() {
    const [{ initializeApp }, A, F] = await Promise.all([
      import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js')
    ]);
    this.A = A; this.F = F;
    this.app = initializeApp(firebaseConfig);
    this.auth = A.getAuth(this.app);
    this.fs = F.getFirestore(this.app);
  }
  ref(col, id) { return this.F.doc(this.fs, col, id); }
  async list(col) {
    const F = this.F, u = session.user;
    if (u.role !== 'teacher') {
      if (col === 'classes') {
        const docs = await Promise.all(u.classIds.map(id => F.getDoc(this.ref('classes', id))));
        return docs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() }));
      }
      if (BY_CLASS.includes(col)) {
        if (!u.classIds.length) return [];
        const snap = await F.getDocs(F.query(F.collection(this.fs, col), F.where('classId', 'in', u.classIds.slice(0, 30))));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      if (col === 'settings') { const d = await F.getDoc(this.ref('settings', 'public')); return d.exists() ? [{ id: 'public', ...d.data() }] : []; }
      return [];
    }
    const snap = await F.getDocs(F.collection(this.fs, col));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  async get(col, id) { const d = await this.F.getDoc(this.ref(col, id)); return d.exists() ? { id: d.id, ...d.data() } : null; }
  async add(col, data) { const r = await this.F.addDoc(this.F.collection(this.fs, col), strip(data)); return r.id; }
  async set(col, id, data) { await this.F.setDoc(this.ref(col, id), strip(data)); }
  async update(col, id, patch) { await this.F.setDoc(this.ref(col, id), strip(patch), { merge: true }); }
  async remove(col, id) { await this.F.deleteDoc(this.ref(col, id)); }

  async googleLogin() {
    const p = new this.A.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    await this.A.signInWithPopup(this.auth, p);
  }
  // Chờ Firebase khôi phục phiên, rồi xác định vai trò
  restore() {
    return new Promise(resolve => {
      const off = this.A.onAuthStateChanged(this.auth, async fu => {
        off();
        if (!fu) return resolve(null);
        resolve(await this.resolveRole(fu));
      });
    });
  }
  async resolveRole(fu) {
    const email = (fu.email || '').toLowerCase();
    const base = { email, name: fu.displayName || email, photo: fu.photoURL || '' };
    if (OWNER_EMAIL && email === OWNER_EMAIL.toLowerCase()) {
      session.user = { ...base, role: 'teacher', classIds: [] };
      return session.user;
    }
    let u = null;
    try { u = await this.get('users', email); } catch (e) { console.warn(e); }
    if (!u) { session.user = { ...base, role: 'none' }; return session.user; }
    if (u.status === 'invited') {
      await this.update('users', email, { status: 'active', name: base.name, photo: base.photo });
      u.status = 'active';
    }
    session.user = { ...base, role: u.role, classIds: u.classIds || [], status: u.status };
    return session.user;
  }
  async logout() { await this.A.signOut(this.auth); session.user = null; }
}

function strip(o) { const r = {}; for (const [k, v] of Object.entries(o || {})) if (k !== 'id' && v !== undefined) r[k] = v; return r; }

export const store = DEMO ? new DemoStore() : new FireStore();

// Cache đơn giản cho mỗi lần vẽ trang
export async function loadAll(cols) {
  const out = {};
  await Promise.all(cols.map(async c => { out[c] = await store.list(c).catch(e => { console.warn('Không đọc được', c, e); return []; }); }));
  return out;
}

export async function getSettings() {
  const pub = (await store.get('settings', 'public').catch(() => null)) || {};
  let priv = {};
  if (isTeacher()) priv = (await store.get('settings', 'private').catch(() => null)) || {};
  return {
    brand: 'LỚP HỌC', teacherName: '', subject: 'Tiếng Trung', theme: 'forest', hskStandard: '2.0', defaultFee: 200000, defaultDuration: 2,
    ...pub, priv: { phone: '', bank: '', account: '', holder: '', qr: '', ...priv }
  };
}
