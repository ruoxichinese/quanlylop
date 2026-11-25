# Lớp học tiếng Trung

Website quản lý lớp HSK, Tiếng Trung công sở và Speaking:

- lịch dạy tự sinh từ lịch cố định của lớp;
- nhật ký từng buổi (bài học, BTVN, phát âm, nhận xét);
- từ vựng và chữ Hán theo chuẩn HSK 2.0 hoặc 3.0;
- điểm thi thử theo thang HSK thật và điểm từng kỹ năng;
- học phí theo gói buổi, có phiếu gia hạn xuất ảnh hoặc PDF;
- đăng nhập Google và phân quyền Giáo viên / Trợ giảng;
- 5 giao diện kính trong suốt.

Trang là HTML + JavaScript thuần, không cần build. Giao diện đặt trên **GitHub Pages**, còn đăng nhập và dữ liệu nằm ở **Firebase** (gói miễn phí Spark là đủ).

## Chạy thử trên máy (chế độ demo)

Khi `js/config.js` chưa có cấu hình Firebase, trang tự chạy **chế độ demo** với dữ liệu mẫu lưu trong trình duyệt. Mở Terminal trong thư mục này và chạy:

```bash
python3 -m http.server 8080
```

Rồi mở http://localhost:8080 và chọn "Vào bản demo · Giáo viên" hoặc "· Trợ giảng".

## Bật đăng nhập Google (Firebase)

1. Vào https://console.firebase.google.com, bấm **Create a project** (đặt tên tuỳ ý, có thể tắt Google Analytics).
2. **Build › Authentication › Get started › Sign-in method › Google › Enable**, chọn email hỗ trợ rồi **Save**.
3. **Build › Firestore Database › Create database**: chọn vị trí `asia-southeast1` (Singapore), chế độ **production**.
4. Trong Firestore, mở tab **Rules**:
   - Mở file `firestore.rules` trong thư mục này.
   - Thay `EMAIL_GIAO_VIEN@gmail.com` bằng email Google của bạn, viết thường.
   - Dán toàn bộ nội dung vào ô Rules rồi bấm **Publish**.
5. **Project settings (bánh răng) › General › Your apps › Web (</>)**:
   - Đặt tên app rồi bấm **Register app**.
   - Copy các giá trị trong `firebaseConfig` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) dán vào `js/config.js`.
   - Điền `OWNER_EMAIL` trong `js/config.js` bằng đúng email Google ở bước 4.
6. **Authentication › Settings › Authorized domains › Add domain**: thêm tên miền GitHub Pages của bạn, dạng `tentaikhoan.github.io`.

`firebaseConfig` không phải mật khẩu. Firebase thiết kế để nó nằm công khai trong trang web; dữ liệu được bảo vệ bằng `firestore.rules`.

## Đưa lên GitHub Pages

1. Tạo repository mới trên https://github.com/new, ví dụ tên `lop-tieng-trung`, để **Public** (GitHub Pages miễn phí cần repo public).
2. Đẩy code lên. Thay `TEN_TAI_KHOAN` bằng tên tài khoản GitHub của bạn:

   ```bash
   cd ~/Downloads/lop-tieng-trung
   git init -b main
   git add .
   git commit -m "Website quản lý lớp học"
   git remote add origin https://github.com/TEN_TAI_KHOAN/lop-tieng-trung.git
   git push -u origin main
   ```
3. Trên GitHub: **Settings › Pages › Build and deployment › Source: Deploy from a branch**, chọn `main` và `/ (root)`, rồi bấm **Save**.
4. Sau 1–2 phút, trang có ở `https://TEN_TAI_KHOAN.github.io/lop-tieng-trung/`.

Dữ liệu học viên **không** nằm trong repo. Nó ở Firestore và chỉ người được cấp quyền mới đọc được.

## Phân quyền

| Chức năng | Giáo viên | Trợ giảng |
|---|---|---|
| Lịch dạy, lớp, học viên | Toàn bộ | Chỉ lớp được giao |
| Nhật ký, điểm, từ vựng | Đọc và sửa | Đọc và sửa ở lớp được giao |
| Liên hệ, số điện thoại | Có | Không |
| Học phí, gói học, doanh thu | Có | Không |
| Tạo hoặc sửa lớp, học viên; mời trợ giảng; cài đặt | Có | Không |

Cách mời trợ giảng:
1. Vào **Trợ giảng**, nhập email Google của trợ giảng và chọn lớp.
2. Nhắn trợ giảng mở trang và bấm "Tiếp tục với Google" bằng đúng email đó.
3. Lần đăng nhập đầu tiên, lời mời tự chuyển sang "Đang hoạt động".

## Cấu trúc

```
index.html          khung trang
css/app.css         giao diện, 5 theme
js/config.js        cấu hình Firebase + email giáo viên
js/store.js         lớp dữ liệu (demo / Firestore), đăng nhập, vai trò
js/seed.js          dữ liệu mẫu cho chế độ demo
js/calc.js          lịch dạy, gói học, điểm
js/pages/*.js       từng màn hình
firestore.rules     quy tắc bảo mật dán vào Firebase
```

## Cách tính

- **Buổi đã dùng trong gói** = số đã học khi bắt đầu gói + các buổi trong Nhật ký có đánh dấu "Trừ 1 buổi trong gói" từ ngày bắt đầu gói.
- **Ghi nhận đã thu**: số buổi còn lại của gói cũ được cộng dồn vào gói mới.
- **Thang thi thử**: HSK 1–2 gồm Nghe + Đọc, tổng 200, đỗ từ 120. HSK 3 trở lên gồm Nghe + Đọc + Viết, tổng 300, đỗ từ 180. Kỹ năng Nói được chấm riêng trong lớp (0–100).
