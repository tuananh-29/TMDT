// ===== FILE MỚI – Tích hợp thanh toán VNPAY (sandbox) vào luồng đặt hàng của Chợ Đồ Cũ =====
// Gắn trong server.js:  app.use('/api/orders', require('./vnpay').router);
//   POST /api/orders/create_payment_url  (cần đăng nhập) → tạo đơn + trả { paymentUrl }
//   GET  /api/orders/vnpay_return        → VNPAY chuyển khách về (vnp_ReturnUrl)
//   GET  /api/orders/vnpay_ipn           → VNPAY gọi server-to-server (IPN URL)
const router = require('express').Router();
const M = require('./models'), { auth, w } = require('./middleware');
const U = require('./vnpay-utils');

const FEE = { meet: 0, standard: 30000, express: 50000 };
const EXPIRE_MIN = 15; // thời gian chờ thanh toán (phút)
const bad = (msg, s = 400) => { throw Object.assign(new Error(msg), { status: s }); };

const cfg = () => {
  const c = {
    tmn: process.env.VNP_TMN_CODE,
    secret: process.env.VNP_HASH_SECRET,
    url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNP_RETURN_URL || `http://localhost:${process.env.PORT || 5000}/api/orders/vnpay_return`
  };
  if (!c.tmn || !c.secret) bad('Chưa cấu hình VNP_TMN_CODE / VNP_HASH_SECRET trong server/.env', 500);
  return c;
};
const clientBase = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

/* ---------- Cập nhật kết quả thanh toán (dùng chung cho Return + IPN, an toàn khi gọi lặp) ---------- */
const releaseProducts = ids => M.Product.updateMany({ _id: { $in: ids }, status: 'reserved' }, { status: 'approved' });

// Thất bại / hết hạn: hủy đơn, nhả sản phẩm, trả lại vào giỏ hàng
async function failOrders(ref, code) {
  const r = await M.Order.updateMany(
    { paymentRef: ref, paymentStatus: 'unpaid', status: 'pending' },
    { paymentStatus: 'failed', status: 'cancelled', 'vnpay.responseCode': code }
  );
  if (!r.modifiedCount) return;
  const orders = await M.Order.find({ paymentRef: ref });
  const pids = orders.flatMap(o => o.items.map(i => i.product));
  await releaseProducts(pids);
  if (orders[0]) await M.Cart.updateOne({ user: orders[0].buyer }, { $addToSet: { items: { $each: pids } } }, { upsert: true });
}

// Trả về { RspCode, Message } đúng định dạng IPN của VNPAY
async function applyResult(q) {
  const ref = q.vnp_TxnRef;
  const orders = await M.Order.find({ paymentRef: ref });
  if (!orders.length) return { RspCode: '01', Message: 'Order not found' };
  const expected = orders.reduce((a, o) => a + o.total, 0) * 100;
  if (Number(q.vnp_Amount) !== expected) return { RspCode: '04', Message: 'Invalid amount' };
  if (orders.every(o => o.paymentStatus !== 'unpaid')) return { RspCode: '02', Message: 'Order already confirmed' };

  const ok = q.vnp_ResponseCode === '00' && (q.vnp_TransactionStatus === undefined || q.vnp_TransactionStatus === '00');
  if (ok) {
    const r = await M.Order.updateMany({ paymentRef: ref, paymentStatus: 'unpaid' }, {
      paymentStatus: 'paid',
      vnpay: { responseCode: q.vnp_ResponseCode, transactionNo: q.vnp_TransactionNo, bankCode: q.vnp_BankCode, bankTranNo: q.vnp_BankTranNo, cardType: q.vnp_CardType, payDate: q.vnp_PayDate }
    });
    if (r.modifiedCount && orders.some(o => o.status === 'cancelled'))
      console.warn('⚠️ VNPAY: khách đã thanh toán cho đơn đã hủy, cần hoàn tiền thủ công. TxnRef =', ref);
  } else {
    await failOrders(ref, q.vnp_ResponseCode || '99');
  }
  return { RspCode: '00', Message: 'Confirm Success' };
}

/* ---------- 1) Tạo đơn hàng + URL thanh toán ---------- */
router.post('/create_payment_url', auth, w(async (req, res) => {
  const c = cfg();
  const { shippingMethod = 'meet', address = '', recipientName = '', phone = '', bankCode = '', language } = req.body;
  if (!(shippingMethod in FEE)) bad('Hình thức giao hàng không hợp lệ');
  if (shippingMethod !== 'meet' && !String(address).trim()) bad('Cần nhập địa chỉ nhận hàng');

  // Lấy sản phẩm trong giỏ
  const cart = await M.Cart.findOne({ user: req.user._id });
  const ids = cart ? cart.items : [];
  if (!ids.length) bad('Chưa có sản phẩm để đặt');

  // Giữ chỗ sản phẩm (approved -> reserved), lỗi thì nhả lại
  const got = [];
  try {
    for (const id of ids) {
      const p = await M.Product.findOneAndUpdate({ _id: id, status: 'approved', seller: { $ne: req.user._id } }, { status: 'reserved' }, { new: true });
      if (!p) bad('Có sản phẩm không còn khả dụng');
      got.push(p);
    }
  } catch (e) { await releaseProducts(got.map(p => p._id)); throw e; }

  // Tách đơn theo người bán – tất cả dùng chung 1 mã giao dịch VNPAY (paymentRef)
  const paymentRef = String(new (require('mongoose').Types.ObjectId)());
  const by = {};
  got.forEach(p => (by[p.seller] = by[p.seller] || []).push(p));
  let total = 0; const orderIds = [];
  try {
    for (const s in by) {
      const items = by[s].map(p => ({ product: p._id, title: p.title, price: p.price }));
      const sub = items.reduce((a, i) => a + i.price, 0);
      const o = await M.Order.create({
        buyer: req.user._id, seller: s, items,
        shipping: { method: shippingMethod, fee: FEE[shippingMethod], recipientName: String(recipientName || req.user.name).trim(), phone: String(phone || req.user.phone || '').trim(), address: String(address).trim() },
        payment: 'vnpay', paymentStatus: 'unpaid', paymentRef, total: sub + FEE[shippingMethod]
      });
      total += o.total; orderIds.push(o._id);
    }
    if (total < 5000 || total >= 1e9) bad('Số tiền thanh toán VNPAY phải từ 5.000đ đến dưới 1 tỷ đồng');
  } catch (e) {
    await M.Order.deleteMany({ _id: { $in: orderIds } });
    await releaseProducts(got.map(p => p._id));
    throw e;
  }
  await M.Cart.updateOne({ user: req.user._id }, { $pull: { items: { $in: got.map(p => p._id) } } });

  // Dựng tham số gửi VNPAY
  const now = new Date();
  const params = {
    vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: c.tmn,
    vnp_Locale: language === 'en' ? 'en' : 'vn', vnp_CurrCode: 'VND',
    vnp_TxnRef: paymentRef, vnp_OrderInfo: 'Thanh toan don hang ' + paymentRef, vnp_OrderType: 'other',
    vnp_Amount: total * 100, // nhân 100 theo quy định VNPAY
    vnp_ReturnUrl: c.returnUrl, vnp_IpAddr: U.clientIp(req),
    vnp_CreateDate: U.fmtDate(now), vnp_ExpireDate: U.fmtDate(new Date(now.getTime() + EXPIRE_MIN * 60e3))
  };
  if (/^[A-Za-z0-9]{3,20}$/.test(String(bankCode))) params.vnp_BankCode = bankCode; // để trống → khách tự chọn ngân hàng tại VNPAY

  res.status(201).json({ paymentUrl: U.buildPaymentUrl(c.url, params, c.secret), orderIds, amount: total });
}));

/* ---------- 2) vnp_ReturnUrl: khách được VNPAY chuyển về ---------- */
router.get('/vnpay_return', w(async (req, res) => {
  const c = cfg(), q = req.query;
  const back = o => res.redirect(`${clientBase()}/#vnpay_return?${new URLSearchParams(o)}`);
  if (!U.verify(q, c.secret)) return back({ ok: '0', code: '97' });
  // Cập nhật luôn tại đây để chạy được trên localhost (IPN cần URL public); hàm này an toàn khi bị gọi lặp
  const r = await applyResult(q);
  const handled = r.RspCode === '00' || r.RspCode === '02';
  const paid = handled && q.vnp_ResponseCode === '00';
  back({ ok: paid ? '1' : '0', code: handled ? q.vnp_ResponseCode : '99', ref: q.vnp_TxnRef || '', amount: String(Number(q.vnp_Amount || 0) / 100), bank: q.vnp_BankCode || '', txn: q.vnp_TransactionNo || '' });
}));

/* ---------- 3) IPN URL: VNPAY gọi server-to-server ---------- */
router.get('/vnpay_ipn', async (req, res) => {
  try {
    if (!U.verify(req.query, cfg().secret)) return res.json({ RspCode: '97', Message: 'Invalid signature' });
    res.json(await applyResult(req.query));
  } catch (e) {
    console.error('VNPAY IPN error:', e);
    res.json({ RspCode: '99', Message: 'Unknown error' });
  }
});

/* ---------- Dọn đơn VNPAY quá hạn chưa thanh toán (nhả sản phẩm) ---------- */
async function expireUnpaid() {
  const cutoff = new Date(Date.now() - (EXPIRE_MIN + 5) * 60e3);
  const refs = await M.Order.distinct('paymentRef', { payment: 'vnpay', paymentStatus: 'unpaid', status: 'pending', createdAt: { $lt: cutoff } });
  for (const ref of refs) await failOrders(ref, '11');
}
const startSweeper = () => { setInterval(() => expireUnpaid().catch(e => console.error('VNPAY sweeper:', e.message)), 5 * 60e3).unref(); };

module.exports = { router, startSweeper, applyResult };
