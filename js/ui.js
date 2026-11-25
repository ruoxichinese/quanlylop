// Tiện ích giao diện dùng chung
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = n => (Math.round(Number(n) || 0)).toLocaleString('vi-VN') + ' ₫';
export const num = n => (Number(n) || 0).toLocaleString('vi-VN');
export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => ymd(new Date());
export const parseYmd = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
export const dmy = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '';
export const dm = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : '';
export const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const DOW_LONG = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
export const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const monthLabel = key => { const [y, m] = key.split('-'); return `Tháng ${Number(m)}/${y}`; };
export const addMonths = (key, n) => { const [y, m] = key.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return monthKey(d); };
export const minutes = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
export const hours = (a, b) => Math.max(0, (minutes(b) - minutes(a)) / 60);
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function initials(name) {
  const p = String(name || '?').trim().split(/\s+/);
  return ((p.length > 1 ? p[p.length - 2][0] : '') + p[p.length - 1][0]).toUpperCase();
}

// Màu lớp: [nền, chữ]
export const CLASS_COLORS = {
  green: ['#D3E2BE', '#A9C28A'], pink: ['#F4D6D6', '#E9B9B9'], lavender: ['#E1D8F0', '#BFAFDD'],
  blue: ['#CFDDF1', '#9DBBE0'], yellow: ['#F6E6BE', '#E8CB86'], brown: ['#6E6259', '#6E6259'],
  teal: ['#CDE9E4', '#86C3B8'], orange: ['#F8D9C2', '#E9A777']
};
export const COLOR_NAMES = { green: 'Xanh lá', pink: 'Hồng', lavender: 'Tím nhạt', blue: 'Xanh dương', yellow: 'Vàng', brown: 'Nâu đậm', teal: 'Xanh ngọc', orange: 'Cam' };
export const chipBg = c => (CLASS_COLORS[c] || CLASS_COLORS.green)[0];
export const dotColor = c => (CLASS_COLORS[c] || CLASS_COLORS.green)[1];
export const isDark = c => c === 'brown';

// Thang điểm HSK
export function hskLevel(cls) { const m = /HSK\s*(\d)/i.exec(cls?.level || cls?.name || ''); return m ? Number(m[1]) : 0; }
export function hskScale(level) {
  if (level === 1 || level === 2) return { max: 200, pass: 120, parts: ['listening', 'reading'] };
  if (level >= 3) return { max: 300, pass: 180, parts: ['listening', 'reading', 'writing'] };
  return null;
}
// Số từ cộng dồn
export const VOCAB = {
  '2.0': { 1: 150, 2: 300, 3: 600, 4: 1200, 5: 2500, 6: 5000 },
  '3.0': { 1: 500, 2: 1272, 3: 2245, 4: 3245, 5: 4316, 6: 5456, 7: 11092 }
};

export const ICONS = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  schedule: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
  classes: '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',
  students: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  assistants: '<circle cx="10" cy="8" r="4"/><path d="M3 21c1.4-4 4-6 7-6s5.6 2 7 6M19 8v6M16 11h6"/>',
  journal: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  vocab: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 8h6M9 12h4"/>',
  grades: '<path d="M5 20V12M12 20V5M19 20v-9"/>',
  tuition: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
};
export const icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

export const THEMES = [
  ['forest', 'Rừng xanh', '#4A6340', '#C4DDA6'], ['ocean', 'Biển xanh', '#2F5F86', '#B5D3EE'],
  ['sakura', 'Anh đào', '#A24F67', '#F4C7D4'], ['sunset', 'Hoàng hôn', '#A9541F', '#F7C99B'], ['night', 'Ban đêm', '#10151B', '#4F7D5A']
];
export const swatch = (a, b) => `background:linear-gradient(135deg,${b} 0 50%,${a} 50% 100%)`;

let toastTimer;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// Hộp thoại form. fields: [{name,label,type,value,options,required,full,hint,min,max,step,placeholder}]
export function formModal({ title, fields, submit = 'Lưu', danger, onSubmit, extra = '' }) {
  const dlg = document.getElementById('modal');
  const f = fields.map(x => {
    const id = 'f_' + x.name;
    const req = x.required ? 'required' : '';
    const style = x.full ? 'flex-basis:100%' : '';
    const hint = x.hint ? `<small>${esc(x.hint)}</small>` : '';
    let input;
    if (x.type === 'select') {
      input = `<select class="field" id="${id}" name="${x.name}" ${req}>${x.options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(x.value ?? '') ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
    } else if (x.type === 'multi') {
      const vals = new Set(x.value || []);
      input = `<div class="hstack">${x.options.map(([v, l]) => `<label class="pill line" style="min-height:40px;padding:0 12px;font-size:14px;cursor:pointer"><input type="checkbox" name="${x.name}" value="${esc(v)}" ${vals.has(v) ? 'checked' : ''}> ${esc(l)}</label>`).join('')}</div>`;
      return `<fieldset class="lbl" style="border:0;padding:0;margin:0;${style}"><legend style="margin-bottom:6px">${esc(x.label)}</legend>${input}${hint}</fieldset>`;
    } else if (x.type === 'textarea') {
      input = `<textarea class="field" id="${id}" name="${x.name}" placeholder="${esc(x.placeholder || '')}" ${req}>${esc(x.value ?? '')}</textarea>`;
    } else if (x.type === 'checkbox') {
      return `<label class="lbl" style="flex-direction:row;align-items:center;gap:10px;${style}"><input type="checkbox" name="${x.name}" ${x.value ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--pri)"> ${esc(x.label)}</label>`;
    } else {
      input = `<input class="field" id="${id}" name="${x.name}" type="${x.type || 'text'}" value="${esc(x.value ?? '')}" placeholder="${esc(x.placeholder || '')}" ${x.min != null ? `min="${x.min}"` : ''} ${x.max != null ? `max="${x.max}"` : ''} ${x.step != null ? `step="${x.step}"` : ''} ${req}>`;
    }
    return `<label class="lbl" for="${id}" style="${style}">${esc(x.label)}${input}${hint}</label>`;
  }).join('');
  dlg.innerHTML = `<form method="dialog" novalidate>
    <div class="between"><h2 style="font-size:22px">${esc(title)}</h2><button type="button" class="btn btn-ghost btn-icon" data-x aria-label="Đóng">✕</button></div>
    ${extra}
    <div class="fields">${f}</div>
    <p class="err" style="margin:0;color:#B3261E;font-weight:600" hidden></p>
    <div class="hstack" style="justify-content:flex-end">
      ${danger ? `<button type="button" class="btn btn-danger" data-del style="margin-right:auto">${esc(danger.label)}</button>` : ''}
      <button type="button" class="btn btn-ghost" data-x>Huỷ</button>
      <button type="submit" class="btn btn-primary">${esc(submit)}</button>
    </div></form>`;
  const form = dlg.querySelector('form');
  dlg.querySelectorAll('[data-x]').forEach(b => b.onclick = () => dlg.close());
  if (danger) dlg.querySelector('[data-del]').onclick = async () => {
    if (!confirm(danger.confirm || 'Xoá mục này?')) return;
    await danger.onClick(); dlg.close();
  };
  form.onsubmit = async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = {};
    fields.forEach(x => {
      if (x.type === 'multi') data[x.name] = [...form.querySelectorAll(`[name="${x.name}"]:checked`)].map(i => i.value);
      else if (x.type === 'checkbox') data[x.name] = form.elements[x.name].checked;
      else if (x.type === 'number') data[x.name] = form.elements[x.name].value === '' ? null : Number(form.elements[x.name].value);
      else data[x.name] = form.elements[x.name].value.trim();
    });
    const err = form.querySelector('.err');
    try {
      const r = await onSubmit(data);
      if (r === false) return;
      dlg.close();
    } catch (ex) { console.error(ex); err.hidden = false; err.textContent = ex.message || 'Có lỗi, vui lòng thử lại.'; }
  };
  dlg.showModal();
  const first = form.querySelector('input:not([type=checkbox]),select,textarea');
  if (first) first.focus();
}

export function downloadText(filename, text, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + text], { type: mime });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export const csv = rows => rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');

let h2c;
export async function exportImage(el, filename) {
  if (!h2c) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = res; s.onerror = () => rej(new Error('Không tải được thư viện xuất ảnh'));
      document.head.appendChild(s);
    });
    h2c = window.html2canvas;
  }
  const canvas = await h2c(el, { scale: 2, backgroundColor: null, useCORS: true });
  const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = filename; a.click();
}
