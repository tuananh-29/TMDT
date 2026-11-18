// ===== FILE MỚI – không sửa routes.js =====
// Gắn thêm API cho Lab09 Bài 1 (category) và Lab10 (giỏ hàng có số lượng).
// Cách dùng: trong server.js thêm 1 dòng  require('./lab-routes')(app);
const express = require('express');
const M = require('./models'), L = require('./lab-models'), { auth, role, w } = require('./middleware');

const bad = (msg, s = 400) => { throw Object.assign(new Error(msg), { status: s }); };

module.exports = app => {
  const cat = express.Router(), cart = express.Router();

  /* ================= LAB09 BÀI 1 – CATEGORY ================= */
  // Trả về { _id, name, icon, items } ; items = số sản phẩm đang bán (approved) thuộc danh mục
  const listCategory = async limit => {
    const q = L.CategoryLab.find({ active: { $ne: false } }).sort('name');
    if (limit) q.limit(limit);
    const [cats, counts] = await Promise.all([
      q.lean(),
      M.Product.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$category', n: { $sum: 1 } } }])
    ]);
    const map = new Map(counts.map(c => [c._id, c.n]));
    return cats.map(c => ({ _id: c._id, name: c.name, icon: c.icon || '', items: map.get(c.name) || 0 }));
  };

  // GET /api/categories/category  → giới hạn 10 record
  cat.get('/category', w(async (req, res) => {
    res.json({ category: await listCategory(10) });
  }));

  // GET /api/categories/category/viewall → toàn bộ
  cat.get('/category/viewall', w(async (req, res) => {
    res.json({ category: await listCategory() });
  }));

  // PUT /api/categories/category/:id/icon → admin đặt icon (emoji hoặc link ảnh)
  // (thêm/sửa tên/xóa danh mục đã có sẵn ở /api/admin/categories nên không làm lại)
  cat.put('/category/:id/icon', auth, role('admin'), w(async (req, res) => {
    const icon = String(req.body.icon || '').trim();
    const r = await L.CategoryLab.updateOne({ _id: req.params.id }, { icon });
    if (!r.matchedCount) bad('Không tìm thấy danh mục', 404);
    res.json({ message: 'Đã cập nhật icon', icon });
  }));

  /* ================= LAB10 – GIỎ HÀNG ================= */
  const uid = req => String(req.user._id); // user lấy từ JWT, không hardcode "user_001"
  const view = c => {
    const items = c ? c.items : [];
    return {
      items,
      count: items.reduce((a, i) => a + i.quantity, 0),
      total: items.reduce((a, i) => a + i.price * i.quantity, 0)
    };
  };
  const qty = v => {
    const n = Math.floor(Number(v));
    if (!(n >= 1 && n <= 99)) bad('Số lượng phải từ 1 đến 99');
    return n;
  };

  // POST /api/products/products/cart/add   body: { product: { product_id, quantity } }
  cart.post('/products/cart/add', auth, w(async (req, res) => {
    const product = req.body.product || {};
    if (!product.product_id) bad('Thiếu product_id');
    const quantity = qty(product.quantity ?? 1);
    const p = await M.Product.findOne({ _id: product.product_id, status: 'approved' });
    if (!p) bad('Sản phẩm không khả dụng');
    if (String(p.seller) === uid(req)) bad('Không thể mua tin của chính mình');

    // name / price / image lấy từ DB để người dùng không tự sửa giá
    const item = { product_id: p._id, name: p.title, price: p.price, quantity, image: (p.images || [])[0] || '' };
    const user_id = uid(req);
    const cartDoc = await L.CartLab.findOne({ user_id });
    if (cartDoc) {
      if (cartDoc.items.some(i => String(i.product_id) === String(p._id))) {
        // Đã có trong giỏ → tăng số lượng
        await L.CartLab.updateOne({ user_id, 'items.product_id': p._id }, { $inc: { 'items.$.quantity': quantity } });
      } else {
        // Chưa có → thêm mới
        await L.CartLab.updateOne({ user_id }, { $push: { items: item } });
      }
    } else {
      // Tạo giỏ hàng mới cho user
      await L.CartLab.create({ user_id, items: [item] });
    }
    res.json({ message: 'Đã thêm sản phẩm vào giỏ hàng.' });
  }));

  // GET /api/products/products/cart  → xem giỏ hàng
  cart.get('/products/cart', auth, w(async (req, res) => {
    res.json(view(await L.CartLab.findOne({ user_id: uid(req) }).lean()));
  }));

  // PUT /api/products/products/cart/update   body: { product_id, quantity }  → cập nhật số lượng
  cart.put('/products/cart/update', auth, w(async (req, res) => {
    const { product_id } = req.body;
    if (!product_id) bad('Thiếu product_id');
    const quantity = qty(req.body.quantity);
    const r = await L.CartLab.updateOne({ user_id: uid(req), 'items.product_id': product_id }, { $set: { 'items.$.quantity': quantity } });
    if (!r.matchedCount) bad('Sản phẩm không có trong giỏ', 404);
    res.json({ message: 'Đã cập nhật số lượng.' });
  }));

  // DELETE /api/products/products/cart/remove/:product_id → xóa sản phẩm khỏi giỏ
  cart.delete('/products/cart/remove/:product_id', auth, w(async (req, res) => {
    await L.CartLab.updateOne({ user_id: uid(req) }, { $pull: { items: { product_id: req.params.product_id } } });
    res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng.' });
  }));

  app.use('/api/categories', cat);
  app.use('/api/products', cart);
};



