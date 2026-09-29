# webapp
Web bình chọn: admin tạo cuộc bình chọn (3–4 ứng viên) và phát hành link, người dùng vote, dữ liệu lưu vào Google Sheet.

## Cài đặt

1. Mở Google Sheet → **Extensions → Apps Script**, dán nội dung [apps-script/Code.gs](apps-script/Code.gs).
2. **Project Settings → Script Properties** → thêm `ADMIN_KEY` = mật khẩu admin của bạn.
3. **Deploy → New deployment → Web app**: *Execute as*: Me, *Who has access*: Anyone → Deploy, cấp quyền, copy URL Web App.
4. Dán URL vào `SCRIPT_URL` trong [index.html](index.html).
5. Host `index.html` (GitHub Pages, Netlify, ...) hoặc chạy thử: `python3 -m http.server 8000`.

## Sử dụng

- Admin: mở `index.html`, nhập mã admin, tiêu đề, ứng viên → **Phát hành link**.
- Người dùng: mở link `index.html?poll=<id>` để bình chọn và xem kết quả.
- Sheet tự tạo 2 tab: `Polls` (cuộc bình chọn) và `Votes` (phiếu bầu).
