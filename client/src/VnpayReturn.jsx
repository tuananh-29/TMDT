// ===== FILE MỚI – Trang hiển thị kết quả thanh toán VNPAY (#vnpay_return?ok=1&code=00&...) =====
import { useEffect } from 'react';
import { CircleCheck, X } from 'lucide-react';
import { useApp, money } from './lib.jsx';

const MSG = {
  '00': 'Giao dịch thành công', '05': 'Tài khoản không đủ số dư để thực hiện giao dịch', '06': 'Sai mật khẩu xác thực giao dịch (OTP)',
  '07': 'Giao dịch bị nghi ngờ gian lận / bất thường', '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
  '10': 'Xác thực thông tin thẻ/tài khoản sai quá 3 lần', '11': 'Đã hết hạn chờ thanh toán', '12': 'Thẻ/Tài khoản bị khóa',
  '24': 'Bạn đã hủy giao dịch', '65': 'Tài khoản vượt hạn mức giao dịch trong ngày', '75': 'Ngân hàng đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định', '97': 'Chữ ký không hợp lệ (dữ liệu có thể đã bị thay đổi)', '99': 'Lỗi khác'
};

export default function VnpayReturn() {
  const { go, me, refreshCart } = useApp();
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  const ok = q.get('ok') === '1', code = q.get('code') || '99';
  useEffect(() => { refreshCart(); }, [me]);

  return (
    <main className="page-wrap">
      <div className="empty-state">
        <div className="empty-state-icon">{ok ? <CircleCheck size={28} /> : <X size={28} />}</div>
        <h2>{ok ? 'Thanh toán thành công!' : 'Thanh toán không thành công'}</h2>
        <p>{MSG[code] || MSG['99']}</p>
        {ok && (
          <p>
            Mã giao dịch: <b>{q.get('ref')}</b><br />
            Số tiền: <b>{money(q.get('amount'))}</b>
            {q.get('bank') && <> · Ngân hàng: <b>{q.get('bank')}</b></>}
            {q.get('txn') && <> · Mã GD VNPAY: <b>{q.get('txn')}</b></>}
          </p>
        )}
        {!ok && <p>Các sản phẩm đã được trả lại giỏ hàng của bạn, bạn có thể đặt lại.</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="button button-green" onClick={() => go('mine/buy')}>Xem đơn hàng của tôi</button>
          <button className="button button-outline" onClick={() => go(ok ? 'home' : 'cart')}>{ok ? 'Tiếp tục mua sắm' : 'Quay lại giỏ hàng'}</button>
        </div>
      </div>
    </main>
  );
}
