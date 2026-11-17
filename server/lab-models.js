// ===== FILE MỚI – không sửa models.js =====
// Hai model bổ sung cho Lab09 (category có icon) và Lab10 (giỏ hàng có số lượng)
const m = require('mongoose'), S = m.Schema;

// Lab09 Bài 1: Category có thêm field "icon".
// Dùng CHUNG collection "categories" với model Category cũ (tham số thứ 3),
// nên dữ liệu danh mục hiện có vẫn dùng được, chỉ thêm field icon.
exports.CategoryLab = m.models.CategoryLab || m.model('CategoryLab', new S({
  name: String,
  description: String,
  active: { type: Boolean, default: true },
  icon: { type: String, default: '' }
}, { timestamps: true }), 'categories');

// Lab10: collection "cart" đúng cấu trúc đề bài:
// user_id, items[{ product_id, name, price, quantity, image }], created_at, updated_at
// (Cart cũ nằm ở collection "carts" nên hai bên không đụng nhau)
exports.CartLab = m.models.CartLab || m.model('CartLab', new S({
  user_id: { type: String, required: true, unique: true },
  items: [{
    _id: false,
    product_id: { type: S.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1, min: 1 },
    image: String
  }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }), 'cart');
