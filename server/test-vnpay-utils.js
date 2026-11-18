// Chạy: node test-vnpay-utils.js  (không cần DB/mạng) – kiểm tra ký, xác thực chữ ký, định dạng ngày
const assert = require('assert'), U = require('./vnpay-utils');
const secret = 'TESTSECRET';
const params = { vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: 'ABC12345', vnp_Amount: 15000000, vnp_OrderInfo: 'Thanh toan don hang 1', vnp_ReturnUrl: 'http://localhost:5000/api/orders/vnpay_return', vnp_TxnRef: 'abc' };
const url = U.buildPaymentUrl('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', params, secret);
const query = Object.fromEntries(new URL(url).searchParams); // giả lập VNPAY trả lại đúng dữ liệu đã ký
assert(U.verify(query, secret), 'chữ ký đúng phải hợp lệ');
assert(!U.verify({ ...query, vnp_Amount: '1' }, secret), 'sửa số tiền phải bị từ chối');
assert(!U.verify(query, 'SAI'), 'sai secret phải bị từ chối');
assert(!U.verify({ ...query, vnp_SecureHash: 'abc' }, secret));
assert(url.includes('vnp_OrderInfo=Thanh+toan+don+hang+1'), 'khoảng trắng phải là +');
assert(url.indexOf('vnp_Amount') < url.indexOf('vnp_Command') && url.indexOf('vnp_Command') < url.indexOf('vnp_TmnCode'), 'phải sắp xếp A-Z');
assert.strictEqual(U.fmtDate(new Date('2026-11-19T00:00:00Z')), '20261119070000', 'GMT+7');
console.log('✅ Tất cả test đều đạt');
