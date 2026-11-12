const m = require('mongoose'), S = m.Schema, ref = r => ({ type: S.Types.ObjectId, ref: r }), t = { timestamps: true };

exports.DEFAULT_CATEGORIES = ['Xe cộ', 'Điện thoại', 'Đồ điện tử', 'Đồ gia dụng', 'Thời trang', 'Nội thất', 'Thú cưng', 'Sách & học tập'];
exports.CONDITIONS = ['Mới 99%', 'Như mới', 'Đã dùng', 'Có xước/lỗi'];

exports.Category = m.model('Category', new S({
  name: { type: String, unique: true, required: true, trim: true },
  description: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, t));

exports.User = m.model('User', new S({
  username: { type: String, unique: true, required: true },
  email: { type: String, default: '' },
  name: String,
  phone: String,
  address: String,
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  banned: { type: Boolean, default: false }
}, t));

exports.Product = m.model('Product', new S({
  title: { type: String, required: true, maxlength: 120 },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  description: String,
  condition: { type: String, enum: exports.CONDITIONS, required: true },
  percentNew: { type: Number, min: 10, max: 100, default: 90 },
  location: String,
  phone: String,
  images: [String],
  seller: { ...ref('User'), index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'reserved', 'sold'], default: 'pending', index: true },
  rejectReason: { type: String, default: '' },
  reviewedBy: ref('User'),
  vip: { type: Boolean, default: false },
  vipUntil: Date
}, t));

exports.Cart = m.model('Cart', new S({
  user: { ...ref('User'), unique: true },
  items: [ref('Product')]
}));

exports.Order = m.model('Order', new S({
  buyer: { ...ref('User'), index: true },
  seller: { ...ref('User'), index: true },
  items: [{ product: ref('Product'), title: String, price: Number }],
  shipping: { method: String, fee: Number, recipientName: String, phone: String, address: String },
  payment: String,
  total: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'], default: 'pending' }
}, t));

exports.Review = m.model('Review', new S({
  order: { ...ref('Order'), unique: true },
  from: ref('User'),
  to: { ...ref('User'), index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String
}, t));

exports.Report = m.model('Report', new S({
  product: ref('Product'),
  by: ref('User'),
  reason: String,
  note: String,
  status: { type: String, enum: ['open', 'removed', 'dismissed'], default: 'open' }
}, t));

exports.Log = m.model('Log', new S({
  actor: String,
  action: String,
  ref: String,
  data: S.Types.Mixed
}, t));
