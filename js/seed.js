// Dữ liệu mẫu cho chế độ demo (ngày được tính lùi từ hôm nay)
import { ymd, monthKey } from './ui.js';

const HSK = 'Nghe · Nói · Đọc · Viết';

function lastDates(dows, n, from = new Date()) {
  const out = []; const d = new Date(from); d.setHours(0, 0, 0, 0);
  while (out.length < n) { d.setDate(d.getDate() - 1); if (dows.includes(d.getDay())) out.unshift(ymd(d)); }
  return out;
}
function plusDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }

export function buildSeed() {
  const classes = {
    c1: { name: 'HSK 1', color: 'green', type: 'HSK', level: 'HSK 1', mode: 'Offline', schedule: [{ dow: 4, start: '17:00', end: '19:00' }, { dow: 6, start: '09:30', end: '11:30' }], book: 'HSK 标准教程 1', unit: 'Bài', totalUnits: 15, doneUnits: 13, pkgSessions: 24, fee: 200000, rubric: HSK, goal: 'Thi HSK 1', examDate: plusDays(115), assistants: [] },
    c2: { name: 'HSK 2', color: 'pink', type: 'HSK', level: 'HSK 2', mode: 'Offline', schedule: [{ dow: 3, start: '17:00', end: '19:00' }, { dow: 0, start: '07:30', end: '09:30' }], book: 'HSK 标准教程 2', unit: 'Bài', totalUnits: 15, doneUnits: 11, pkgSessions: 24, fee: 200000, rubric: HSK, goal: 'Thi HSK 2', examDate: plusDays(52), assistants: ['minhanh.tg@gmail.com'] },
    c3: { name: 'HSK 3', color: 'lavender', type: 'HSK', level: 'HSK 3', mode: 'Offline', schedule: [{ dow: 2, start: '17:00', end: '19:00' }, { dow: 5, start: '17:00', end: '19:00' }], book: 'HSK 标准教程 3', unit: 'Bài', totalUnits: 20, doneUnits: 9, pkgSessions: 30, fee: 250000, rubric: HSK, goal: 'Thi HSK 3', examDate: plusDays(115), assistants: [] },
    c4: { name: 'HSK 4', color: 'blue', type: 'HSK', level: 'HSK 4', mode: 'Offline', schedule: [{ dow: 1, start: '17:00', end: '19:00' }, { dow: 5, start: '19:00', end: '21:00' }], book: 'HSK 标准教程 4', unit: 'Bài', totalUnits: 20, doneUnits: 18, pkgSessions: 30, fee: 250000, rubric: HSK, goal: 'Thi HSK 4', examDate: plusDays(24), assistants: ['quocbao.tg@gmail.com'] },
    c5: { name: 'Công sở', color: 'yellow', type: 'Tiếng Trung công sở', level: '', mode: 'Online', schedule: [{ dow: 2, start: '19:00', end: '21:00' }, { dow: 4, start: '19:00', end: '21:00' }, { dow: 6, start: '07:30', end: '09:30' }], book: 'Tài liệu theo chủ đề', unit: 'Chủ đề', totalUnits: 10, doneUnits: 6, pkgSessions: 20, fee: 300000, rubric: 'Email · Họp · Điện thoại · Thuyết trình', goal: 'Tự tin giao tiếp nơi làm việc', examDate: '', assistants: [] },
    c6: { name: 'Speaking', color: 'brown', type: 'Speaking', level: '', mode: 'Online', schedule: [{ dow: 1, start: '19:00', end: '21:00' }, { dow: 3, start: '19:00', end: '21:00' }, { dow: 0, start: '09:30', end: '11:30' }], book: 'Chủ đề hội thoại', unit: 'Chủ đề', totalUnits: 12, doneUnits: 8, pkgSessions: 20, fee: 250000, rubric: 'Phát âm · Trôi chảy · Phản xạ · Từ vựng', goal: 'Nói 3 phút liền mạch', examDate: '', assistants: ['minhanh.tg@gmail.com'] }
  };

  const S = [
    ['s1', 'An Khuê', 'c1', 'PH · Chị Hương', '2025-09', 24, 20, 'ok', 160, 140, 120],
    ['s2', 'Minh Châu', 'c1', 'PH · Anh Tuấn', '2025-09', 24, 15, 'ok', 160, 130, 110],
    ['s3', 'Bảo Ngọc', 'c1', 'PH · Chị Lan', '2026-11', 24, 4, 'unpaid', 150, 40, 30],
    ['s4', 'Gia Huy', 'c2', 'PH · Chị Thu', '2024-08', 24, 20, 'ok', 170, 280, 230],
    ['s5', 'Thảo Vy', 'c2', 'PH · Anh Nam', '2024-08', 24, 22, 'unpaid', 160, 265, 200],
    ['s6', 'Đức Minh', 'c2', 'PH · Chị Hà', '2026-01', 24, 12, 'ok', 160, 240, 190],
    ['s7', 'Hà My', 'c2', 'PH · Chị Mai', '2026-03', 24, 10, 'ok', 170, 250, 210],
    ['s8', 'Khánh Linh', 'c3', 'Tự liên hệ', '2025-09', 30, 27, 'ok', 240, 520, 400],
    ['s9', 'Quang Huy', 'c3', 'Tự liên hệ', '2026-02', 30, 14, 'ok', 220, 470, 350],
    ['s10', 'Tuấn Kiệt', 'c4', 'Tự liên hệ', '2025-09', 30, 18, 'ok', 240, 1046, 720],
    ['s11', 'Ngọc Hân', 'c4', 'Tự liên hệ', '2026-01', 30, 15, 'ok', 230, 982, 680],
    ['s12', 'Bảo Long', 'c4', 'Tự liên hệ', '2025-10', 30, 21, 'ok', 240, 1104, 760],
    ['s13', 'Thu Trang', 'c4', 'Tự liên hệ', '2026-03', 30, 9, 'ok', 220, 915, 600],
    ['s14', 'Hoàng Nam', 'c5', 'Tự liên hệ', '2026-06', 20, 9, 'ok', null, 0, 0],
    ['s15', 'Mai Phương', 'c5', 'Tự liên hệ', '2026-08', 20, 13, 'ok', null, 0, 0],
    ['s16', 'Phương Anh', 'c6', 'Tự liên hệ', '2025-09', 20, 19, 'ok', null, 0, 0],
    ['s17', 'Đức Anh', 'c6', 'Tự liên hệ', '2026-04', 20, 11, 'ok', null, 0, 0],
    ['s18', 'Lan Hương', 'c6', 'Tự liên hệ', '2026-05', 20, 8, 'ok', null, 0, 0],
    ['s19', 'Thanh Tùng', 'c6', 'Tự liên hệ', '2026-06', 20, 6, 'ok', null, 0, 0],
    ['s20', 'Kim Ngân', 'c6', 'Tự liên hệ', '2026-07', 20, 5, 'ok', null, 0, 0],
    ['s21', 'Minh Quân', 'c6', 'Tự liên hệ', '2026-10', 20, 2, 'ok', null, 0, 0]
  ];
  const students = {}; const studentPrivate = {}; const vocab = {};
  S.forEach(([id, name, classId, contact, since, pkgTotal, pkgUsed, status, targetScore, wordsLearned, hanzi], i) => {
    students[id] = { name, classId, since, pkgTotal, pkgUsed, pkgStart: ymd(new Date()), status, targetScore, goal: classes[classId].goal };
    if (wordsLearned) vocab[id] = { studentId: id, classId, words: wordsLearned, hanzi };
    studentPrivate[id] = { contact, phone: '09•• ••• ' + String(100 + i * 37).slice(-3), note: '' };
  });

  const logs = {};
  const c1d = lastDates([4, 6], 6);
  const L = [
    ['BÀI 9 · 你儿子在哪儿工作', 'Từ mới: 小猫、在、那儿、哪儿、医院、医生\nNgữ pháp: câu hỏi với 哪儿, giới từ 在\nBTVN: viết 2 dòng mỗi chữ mới', 70, 'Sửa thanh 3', false, 'Tốt', '+ Nhớ nhanh từ chỉ nơi chốn\n+ Thanh 3 trong 哪儿 còn đọc thành thanh 2'],
    ['BÀI 10 · 我能坐这儿吗', 'Từ mới: 能、坐、这儿、没有、桌子\nNgữ pháp: động từ năng nguyện 能, 有 / 没有\nBTVN: hội thoại 4 câu xin phép', 80, 'Tốt', true, 'Tốt', '+ Đặt câu hỏi xin phép đúng ngữ cảnh\n+ Cần luyện thêm câu phủ định 没有'],
    ['BÀI 11 · 现在几点', 'Từ mới: 现在、点、分、中午、吃饭、时候\nNgữ pháp: cách nói giờ, 时候\nBTVN: viết thời gian biểu một ngày', 90, 'Tốt', true, 'Tốt', '+ Nói giờ chính xác, phản xạ nhanh\n+ Viết chữ 现 còn sai thứ tự nét'],
    ['BÀI 12 · 明天天气怎么样', 'Từ mới: 天气、怎么样、太、热、冷、下雨\nNgữ pháp: 太…了, câu hỏi 怎么样', 100, 'Tốt', true, 'Tốt', '+ Dùng 太…了 tự nhiên\n+ Hoàn thành BTVN đầy đủ, chữ viết đẹp hơn'],
    ['BÀI 13 · 他在学做中国菜呢', 'Từ mới: 喂、也、学习、上午、睡觉、电视\nNgữ pháp: 在…呢 diễn tả hành động đang xảy ra\nBTVN: nghe bài khoá 3 lần, ghi âm đọc lại', 60, 'Sửa âm zh/ch', false, 'Khá', '+ Hiểu cấu trúc 在…呢\n+ Âm zh / ch chưa phân biệt rõ, cần luyện thêm'],
    ['ÔN TẬP BÀI 9–13 · KIỂM TRA TỪ VỰNG', '40 từ · nghe chọn tranh · ghép câu', 90, 'Tốt', true, 'Tốt', '+ Đúng 36/40 từ\n+ Phần nghe làm tốt, phần ghép câu còn nhầm trật tự từ']
  ];
  c1d.forEach((date, i) => {
    const sch = classes.c1.schedule.find(s => s.dow === new Date(date + 'T00:00').getDay());
    const [lesson, content, hw, pron, pronOk, attitude, comment] = L[i];
    logs['l' + i] = { studentId: 's1', classId: 'c1', date, start: sch.start, end: sch.end, lesson, content, hw, pron, pronOk, attitude, comment, counted: true };
  });

  const tests = {};
  const c4d = lastDates([1], 6);
  [[64, 68, 54, 'Chưa quen dạng điền từ'], [70, 72, 56, ''], [72, 75, 58, 'Nghe phần hội thoại dài còn yếu'], [75, 77, 60, ''], [78, 80, 63, 'Đọc hiểu tiến bộ rõ'], [80, 82, 66, 'Viết câu còn sai trật tự trạng ngữ']]
    .forEach(([l, r, w, note], i) => { tests['t' + i] = { studentId: 's10', classId: 'c4', date: c4d[i], kind: 'mock', name: 'Thi thử HSK 4 · Đề ' + (i + 1), listening: l, reading: r, writing: w, speaking: null, note }; });
  tests.t10 = { studentId: 's10', classId: 'c4', date: c4d[5], kind: 'speaking', name: 'Đánh giá nói trong lớp', speaking: 72, note: 'Trả lời đủ ý, tốc độ còn chậm' };
  const c2d = lastDates([0], 2);
  tests.t20 = { studentId: 's4', classId: 'c2', date: c2d[0], kind: 'mock', name: 'Thi thử HSK 2 · Đề 3', listening: 80, reading: 78, note: '' };
  tests.t21 = { studentId: 's4', classId: 'c2', date: c2d[1], kind: 'mock', name: 'Thi thử HSK 2 · Đề 4', listening: 86, reading: 82, note: 'Đọc hiểu tiến bộ' };
  tests.t30 = { studentId: 's8', classId: 'c3', date: lastDates([5], 1)[0], kind: 'mock', name: 'Thi thử HSK 3 · Đề 2', listening: 82, reading: 80, writing: 74, note: '' };

  const words = {};
  [['估计', 'gūjì', 'ước tính, đoán', 5, 'Nhầm với 计划 khi điền từ', true], ['尽管', 'jǐnguǎn', 'mặc dù', 4, 'Đặt sai vị trí, thiếu 但是 / 还是 ở vế sau', true], ['准确', 'zhǔnquè', 'chính xác', 4, 'Nhầm với 正确', true], ['提醒', 'tíxǐng', 'nhắc nhở', 3, 'Đọc sai thanh của 醒', true], ['适应', 'shìyìng', 'thích ứng', 3, 'Viết thiếu nét chữ 适', false], ['弄', 'nòng', 'làm, khiến', 2, 'Dùng lẫn với 做', false]]
    .forEach(([zh, py, vi, wrong, err, review], i) => { words['w' + i] = { studentId: 's10', classId: 'c4', zh, py, vi, wrong, err, review }; });

  // Doanh thu 12 tháng gần nhất
  const payments = {}; let k = 0;
  const amounts = [18.4, 20.1, 15.2, 22.6, 24.0, 21.3, 12.5, 14.8, 30.8, 34.7, 36.2, 39.0];
  const sids = Object.keys(students);
  amounts.forEach((tr, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (11 - i));
    let left = Math.round(tr * 1e6);
    let j = 0;
    while (left > 0) {
      const sid = sids[(i * 5 + j * 3) % sids.length]; const st = students[sid]; const c = classes[st.classId];
      const amt = Math.min(left, c.fee * c.pkgSessions);
      d.setDate(Math.min(28, 2 + j * 3));
      payments['p' + (k++)] = { studentId: sid, classId: st.classId, amount: amt, sessions: Math.round(amt / c.fee), date: ymd(d) };
      left -= amt; j++;
    }
  });

  const users = {
    'minhanh.tg@gmail.com': { role: 'assistant', status: 'active', name: 'Minh Anh', classIds: ['c2', 'c6'], invitedAt: plusDays(-90) },
    'quocbao.tg@gmail.com': { role: 'assistant', status: 'active', name: 'Quốc Bảo', classIds: ['c4'], invitedAt: plusDays(-60) },
    'lanchi.tg@gmail.com': { role: 'assistant', status: 'invited', name: '', classIds: ['c1'], invitedAt: plusDays(-1) }
  };

  const settings = {
    public: { brand: 'LỚP HỌC', teacherName: '', subject: 'Tiếng Trung', theme: 'forest', hskStandard: '2.0', defaultFee: 200000, defaultDuration: 2 },
    private: { phone: '', bank: '', account: '', holder: '', qr: '' }
  };
  return { classes, students, studentPrivate, vocab, logs, tests, words, payments, users, settings, _month: monthKey(new Date()) };
}
