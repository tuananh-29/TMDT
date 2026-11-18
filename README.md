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
- Lần đầu khởi động, hệ thống tự động tạo sẵn **Danh mục**, **30 Sản phẩm mẫu** (kèm ảnh thật trong `server/uploads`) và **3 Tài khoản mẫu**:
  - **Tài khoản duy nhất:** Tên đăng nhập `admin` / Mật khẩu `admin123` (vừa mua, bán, vừa quản trị). Đăng ký tài khoản mới đã tắt (đặt `ALLOW_REGISTER=true` trong `server/.env` nếu muốn mở lại).
  - Hai tài khoản mẫu cũ `nguoiban`, `nguoimua` sẽ tự bị xóa khi khởi động server.

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

---

## 🛡️ Trang Admin mới (Admin Console)

Chạy `npm run dev` trong `client`, mở **http://localhost:5173/admin.html** và đăng nhập `admin` / `admin123`.
- Giao diện: sidebar tối, header tìm kiếm (⌘K), dashboard KPI + biểu đồ doanh thu 30 ngày.
- Mục có dữ liệu thật: Kiểm duyệt sản phẩm, Đơn hàng, Đánh giá, Nhà bán, Người dùng, Tài chính (GMV), Khiếu nại (báo cáo), Tồn kho, Danh mục, Nhật ký.
- Phí sàn: tỷ lệ hoa hồng chỉ để ước tính (lưu ở trình duyệt). Voucher: chưa có backend.
- Server thêm `GET/DELETE /api/admin/reviews`.

### Người mua = người bán
- Không còn "Kênh người bán" / "Quản trị" trên thanh menu. Bấm **ảnh đại diện** ở góc phải header để mở menu: Hồ sơ, Đơn tôi mua, Đơn khách đặt mua, Tin đăng của tôi, Trang quản trị (chỉ admin), Đăng xuất. Chưa đăng nhập thì hiện Đăng nhập / Đăng ký.
- Trang Hồ sơ (`#mine/profile|products|buy|sell`) gom: thông tin cá nhân, tin đăng, đơn mua, đơn bán.
- Nút **Đăng bán** ở header cho bất kỳ người dùng nào.





---

## 🎨 Bản nâng cấp
- Chỉ đổi màu xanh lá thành **#57CC99**, các màu khác (nền kem, san hô, vàng...) giữ nguyên; `client/src/style.css` được viết lại.
- Chữ dùng font Be Vietnam Pro, bỏ các chỗ xuống dòng cứng nên tiêu đề không còn bị tách dòng xấu.
- Dữ liệu mẫu: 30 tin / 10 danh mục (thêm *Thể thao*, *Mẹ & bé*), ảnh SVG tự sinh vào `server/uploads`.
- Muốn nạp lại dữ liệu mẫu: xóa database `chodocu` rồi chạy lại server.
