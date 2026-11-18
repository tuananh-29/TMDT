// ===== FILE MỚI – tiện ích VNPAY (không phụ thuộc thư viện ngoài) =====
// Theo tài liệu "VNPAY Payment Gateway Techspec" v2.1.0: ký HMAC-SHA512 trên chuỗi
// "key=value&key=value" đã sắp xếp theo tên tham số, giá trị được URL-encode (khoảng trắng -> '+').
const crypto = require('crypto');

const enc = v => encodeURIComponent(v).replace(/%20/g, '+');

// Sắp xếp tham số theo alphabet rồi ghép thành chuỗi query (đã encode)
const toQuery = p => Object.keys(p).sort().map(k => `${enc(k)}=${enc(p[k])}`).join('&');

// Chữ ký HMAC-SHA512 (hex)
const sign = (params, secret) =>
  crypto.createHmac('sha512', secret).update(Buffer.from(toQuery(params), 'utf-8')).digest('hex');

// Tạo URL chuyển hướng sang cổng thanh toán VNPAY
const buildPaymentUrl = (baseUrl, params, secret) =>
  `${baseUrl}?${toQuery(params)}&vnp_SecureHash=${sign(params, secret)}`;

// Kiểm tra chữ ký của dữ liệu VNPAY gửi về (vnp_ReturnUrl hoặc IPN)
const verify = (query, secret) => {
  const q = {};
  for (const k of Object.keys(query || {})) {
    if (!k.startsWith('vnp_')) continue;
    if (typeof query[k] !== 'string') return false; // tham số lặp / bất thường
    q[k] = query[k];
  }
  const got = String(q.vnp_SecureHash || '');
  delete q.vnp_SecureHash;
  delete q.vnp_SecureHashType;
  const want = sign(q, secret);
  if (got.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got.toLowerCase()), Buffer.from(want));
};

// yyyyMMddHHmmss theo giờ GMT+7 (đúng yêu cầu vnp_CreateDate / vnp_ExpireDate)
const fmtDate = (d = new Date()) =>
  new Date(d.getTime() + 7 * 3600e3).toISOString().replace(/[-:T]/g, '').slice(0, 14);

const clientIp = req => {
  let ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (ip === '::1') ip = '127.0.0.1';
  return ip.replace(/^::ffff:/, '') || '127.0.0.1';
};

// Mã lỗi vnp_ResponseCode (mục 2.5.7.1 của tài liệu)
const MESSAGES = {
  '00': 'Giao dịch thành công',
  '05': 'Tài khoản không đủ số dư để thực hiện giao dịch',
  '06': 'Sai mật khẩu xác thực giao dịch (OTP)',
  '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ (gian lận / bất thường)',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
  '10': 'Xác thực thông tin thẻ/tài khoản sai quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán, vui lòng thực hiện lại',
  '12': 'Thẻ/Tài khoản bị khóa',
  '24': 'Bạn đã hủy giao dịch',
  '65': 'Tài khoản đã vượt hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
  '97': 'Chữ ký không hợp lệ',
  '99': 'Lỗi khác'
};

module.exports = { enc, toQuery, sign, buildPaymentUrl, verify, fmtDate, clientIp, MESSAGES };
