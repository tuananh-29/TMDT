# ♻️ Chợ Đồ Cũ – Fullstack (Node.js + Express + MongoDB + React Vite + Admin Panel)

Bản gộp hoàn chỉnh từ cả 3 gói mã nguồn (`secondhand`, `cho-do-cu-backend`, `cho-do-cu-fullstack`) với đầy đủ tính năng cho **Người mua**, **Người bán** và **Quản trị viên (Admin)**, kèm theo ảnh mẫu và tự động khởi tạo dữ liệu (Auto-Seed) ngay lần chạy đầu tiên.

---

## 🚀 Hướng dẫn cài đặt & chạy nhanh

### Yêu cầu
- Đã cài **Node.js** (v18 trở lên)
- Đã bật **MongoDB** ở máy (`mongodb://127.0.0.1:27017`) hoặc điền chuỗi kết nối MongoDB Atlas vào `server/.env`.

### Bước 1: Chạy Backend (`server`)
Mở Terminal 1:
```bash
cd server
npm install
npm run dev
```
- Server sẽ chạy tại `http://localhost:5000`.
- Lần đầu khởi động, hệ thống tự động tạo sẵn **Danh mục**, **3 Sản phẩm mẫu** (kèm ảnh thật trong `server/uploads`) và **3 Tài khoản mẫu**:
  - **Admin:** Tên đăng nhập `admin` / Mật khẩu `admin123`
  - **Người bán:** Tên đăng nhập `nguoiban` / Mật khẩu `123456`
  - **Người mua:** Tên đăng nhập `nguoimua` / Mật khẩu `123456`

### Bước 2: Chạy Frontend (`client`)
Mở Terminal 2:
```bash
cd client
npm install
npm run dev
```
- Mở trình duyệt tại: `http://localhost:5173`

---

## 🛡️ Tính năng của Quản trị viên (Admin)
Đăng nhập bằng `admin` / `admin123` rồi bấm nút **🛡️ Quản trị Admin** trên thanh công cụ:
1. **📊 Thống kê:** Xem tổng số người dùng, tổng tin đăng, tin chờ duyệt, tin đang bán, tổng đơn hàng, đơn hoàn tất, doanh số hoàn tất và số báo cáo vi phạm.
2. **⏳ Duyệt tin:** Duyệt nhanh hoặc Từ chối kèm nhập **Lý do từ chối** (người bán sẽ thấy lý do trong mục *Tin của tôi*).
3. **📦 Tất cả tin:** Quản lý toàn bộ tin trên sàn, bật/tắt **⭐ VIP**, đổi trạng thái hoặc xóa tin vi phạm.
4. **🗂️ Danh mục:** Thêm mới, đổi tên hoặc xóa danh mục (tự động chặn xóa nếu danh mục đang có sản phẩm).
5. **🧾 Đơn hàng:** Chỉ theo dõi mọi đơn hàng trên sàn (admin không đổi trạng thái; người bán xác nhận / giao hàng / hoàn tất trong *Kênh người bán → Đơn khách đặt mua*).
6. **🚩 Báo cáo:** Xử lý báo cáo vi phạm từ người dùng (Gỡ tin hoặc Bỏ qua).
7. **👥 Người dùng:** Khóa / Mở khóa tài khoản vi phạm, cấp hoặc thu hồi quyền Admin.
8. **📜 Nhật ký:** Xem lịch sử mọi thao tác trên hệ thống.


---

## 🎨 Giao diện mới (theo market-pulse)

Client đã được thiết kế lại theo giao diện của `market-pulse`: thanh thông báo, header có ô tìm kiếm + menu phụ, hero, danh mục, thẻ sản phẩm, trang mua sắm có bộ lọc, trang chi tiết, trang quản lý tin, footer và thanh điều hướng dưới cho mobile.

- **Backend (`server/`) và app mobile giữ nguyên**, mọi API cũ vẫn dùng như trước (đăng nhập, giỏ hàng, đơn hàng, đánh giá, báo cáo, Admin…).
- CSS nằm ở `client/src/style.css` (CSS thuần, không cần Tailwind).
- Icon dùng `lucide-react` → chạy lại `npm install` trong thư mục `client`.
- Mục **Yêu thích** (trái tim) lưu ở trình duyệt (localStorage), chưa có API phía server.
