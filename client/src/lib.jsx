import { createContext, useContext } from 'react';
import { Heart, MapPin, ShieldCheck, Star, Shirt, Smartphone, Sofa, BookOpen, Bike, Laptop, PawPrint, Refrigerator, Package } from 'lucide-react';
import { API_BASE } from './api';

export const Ctx = createContext();
export const useApp = () => useContext(Ctx);
export const LOCS = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Khác'];

export const money = n => new Intl.NumberFormat('vi-VN').format(Number(n || 0)) + 'đ';

export const ago = t => {
  const m = Math.max(1, ((Date.now() - new Date(t)) / 6e4) | 0);
  return m < 60 ? m + ' phút trước' : m < 1440 ? ((m / 60) | 0) + ' giờ trước' : ((m / 1440) | 0) + ' ngày trước';
};

export const imgUrl = u => {
  if (!u) return '';
  if (/^(https?:|data:|blob:)/.test(u)) return u;
  if (u.startsWith('/uploads/')) return API_BASE + u;
  return '/assets/' + u.replace(/^\/?assets\//, '');
};

// Icon theo tên danh mục (khớp từ khóa, nếu không khớp dùng icon hộp)
export const catIcon = name => {
  const n = (name || '').toLowerCase();
  if (/xe|cộ/.test(n)) return Bike;
  if (/điện thoại/.test(n)) return Smartphone;
  if (/điện tử|laptop|máy/.test(n)) return Laptop;
  if (/gia dụng/.test(n)) return Refrigerator;
  if (/thời trang|áo|quần|giày/.test(n)) return Shirt;
  if (/nội thất|nhà/.test(n)) return Sofa;
  if (/thú cưng/.test(n)) return PawPrint;
  if (/sách|học/.test(n)) return BookOpen;
  return Package;
};
export const CAT_COLORS = ['#f2e9dc', '#e5ede5', '#f2e9dc', '#ece9e1', '#e5ede5', '#f3e8df'];

export const Thumb = ({ p }) => p.images && p.images[0]
  ? <img src={imgUrl(p.images[0])} alt={p.title || ''} loading="lazy" />
  : <div className="ph"><Package size={30} strokeWidth={1.3} /></div>;

export const stars = n => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0));

export const initials = name => (name || '?').trim().split(/\s+/).slice(-1)[0].charAt(0).toUpperCase();

// Avatar chữ cái (backend chưa có ảnh đại diện)
export const Avatar = ({ name, size = 26 }) => (
  <span className="avatar-letter" style={{ width: size, height: size, fontSize: size * 0.42 }}>{initials(name)}</span>
);

// Thẻ sản phẩm – giao diện market-pulse, dữ liệu từ API
export function ProductCard({ p, compact = false }) {
  const { go, favs, toggleFav } = useApp();
  const isFav = favs.includes(p._id);
  return (
    <article className={'product-card' + (compact ? ' product-card-compact' : '')}>
      <button className="product-card-image" onClick={() => go('p/' + p._id)} aria-label={'Xem ' + p.title}>
        <Thumb p={p} />
        <span className="product-condition">Mới {p.percentNew || 90}%</span>
        {p.vip && <span className="product-vip">★ VIP</span>}
      </button>
      <button
        className={'favorite-button' + (isFav ? ' is-favorite' : '')}
        onClick={() => toggleFav(p._id)}
        aria-label={isFav ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
        aria-pressed={isFav}
      >
        <Heart size={17} fill={isFav ? 'currentColor' : 'none'} />
      </button>
      <div className="product-card-content">
        <button className="product-title" onClick={() => go('p/' + p._id)}>{p.title}</button>
        <div className="product-price-row"><strong>{money(p.price)}</strong></div>
        <div className="product-card-meta">
          <span><MapPin size={13} />{p.location || 'Toàn quốc'}</span>
          <span>{ago(p.createdAt)}</span>
        </div>
        {!compact && p.seller?.name && (
          <div className="seller-mini"><Avatar name={p.seller.name} size={20} /><span>{p.seller.name}</span><ShieldCheck size={14} aria-label="Người bán" /></div>
        )}
      </div>
    </article>
  );
}

export const Stars = ({ avg, count }) => (
  count
    ? <span><Star size={13} fill="currentColor" /> {avg} <i>·</i> {count} đánh giá</span>
    : <span>Chưa có đánh giá</span>
);
