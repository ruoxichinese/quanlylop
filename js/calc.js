// Phép tính dùng chung
import { ymd, parseYmd, hours, hskLevel, hskScale } from './ui.js';

// Sinh buổi dạy từ lịch cố định của lớp trong khoảng [from, to]
export function sessionsBetween(classes, from, to) {
  const out = []; const d = parseYmd(from); const end = parseYmd(to);
  while (d <= end) {
    const dow = d.getDay(); const date = ymd(d);
    classes.forEach(c => (c.schedule || []).forEach(s => {
      if (Number(s.dow) === dow) out.push({ date, classId: c.id, cls: c, start: s.start, end: s.end, hours: hours(s.start, s.end) });
    }));
    d.setDate(d.getDate() + 1);
  }
  return out.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

// Số buổi đã dùng = số đã có khi bắt đầu gói + các buổi nhật ký có "trừ buổi" từ ngày bắt đầu gói
export const pkgUsed = (s, logs = []) => (Number(s.pkgUsed) || 0)
  + logs.filter(l => l.studentId === s.id && l.counted && (!s.pkgStart || l.date >= s.pkgStart)).length;
export const pkgLeft = (s, logs = []) => Math.max(0, (Number(s.pkgTotal) || 0) - pkgUsed(s, logs));

export function testTotal(t) {
  return ['listening', 'reading', 'writing'].reduce((a, k) => a + (Number(t[k]) || 0), 0);
}
export function testMax(t, cls) {
  const sc = hskScale(hskLevel(cls));
  if (t.kind === 'mock' && sc) return sc.max;
  return Number(t.max) || 100;
}
export function testLabel(t, cls) {
  if (t.kind === 'mock') return `${testTotal(t)}/${testMax(t, cls)}`;
  if (t.kind === 'speaking') return `Nói ${t.speaking ?? '–'}/100`;
  return `${t.score ?? '–'}/${t.max || 10}`;
}
export function lastTest(studentId, tests) {
  return tests.filter(t => t.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

// Trạng thái gói của học viên
export function pkgStatus(s, logs) {
  if (s.status === 'unpaid') return ['Chưa đóng gói mới', 'bad'];
  if (pkgLeft(s, logs) <= 4) return ['Sắp hết gói', 'warn'];
  return ['Đang học', 'ok'];
}

// Ngày dự kiến hết gói: đếm các buổi tới theo lịch lớp
export function pkgEndDate(s, cls, logs) {
  let left = pkgLeft(s, logs); if (!cls || !left) return '';
  const d = new Date(); let guard = 0;
  while (left > 0 && guard++ < 400) {
    d.setDate(d.getDate() + 1);
    left -= (cls.schedule || []).filter(x => Number(x.dow) === d.getDay()).length;
  }
  return ymd(d);
}

export const byId = arr => Object.fromEntries(arr.map(x => [x.id, x]));
export const daysUntil = s => s ? Math.ceil((parseYmd(s) - new Date(new Date().toDateString())) / 864e5) : null;
