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
  // 1. Danh mục: bổ sung các danh mục mặc định còn thiếu
  await M.Category.bulkWrite(M.DEFAULT_CATEGORIES.map(name => ({
    updateOne: { filter: { name }, update: { $setOnInsert: { name } }, upsert: true }
  })));

  // 2. Hệ thống chỉ có DUY NHẤT một tài khoản (admin): vừa mua, bán, vừa quản trị
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  let owner = await M.User.findOne({ username: 'admin' });
  if (!owner) {
    owner = await M.User.create({
      username: 'admin',
      email: 'admin@chodocu.vn',
      name: 'Chủ Chợ Đồ Cũ',
      phone: '0901234567',
      address: 'TP. Hồ Chí Minh',
      passwordHash: await bcrypt.hash(adminPass, 10),
      role: 'admin'
    });
    console.log(`✅ Đã tạo tài khoản duy nhất: username="admin" | password="${adminPass}"`);
  }

  // 3. Dọn các tài khoản mẫu cũ (nguoiban, nguoimua) cùng dữ liệu của chúng
  const old = await M.User.find({ username: { $in: ['nguoiban', 'nguoimua'] } }).select('_id');
  if (old.length) {
    const ids = old.map(u => u._id);
    const prods = await M.Product.find({ seller: { $in: ids } }).select('_id');
    const orders = await M.Order.find({ $or: [{ buyer: { $in: ids } }, { seller: { $in: ids } }] }).select('_id');
    await Promise.all([
      M.Review.deleteMany({ $or: [{ from: { $in: ids } }, { to: { $in: ids } }, { order: { $in: orders.map(o => o._id) } }] }),
      M.Report.deleteMany({ $or: [{ by: { $in: ids } }, { product: { $in: prods.map(p => p._id) } }] }),
      M.Order.deleteMany({ _id: { $in: orders.map(o => o._id) } }),
      M.Cart.deleteMany({ user: { $in: ids } }),
      M.Product.deleteMany({ _id: { $in: prods.map(p => p._id) } }),
      M.User.deleteMany({ _id: { $in: ids } })
    ]);
    console.log('🧹 Đã xóa tài khoản mẫu cũ (nguoiban, nguoimua) và dữ liệu liên quan');
  }

  // 4. Sản phẩm mẫu (30 tin, 10 danh mục, có ảnh sinh sẵn) nếu DB còn trống
  if (await M.Product.countDocuments() === 0) {
    const host = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
    const items = require('./seed-data').buildProducts(host, path.join(__dirname, 'uploads'), owner._id);
    await M.Product.insertMany(items);
    console.log(`✅ Đã tạo ${items.length} sản phẩm mẫu (đang bán, đã bán, chờ duyệt, VIP)`);
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



