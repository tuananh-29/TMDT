require('dotenv').config();
const express = require('express'), cors = require('cors'), helmet = require('helmet'), rateLimit = require('express-rate-limit'), mongoose = require('mongoose'), bcrypt = require('bcryptjs'), path = require('path');
const M = require('./models'), app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: (process.env.CLIENT_URL || '*').split(',') }));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, '../client/public/assets')));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/', (_, r) => r.send('Chợ Đồ Cũ API đang hoạt động!'));
app.use('/api', require('./routes'));

app.use((e, req, res, next) => {
  console.error(e);
  const s = e.name === 'CastError' ? 400 : e.status || 500;
  res.status(s).json({ message: s === 500 ? 'Lỗi máy chủ: ' + e.message : e.message });
});

async function seedDefaultData() {
  // 1. Tạo danh mục mặc định nếu chưa có
  if (await M.Category.countDocuments() === 0) {
    await M.Category.insertMany(M.DEFAULT_CATEGORIES.map(name => ({ name })));
    console.log('✅ Đã khởi tạo danh mục mặc định');
  }

  // 2. Tạo tài khoản Admin & User mẫu nếu chưa có
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  let admin = await M.User.findOne({ role: 'admin' });
  if (!admin) {
    admin = await M.User.create({
      username: 'admin',
      email: 'admin@chodocu.vn',
      name: 'Quản Trị Viên',
      phone: '0901234567',
      address: 'TP. Hồ Chí Minh',
      passwordHash: await bcrypt.hash(adminPass, 10),
      role: 'admin'
    });
    console.log(`✅ Đã tạo tài khoản Admin: username="admin" | password="${adminPass}"`);
  }

  let seller = await M.User.findOne({ username: 'nguoiban' });
  if (!seller) {
    seller = await M.User.create({
      username: 'nguoiban',
      email: 'nguoiban@gmail.com',
      name: 'Nguyễn Văn Bán',
      phone: '0987654321',
      address: 'Tân Bình, TP. Hồ Chí Minh',
      passwordHash: await bcrypt.hash('123456', 10),
      role: 'user'
    });
  }

  let buyer = await M.User.findOne({ username: 'nguoimua' });
  if (!buyer) {
    buyer = await M.User.create({
      username: 'nguoimua',
      email: 'nguoimua@gmail.com',
      name: 'Trần Thị Mua',
      phone: '0912345678',
      address: 'Quận 1, TP. Hồ Chí Minh',
      passwordHash: await bcrypt.hash('123456', 10),
      role: 'user'
    });
  }

  // 3. Tạo sản phẩm mẫu nếu DB trống
  if (await M.Product.countDocuments() === 0) {
    const port = process.env.PORT || 5000;
    const host = `http://localhost:${port}`;
    await M.Product.insertMany([
      {
        title: 'Bộ Boardgame Catan Bản Quốc Tế (Còn đủ phụ kiện)',
        category: 'Sách & học tập',
        price: 450000,
        condition: 'Như mới',
        percentNew: 95,
        location: 'TP. Hồ Chí Minh',
        phone: '0987654321',
        description: 'Bộ Catan mới chơi 2 lần, thẻ bài đã bọc sleeve kỹ, đầy đủ quân gỗ và hướng dẫn.',
        images: [`${host}/uploads/catan_1.jpg`],
        seller: seller._id,
        status: 'approved',
        vip: true,
        vipUntil: new Date(Date.now() + 7 * 864e5)
      },
      {
        title: 'Xe đạp thể thao khung hợp kim nhôm siêu nhẹ',
        category: 'Xe cộ',
        price: 2800000,
        condition: 'Đã dùng',
        percentNew: 85,
        location: 'TP. Hồ Chí Minh',
        phone: '0987654321',
        description: 'Xe đạp chạy êm, bộ đề Shimano 21 tốc độ hoạt động mượt mà, phanh đĩa an toàn.',
        images: [`${host}/uploads/xd_1.jpg`, `${host}/uploads/xd_2.jpg`],
        seller: seller._id,
        status: 'approved'
      },
      {
        title: 'Áo Hoodie Nỉ Bông Form Rộng Unisex',
        category: 'Thời trang',
        price: 180000,
        condition: 'Như mới',
        percentNew: 90,
        location: 'Hà Nội',
        phone: '0987654321',
        description: 'Áo hoodie chất nỉ dày dặn, không xù lông, mặc ấm và lên form cực chuẩn.',
        images: [`${host}/uploads/hd_1.jpg`],
        seller: seller._id,
        status: 'pending'
      }
    ]);
    console.log('✅ Đã tạo sản phẩm mẫu (bao gồm cả tin đang bán & tin chờ Admin duyệt)');
  }
}

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chodocu';
mongoose.connect(MONGO_URI).then(async () => {
  console.log('✅ Đã kết nối MongoDB:', MONGO_URI);
  await seedDefaultData();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`🚀 API đang chạy tại http://localhost:${port}`));
}).catch(e => {
  console.error('❌ Lỗi kết nối MongoDB:', e.message);
  process.exit(1);
});
