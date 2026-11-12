const router = require('express').Router();
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), multer = require('multer'), path = require('path'), fs = require('fs');
const cloud = require('cloudinary').v2;
const M = require('./models'), { auth, role, w, SECRET } = require('./middleware');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const up = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (r, f, cb) => cb(null, /^image\//.test(f.mimetype))
});

const bad = (m, s = 400) => { throw Object.assign(new Error(m), { status: s }); };
const log = (actor, action, ref, data) => M.Log.create({ actor, action, ref: String(ref), data }).catch(() => {});
const sign = u => jwt.sign({ id: u._id, role: u.role }, SECRET(), { expiresIn: '7d' });
const pub = u => ({ id: u._id, username: u.username, email: u.email, name: u.name, phone: u.phone, address: u.address, role: u.role, banned: u.banned });
const mine = (p, u) => String(p.seller._id || p.seller) === String(u._id);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Lưu ảnh lên Cloudinary nếu có cấu hình, ngược lại lưu trực tiếp vào server/uploads
const upImgs = async (req, fsList) => {
  const urls = [];
  if (req.body.imageUrls) {
    const extra = String(req.body.imageUrls).split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
    urls.push(...extra);
  }
  if (!fsList || !fsList.length) return urls;
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
    const cloudUrls = await Promise.all(fsList.map(f => new Promise((ok, no) =>
      cloud.uploader.upload_stream({ folder: 'chodocu' }, (e, r) => e ? no(e) : ok(r.secure_url)).end(f.buffer)
    )));
    return [...urls, ...cloudUrls];
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  for (const f of fsList) {
    const ext = path.extname(f.originalname) || '.jpg';
    const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), f.buffer);
    urls.push(`${baseUrl}/uploads/${filename}`);
  }
  return urls;
};

const avg = async id => {
  const r = await M.Review.aggregate([{ $match: { to: id } }, { $group: { _id: null, a: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  return r[0] ? { avg: +r[0].a.toFixed(1), count: r[0].n } : { avg: 0, count: 0 };
};

// ===== Categories =====
router.get('/categories', w(async (_, res) => {
  const cats = await M.Category.find({ active: true }).sort('name');
  const names = cats.length ? cats.map(c => c.name) : M.DEFAULT_CATEGORIES;
  res.json({ categories: names, categoryList: cats, conditions: M.CONDITIONS });
}));

// ===== Auth =====
router.post('/auth/register', w(async (req, res) => {
  const { username = '', email = '', password = '', name = '', phone = '', address = '' } = req.body;
  const u = String(username || email.split('@')[0]).trim().toLowerCase();
  if (!/^[a-z0-9_.]{3,30}$/.test(u)) bad('Tên đăng nhập 3-30 ký tự: a-z, 0-9, _');
  if (String(password).length < 6) bad('Mật khẩu tối thiểu 6 ký tự');
  if (await M.User.findOne({ username: u })) bad('Tên đăng nhập đã tồn tại');
  const user = await M.User.create({
    username: u,
    email: String(email).trim(),
    name: String(name).trim() || u,
    phone: String(phone).trim(),
    address: String(address).trim(),
    passwordHash: await bcrypt.hash(password, 10)
  });
  log(u, 'register', user._id);
  res.status(201).json({ token: sign(user), user: pub(user) });
}));

router.post('/auth/login', w(async (req, res) => {
  const key = String(req.body.username || req.body.email || '').trim().toLowerCase();
  const u = await M.User.findOne({ $or: [{ username: key }, { email: key }] });
  if (!u || !await bcrypt.compare(String(req.body.password || ''), u.passwordHash)) bad('Sai tên đăng nhập hoặc mật khẩu', 401);
  if (u.banned) bad('Tài khoản của bạn đã bị khóa bởi Admin', 403);
  log(u.username, 'login', u._id);
  res.json({ token: sign(u), user: pub(u) });
}));

router.get('/me', auth, (req, res) => res.json(pub(req.user)));

router.put('/me', auth, w(async (req, res) => {
  if (req.body.name) req.user.name = String(req.body.name).trim();
  if (req.body.phone !== undefined) req.user.phone = String(req.body.phone).trim();
  if (req.body.email !== undefined) req.user.email = String(req.body.email).trim();
  if (req.body.address !== undefined) req.user.address = String(req.body.address).trim();
  await req.user.save();
  res.json(pub(req.user));
}));

router.get('/users/:username', w(async (req, res) => {
  const u = await M.User.findOne({ username: req.params.username.toLowerCase() });
  if (!u) bad('Không tìm thấy người dùng', 404);
  const reviews = await M.Review.find({ to: u._id }).sort('-createdAt').limit(30).populate('from', 'username name');
  res.json({ user: { username: u.username, name: u.name, phone: u.phone, joined: u.createdAt }, ...await avg(u._id), reviews });
}));

// ===== Products =====
const pick = b => ({
  title: b.title && String(b.title).trim(),
  category: b.category,
  price: b.price !== undefined ? Number(b.price) : undefined,
  description: b.description && String(b.description).trim(),
  condition: b.condition,
  percentNew: b.percentNew !== undefined ? Number(b.percentNew) : 90,
  location: b.location,
  phone: b.phone && String(b.phone).trim()
});

router.get('/products', w(async (req, res) => {
  const { q, category, location, min, max, condition, percentNew, sort, seller } = req.query;
  const page = Math.max(1, +req.query.page || 1), f = { status: 'approved' };
  await M.Product.updateMany({ vip: true, vipUntil: { $lt: new Date() } }, { vip: false });
  if (q) f.title = new RegExp(esc(String(q)), 'i');
  if (category) f.category = category;
  if (location && location !== 'Toàn quốc') f.location = location;
  if (condition) f.condition = condition;
  if (+percentNew) f.percentNew = { $gte: +percentNew };
  if (min || max) f.price = { ...(min && { $gte: +min }), ...(max && { $lte: +max }) };
  if (seller) {
    const u = await M.User.findOne({ username: String(seller).toLowerCase() });
    f.seller = u ? u._id : null;
  }
  const s = sort === 'lo' ? { price: 1 } : sort === 'hi' ? { price: -1 } : { vip: -1, createdAt: -1 };
  const [items, total] = await Promise.all([
    M.Product.find(f).sort(s).skip((page - 1) * 20).limit(20).populate('seller', 'username name'),
    M.Product.countDocuments(f)
  ]);
  res.json({ items, total, page });
}));

router.get('/my/products', auth, w(async (req, res) => {
  res.json(await M.Product.find({ seller: req.user._id }).sort('-createdAt'));
}));

router.get('/products/:id', w(async (req, res) => {
  const p = await M.Product.findById(req.params.id).populate('seller', 'username name phone createdAt');
  if (!p || !['approved', 'reserved', 'sold', 'pending'].includes(p.status)) bad('Không tìm thấy tin', 404);
  const related = await M.Product.find({ category: p.category, status: 'approved', _id: { $ne: p._id } }).limit(4);
  res.json({ product: p, seller: await avg(p.seller._id), related });
}));

router.post('/products', auth, up.array('images', 5), w(async (req, res) => {
  const d = pick(req.body);
  if (!d.title || !(d.price >= 0) || !d.category || !M.CONDITIONS.includes(d.condition)) bad('Thiếu hoặc sai thông tin tin đăng');
  const imgs = await upImgs(req, req.files);
  const p = await M.Product.create({
    ...d,
    images: imgs,
    seller: req.user._id,
    phone: d.phone || req.user.phone,
    status: req.user.role === 'admin' ? 'approved' : 'pending'
  });
  log(req.user.username, 'product_create', p._id);
  res.status(201).json(p);
}));

router.put('/products/:id', auth, up.array('images', 5), w(async (req, res) => {
  const p = await M.Product.findById(req.params.id);
  if (!p) bad('Không tìm thấy', 404);
  if (!mine(p, req.user) && req.user.role !== 'admin') bad('Không phải tin của bạn', 403);
  if (['reserved', 'sold'].includes(p.status) && req.user.role !== 'admin') bad('Tin đang có đơn hoặc đã bán, không sửa được');
  const d = pick(req.body);
  Object.keys(d).forEach(k => d[k] !== undefined && (p[k] = d[k]));
  const imgs = await upImgs(req, req.files);
  if (imgs.length) p.images = imgs;
  if (req.user.role !== 'admin') {
    p.status = 'pending';
    p.rejectReason = '';
  }
  await p.save();
  log(req.user.username, 'product_update', p._id);
  res.json(p);
}));

router.delete('/products/:id', auth, w(async (req, res) => {
  const p = await M.Product.findById(req.params.id);
  if (!p) bad('Không tìm thấy', 404);
  if (!mine(p, req.user) && req.user.role !== 'admin') bad('Không đủ quyền', 403);
  if (p.status === 'reserved' && req.user.role !== 'admin') bad('Tin đang có đơn hàng chưa hoàn tất');
  await p.deleteOne();
  log(req.user.username, 'product_delete', p._id);
  res.json({ ok: 1 });
}));

router.patch('/products/:id/sold', auth, w(async (req, res) => {
  const p = await M.Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user._id, status: 'approved' },
    { status: 'sold' },
    { new: true }
  );
  if (!p) bad('Không thể đánh dấu đã bán');
  res.json(p);
}));

router.post('/products/:id/vip', auth, w(async (req, res) => {
  const days = [7, 15].includes(+req.body.days) ? +req.body.days : 7;
  const p = await M.Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user._id, status: 'approved' },
    { vip: true, vipUntil: new Date(Date.now() + days * 864e5), createdAt: new Date() },
    { new: true }
  );
  if (!p) bad('Không thể đẩy tin này');
  log(req.user.username, 'vip', p._id, { days });
  res.json(p);
}));

// ===== Cart =====
router.get('/cart', auth, w(async (req, res) => {
  const c = await M.Cart.findOne({ user: req.user._id }).populate({ path: 'items', populate: { path: 'seller', select: 'username name' } });
  res.json((c ? c.items : []).filter(p => p && p.status === 'approved'));
}));

router.post('/cart/:pid', auth, w(async (req, res) => {
  const p = await M.Product.findOne({ _id: req.params.pid, status: 'approved' });
  if (!p) bad('Sản phẩm không khả dụng');
  if (mine(p, req.user)) bad('Không thể mua tin của chính mình');
  await M.Cart.updateOne({ user: req.user._id }, { $addToSet: { items: p._id } }, { upsert: true });
  res.json({ ok: 1 });
}));

router.delete('/cart/:pid', auth, w(async (req, res) => {
  await M.Cart.updateOne({ user: req.user._id }, { $pull: { items: req.params.pid } });
  res.json({ ok: 1 });
}));

// ===== Orders =====
const FEE = { meet: 0, standard: 30000, express: 50000 }, PAY = ['cod', 'bank', 'wallet'];
router.post('/orders', auth, w(async (req, res) => {
  const { shippingMethod = 'meet', address = '', recipientName = '', phone = '', payment = 'cod' } = req.body;
  let ids = req.body.productIds;
  if (!(shippingMethod in FEE) || !PAY.includes(payment)) bad('Hình thức giao hàng/thanh toán không hợp lệ');
  if (shippingMethod !== 'meet' && !String(address).trim()) bad('Cần nhập địa chỉ nhận hàng');
  if (!ids || !ids.length) {
    const c = await M.Cart.findOne({ user: req.user._id });
    ids = c ? c.items : [];
  }
  if (!ids.length) bad('Chưa có sản phẩm để đặt');
  const got = [];
  try {
    for (const id of ids) {
      const p = await M.Product.findOneAndUpdate({ _id: id, status: 'approved', seller: { $ne: req.user._id } }, { status: 'reserved' }, { new: true });
      if (!p) bad('Có sản phẩm không còn khả dụng');
      got.push(p);
    }
  } catch (e) {
    await M.Product.updateMany({ _id: { $in: got.map(p => p._id) } }, { status: 'approved' });
    throw e;
  }
  const by = {};
  got.forEach(p => (by[p.seller] = by[p.seller] || []).push(p));
  const orders = [];
  for (const s in by) {
    const items = by[s].map(p => ({ product: p._id, title: p.title, price: p.price }));
    const sub = items.reduce((a, i) => a + i.price, 0);
    const o = await M.Order.create({
      buyer: req.user._id,
      seller: s,
      items,
      shipping: {
        method: shippingMethod,
        fee: FEE[shippingMethod],
        recipientName: String(recipientName || req.user.name).trim(),
        phone: String(phone || req.user.phone || '').trim(),
        address: String(address).trim()
      },
      payment,
      total: sub + FEE[shippingMethod]
    });
    orders.push(o);
    log(req.user.username, 'order_create', o._id, { total: o.total });
  }
  await M.Cart.updateOne({ user: req.user._id }, { $pull: { items: { $in: got.map(p => p._id) } } });
  res.status(201).json(orders);
}));

router.get('/orders', auth, w(async (req, res) => {
  const side = req.query.role === 'seller' ? 'seller' : 'buyer';
  const os = await M.Order.find({ [side]: req.user._id }).sort('-createdAt').populate('buyer seller', 'username name phone');
  const rvs = await M.Review.find({ order: { $in: os.map(o => o._id) } });
  const ratedSet = new Set(rvs.map(r => String(r.order)));
  res.json(os.map(o => ({ ...o.toObject(), reviewed: ratedSet.has(String(o._id)) })));
}));

router.patch('/orders/:id/status', auth, w(async (req, res) => {
  const o = await M.Order.findById(req.params.id);
  if (!o) bad('Không tìm thấy đơn', 404);
  // Admin chỉ theo dõi đơn, không đổi trạng thái. Người bán xác nhận / giao / hoàn tất.
  const side = String(o.seller) === String(req.user._id) ? 'seller' : String(o.buyer) === String(req.user._id) ? 'buyer' : bad('Không đủ quyền', 403);
  const T = {
    seller: { pending: ['confirmed', 'cancelled'], confirmed: ['shipping', 'cancelled'], shipping: ['completed'] },
    buyer: { pending: ['cancelled'], shipping: ['completed'] }
  };
  let ok = T[side][o.status] || [];
  if (side === 'buyer' && o.status === 'confirmed' && o.shipping.method === 'meet') ok = ['completed'];
  const to = req.body.status;
  if (!ok.includes(to)) bad('Không thể chuyển trạng thái đơn này');
  const from = o.status;
  o.status = to;
  await o.save();
  const pid = o.items.map(i => i.product);
  if (to === 'cancelled') await M.Product.updateMany({ _id: { $in: pid } }, { status: 'approved' });
  if (to === 'completed') await M.Product.updateMany({ _id: { $in: pid } }, { status: 'sold' });
  log(req.user.username, 'order_status', o._id, { from, to });
  res.json(o);
}));

// ===== Reviews =====
router.post('/reviews', auth, w(async (req, res) => {
  const o = await M.Order.findById(req.body.orderId);
  if (!o || String(o.buyer) !== String(req.user._id) || o.status !== 'completed') bad('Chỉ đánh giá được đơn bạn đã mua và hoàn tất');
  if (await M.Review.findOne({ order: o._id })) bad('Bạn đã đánh giá đơn này');
  const r = +req.body.rating;
  if (!(r >= 1 && r <= 5)) bad('Điểm từ 1 đến 5');
  const rv = await M.Review.create({ order: o._id, from: req.user._id, to: o.seller, rating: r, comment: String(req.body.comment || '').slice(0, 500) });
  log(req.user.username, 'review', rv._id);
  res.status(201).json(rv);
}));

// ===== Reports =====
router.post('/reports', auth, w(async (req, res) => {
  if (!await M.Product.exists({ _id: req.body.productId })) bad('Không tìm thấy tin', 404);
  res.status(201).json(await M.Report.create({
    product: req.body.productId,
    by: req.user._id,
    reason: String(req.body.reason || 'Khác').slice(0, 100),
    note: String(req.body.note || '').slice(0, 500)
  }));
}));

// ===== ADMIN PANEL (GỘP ĐẦY ĐỦ TÍNH NĂNG TỪ CẢ 3 FILE) =====
const admin = require('express').Router();
router.use('/admin', auth, role('admin'), admin);

// 1. Thống kê tổng quan + Doanh số đơn hoàn tất
admin.get('/stats', w(async (req, res) => {
  const [users, products, pending, approved, sold, orders, reports, categories, revAgg] = await Promise.all([
    M.User.countDocuments(),
    M.Product.countDocuments(),
    M.Product.countDocuments({ status: 'pending' }),
    M.Product.countDocuments({ status: 'approved' }),
    M.Product.countDocuments({ status: 'sold' }),
    M.Order.countDocuments(),
    M.Report.countDocuments({ status: 'open' }),
    M.Category.countDocuments(),
    M.Order.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, revenue: { $sum: '$total' }, completedOrders: { $sum: 1 } } }])
  ]);
  res.json({
    users,
    products,
    pending,
    approved,
    sold,
    orders,
    completedOrders: revAgg[0]?.completedOrders || 0,
    revenue: revAgg[0]?.revenue || 0,
    reports,
    categories
  });
}));

// 2. Danh sách tin chờ duyệt
admin.get('/pending', w(async (req, res) => {
  res.json(await M.Product.find({ status: 'pending' }).sort('createdAt').populate('seller', 'username name phone'));
}));

// 3. Danh sách toàn bộ tin đăng trên sàn (Lọc theo status/search)
admin.get('/products', w(async (req, res) => {
  const f = {};
  if (req.query.status) f.status = req.query.status;
  res.json(await M.Product.find(f).sort('-createdAt').limit(200).populate('seller', 'username name phone'));
}));

// 4. Duyệt / Từ chối (có lưu lý do từ chối) / Đổi trạng thái / Bật tắt VIP
admin.patch('/products/:id', w(async (req, res) => {
  const { status, rejectReason = '', vip } = req.body;
  const update = {};
  if (status) {
    if (!['approved', 'rejected', 'pending', 'sold'].includes(status)) bad('Trạng thái không hợp lệ');
    if (status === 'rejected' && !String(rejectReason).trim()) bad('Vui lòng nhập lý do từ chối');
    update.status = status;
    update.rejectReason = status === 'rejected' ? String(rejectReason).trim() : '';
    update.reviewedBy = req.user._id;
  }
  if (vip !== undefined) {
    update.vip = !!vip;
    update.vipUntil = vip ? new Date(Date.now() + 7 * 864e5) : null;
  }
  const p = await M.Product.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!p) bad('Không tìm thấy sản phẩm', 404);
  log(req.user.username, 'admin_product_' + (status || 'vip'), req.params.id, update);
  res.json(p);
}));

// 5. Quản lý Danh mục (Thêm / Sửa / Xóa danh mục)
admin.get('/categories', w(async (req, res) => {
  res.json(await M.Category.find().sort('name'));
}));

admin.post('/categories', w(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) bad('Tên danh mục không được để trống');
  if (await M.Category.findOne({ name })) bad('Danh mục này đã tồn tại');
  const c = await M.Category.create({ name, description: String(req.body.description || '').trim() });
  log(req.user.username, 'category_create', c._id, { name });
  res.status(201).json(c);
}));

admin.put('/categories/:id', w(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) bad('Tên danh mục không được để trống');
  const c = await M.Category.findById(req.params.id);
  if (!c) bad('Không tìm thấy danh mục', 404);
  const oldName = c.name;
  c.name = name;
  await c.save();
  if (oldName !== name) await M.Product.updateMany({ category: oldName }, { category: name });
  log(req.user.username, 'category_update', c._id, { oldName, name });
  res.json(c);
}));

admin.delete('/categories/:id', w(async (req, res) => {
  const c = await M.Category.findById(req.params.id);
  if (!c) bad('Không tìm thấy danh mục', 404);
  const used = await M.Product.countDocuments({ category: c.name });
  if (used > 0) bad(`Danh mục "${c.name}" đang có ${used} sản phẩm, không thể xóa`);
  await c.deleteOne();
  log(req.user.username, 'category_delete', c._id, { name: c.name });
  res.json({ ok: 1 });
}));

// 6. Xem (chỉ theo dõi) đơn hàng toàn sàn
admin.get('/orders', w(async (req, res) => {
  res.json(await M.Order.find().sort('-createdAt').limit(200).populate('buyer seller', 'username name phone'));
}));

// 7. Quản lý Báo cáo vi phạm
admin.get('/reports', w(async (req, res) => {
  res.json(await M.Report.find({ status: 'open' }).sort('-createdAt').populate('product', 'title status price').populate('by', 'username name'));
}));

admin.patch('/reports/:id', w(async (req, res) => {
  const r = await M.Report.findById(req.params.id);
  if (!r) bad('Không tìm thấy báo cáo', 404);
  if (req.body.action === 'remove') {
    await M.Product.findByIdAndUpdate(r.product, { status: 'rejected', rejectReason: 'Vi phạm tiêu chuẩn cộng đồng (Bị báo cáo)' });
    r.status = 'removed';
  } else {
    r.status = 'dismissed';
  }
  await r.save();
  log(req.user.username, 'report_' + r.status, r._id);
  res.json(r);
}));

// 8. Quản lý Người dùng (Khóa/Mở khóa & Đổi quyền Admin/User)
admin.get('/users', w(async (req, res) => {
  res.json(await M.User.find().select('-passwordHash').sort('-createdAt').limit(200));
}));

admin.patch('/users/:id/ban', w(async (req, res) => {
  const u = await M.User.findById(req.params.id);
  if (!u || String(u._id) === String(req.user._id)) bad('Không thể khóa tài khoản của chính mình');
  u.banned = !!req.body.banned;
  await u.save();
  log(req.user.username, 'ban', u._id, { banned: u.banned });
  res.json(pub(u));
}));

admin.patch('/users/:id/role', w(async (req, res) => {
  const u = await M.User.findById(req.params.id);
  if (!u || String(u._id) === String(req.user._id)) bad('Không thể tự đổi quyền của chính mình');
  if (!['user', 'admin'].includes(req.body.role)) bad('Quyền không hợp lệ');
  u.role = req.body.role;
  await u.save();
  log(req.user.username, 'change_role', u._id, { role: u.role });
  res.json(pub(u));
}));

// 9. Nhật ký hoạt động
admin.get('/logs', w(async (req, res) => {
  res.json(await M.Log.find().sort('-createdAt').limit(200));
}));

module.exports = router;
