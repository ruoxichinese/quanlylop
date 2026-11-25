// =====================================================================
// CẤU HÌNH — sửa file này sau khi tạo dự án Firebase (xem README.md)
// =====================================================================

// 1) Dán cấu hình web app từ Firebase Console › Project settings › Your apps.
//    Để trống (apiKey rỗng) thì trang chạy ở CHẾ ĐỘ DEMO: dữ liệu mẫu lưu trong
//    trình duyệt, không cần đăng nhập Google.
export const firebaseConfig = {
  apiKey: 'AIzaSyD26KvFuBFsEOYHDATYudxchDOMole8i48',
  authDomain: 'lop-tieng-trung.firebaseapp.com',
  projectId: 'lop-tieng-trung',
  storageBucket: 'lop-tieng-trung.firebasestorage.app',
  messagingSenderId: '891942486515',
  appId: '1:891942486515:web:c19f90d18749726a31d286'
};

// 2) Email Google của giáo viên chủ lớp (toàn quyền). Viết thường.
//    Phải trùng với email trong firestore.rules.
export const OWNER_EMAIL = 'tranphuongtrangclc@gmail.com';

export const DEMO = !firebaseConfig.apiKey;
