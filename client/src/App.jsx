import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight, ArrowUpRight, ArrowLeft, BadgeCheck, Check, ChevronDown, ChevronRight, CircleCheck, Flag, Heart, LogOut,
  Leaf, MapPin, Menu, PackageCheck, Phone, Plus, Recycle, Search, ShieldCheck, ShoppingBag,
  ShoppingCart, SlidersHorizontal, Sparkles, Star, Shirt, Truck, UserRound, X
} from 'lucide-react';
import { api } from './api';
import { Ctx, useApp, LOCS, money, ago, imgUrl, stars, Avatar, ProductCard, catIcon, CAT_COLORS } from './lib.jsx';
import { Cart, Orders, Post, Mine, Admin } from './Pages.jsx';

const SORTS = [['new', 'Mới nhất'], ['lo', 'Giá thấp đến cao'], ['hi', 'Giá cao đến thấp']];
const Brand = ({ className = '' }) => (
  <span className={'brand-lockup-inner ' + className}>
    <span className="brand-symbol"><span>C</span><i /></span>
    <span className="brand-name">Chợ Đồ Cũ<small>CŨ NGƯỜI MỚI TA</small></span>
  </span>
);

/* ================= TRANG CHỦ ================= */
function Home() {
  const { go, meta, pickCategory } = useApp();
  const [latest, setLatest] = useState({ items: [], total: 0 });
  useEffect(() => { api('/products?sort=new').then(setLatest).catch(() => {}); }, []);
  const arrivals = latest.items.slice(0, 4), popular = latest.items.slice(4, 8);

  return (
    <main className="home-page page-wrap">
      <section className="hero-card" aria-labelledby="hero-title">
        <img className="hero-image" src="/images/marketplace-hero.png" alt="Những món đồ tuyển chọn đang chờ một vòng đời mới" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span className="eyebrow-dot" />Chợ đồ cũ tử tế</div>
          <h1 id="hero-title">Món đồ cũ.<br /><em>Niềm vui mới.</em></h1>
          <p>Mua bán những món đồ có câu chuyện —<br className="desktop-break" /> dễ dàng, an tâm và có trách nhiệm hơn.</p>
          <div className="hero-actions">
            <button className="button button-coral" onClick={() => pickCategory('')}>Khám phá ngay <ArrowRight size={17} /></button>
            <button className="hero-link" onClick={() => go('post')}>Bắt đầu bán <ArrowUpRight size={16} /></button>
          </div>
          <div className="hero-proof"><span><strong>{latest.total}</strong> tin đang rao bán</span><span className="proof-star"><ShieldCheck size={14} /> Tin đã được duyệt</span></div>
        </div>
        <div className="hero-stamp"><Recycle size={18} /><span>Yêu đồ cũ<br /><strong>thêm một chút</strong></span></div>
      </section>

      <section className="trust-row" aria-label="Cam kết">
        <div className="trust-item"><span className="trust-icon"><ShieldCheck size={20} /></span><span><strong>Giao dịch an tâm</strong><small>Mọi tin đều được Admin duyệt</small></span></div>
        <div className="trust-divider" />
        <div className="trust-item"><span className="trust-icon"><CircleCheck size={20} /></span><span><strong>Món đồ đúng mô tả</strong><small>Có độ mới và đánh giá người bán</small></span></div>
        <div className="trust-divider" />
        <div className="trust-item"><span className="trust-icon"><Leaf size={20} /></span><span><strong>Mua sắm có ý thức</strong><small>Mỗi món đồ thêm một vòng đời</small></span></div>
      </section>

      <section className="section-block category-section">
        <div className="section-heading">
          <div><div className="eyebrow section-eyebrow">Tìm món đồ tiếp theo</div><h2>Khám phá danh mục</h2></div>
          <button className="text-link" onClick={() => pickCategory('')}>Tất cả danh mục <ArrowRight size={16} /></button>
        </div>
        <div className="category-grid">
          {meta.categories.slice(0, 6).map((c, i) => {
            const Icon = catIcon(c);
            return (
              <button className="category-tile" key={c} onClick={() => pickCategory(c)}>
                <span className="category-icon" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}><Icon size={23} strokeWidth={1.7} /></span>
                <span className="category-name">{c}</span>
                <span className="category-count">{(meta.counts?.[c] || 0).toLocaleString('vi-VN')} món</span>
                <ChevronRight className="category-arrow" size={15} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-block arrivals-section">
        <div className="section-heading">
          <div><div className="eyebrow section-eyebrow"><span className="live-dot" /> Vừa lên kệ</div><h2>Món mới, giá thật xinh</h2><p className="section-subtitle">Những phát hiện hay ho từ cộng đồng.</p></div>
          <button className="text-link" onClick={() => pickCategory('')}>Xem tất cả <ArrowRight size={16} /></button>
        </div>
        {arrivals.length
          ? <div className="product-grid home-product-grid">{arrivals.map(p => <ProductCard key={p._id} p={p} />)}</div>
          : <p className="muted-note">Chưa có tin nào được duyệt. Hãy là người đăng bán đầu tiên!</p>}
      </section>

      <section className="sell-banner">
        <div className="sell-banner-content">
          <span className="sell-kicker"><Sparkles size={14} /> Một vòng đời mới bắt đầu từ bạn</span>
          <h2>Tủ đồ gọn hơn.<br /><em>Ví tiền vui hơn.</em></h2>
          <p>Đăng món đồ bạn không còn dùng. Biết đâu, đó lại là món đồ ai đó đang tìm.</p>
          <button className="button button-light" onClick={() => go('post')}>Đăng bán miễn phí <ArrowRight size={16} /></button>
        </div>
        <div className="sell-banner-art" aria-hidden="true"><div className="sell-art-circle"><Shirt size={46} strokeWidth={1.2} /><span className="sell-art-spark"><Check size={18} /></span></div><div className="sell-art-note">đồ tốt<br />đi tiếp nhé</div></div>
      </section>

      {popular.length > 0 && (
        <section className="section-block popular-section">
          <div className="section-heading">
            <div><div className="eyebrow section-eyebrow">Được cộng đồng yêu thích</div><h2>Đồ tốt đang chờ chủ mới</h2></div>
            <button className="text-link" onClick={() => pickCategory('')}>Khám phá thêm <ArrowRight size={16} /></button>
          </div>
          <div className="product-grid home-product-grid">{popular.map(p => <ProductCard key={p._id} p={p} />)}</div>
        </section>
      )}

      <section className="community-strip">
        <div className="community-mark"><Heart size={18} fill="currentColor" /></div>
        <div><strong>Không chỉ là mua bán.</strong><span>Nơi những món đồ tốt tìm được một câu chuyện mới.</span></div>
        <button onClick={() => go('post')}>Đăng tin ngay <ArrowRight size={16} /></button>
      </section>
    </main>
  );
}

/* ================= MUA SẮM (có bộ lọc) ================= */
function Browse() {
  const { q, setQ, cat, pickCategory, meta, go } = useApp();
  const [d, setD] = useState(null), [page, setPage] = useState(1);
  const [f, setF] = useState({ location: '', min: '', max: '', condition: '', percentNew: '', sort: 'new' });
  const [price, setPrice] = useState({ min: '', max: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const set = o => { setF(x => ({ ...x, ...o })); setPage(1); };

  useEffect(() => { setPage(1); }, [cat, q]);
  useEffect(() => {
    const p = new URLSearchParams({ ...f, category: cat, q, page });
    [...p.keys()].forEach(k => !p.get(k) && p.delete(k));
    api('/products?' + p).then(setD).catch(() => setD({ items: [], total: 0 }));
  }, [f, cat, q, page]);

  const reset = () => { setF({ location: '', min: '', max: '', condition: '', percentNew: '', sort: 'new' }); setPrice({ min: '', max: '' }); setQ(''); pickCategory(''); };
  const activeCount = [f.location, f.min, f.max, f.condition, f.percentNew].filter(Boolean).length;
  const total = d?.total || 0;

  return (
    <main className="page-wrap browse-page">
      <div className="breadcrumb"><button onClick={() => go('home')}>Trang chủ</button><span>/</span><span>Mua sắm</span>{cat && <><span>/</span><strong>{cat}</strong></>}</div>
      <div className="listing-intro">
        <div>
          <div className="eyebrow section-eyebrow">Mỗi món đồ đều có câu chuyện</div>
          <h1>{cat || 'Khám phá đồ cũ hay'}</h1>
          <p>{q ? `Kết quả cho “${q}”` : 'Tìm thấy món đồ bạn cần, với mức giá dễ chịu hơn.'}</p>
        </div>
        <div className="listing-count"><strong>{total}</strong><span>tin đang rao bán</span></div>
      </div>

      <div className="browse-toolbar">
        <button className="filter-mobile" onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={16} /> Bộ lọc</button>
        <div className="filter-chips">
          <button className="filter-chip active" onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={14} /> Bộ lọc <span>{activeCount}</span></button>
          <button className="filter-chip" onClick={() => setFilterOpen(true)}>{f.condition || 'Tình trạng'} <ChevronDown size={14} /></button>
          <button className="filter-chip" onClick={() => setFilterOpen(true)}>{(f.min || f.max) ? 'Khoảng giá ✓' : 'Khoảng giá'} <ChevronDown size={14} /></button>
          <button className="filter-chip" onClick={() => setFilterOpen(true)}>{f.location || 'Khu vực'} <ChevronDown size={14} /></button>
        </div>
        <label className="sort-control">Sắp xếp
          <select value={f.sort} onChange={e => set({ sort: e.target.value })}>{SORTS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
          <ChevronDown size={14} />
        </label>
      </div>

      <div className="browse-layout">
        <aside className="filter-sidebar" style={filterOpen ? { display: 'block' } : undefined}>
          <div className="filter-sidebar-head"><strong>Bộ lọc</strong><button onClick={reset}>Đặt lại</button></div>
          <div className="filter-group"><h3>Danh mục</h3>
            {['', ...meta.categories].map(c => (
              <button key={c || 'all'} className={'filter-category' + (cat === c ? ' selected' : '')} onClick={() => pickCategory(c)}>
                {c || 'Tất cả'}<span>{(c ? (meta.counts?.[c] || 0) : Object.values(meta.counts || {}).reduce((a, b) => a + b, 0)).toLocaleString('vi-VN')}</span>
              </button>
            ))}
          </div>
          <div className="filter-group"><h3>Giá bán</h3>
            <div className="price-inputs">
              <input aria-label="Giá thấp nhất" placeholder="Từ" inputMode="numeric" value={price.min} onChange={e => setPrice({ ...price, min: e.target.value })} />
              <span>—</span>
              <input aria-label="Giá cao nhất" placeholder="Đến" inputMode="numeric" value={price.max} onChange={e => setPrice({ ...price, max: e.target.value })} />
            </div>
            <button className="filter-apply" onClick={() => set({ min: price.min, max: price.max })}>Áp dụng</button>
          </div>
          <div className="filter-group"><h3>Tình trạng</h3>
            {meta.conditions.map(c => (
              <label className="check-row" key={c}><input type="checkbox" checked={f.condition === c} onChange={() => set({ condition: f.condition === c ? '' : c })} /><span>{c}</span></label>
            ))}
          </div>
          <div className="filter-group"><h3>Độ mới</h3>
            <label className="location-select"><select aria-label="Độ mới" value={f.percentNew} onChange={e => set({ percentNew: e.target.value })}>
              <option value="">Mọi độ mới</option><option value="95">Từ 95% (Như mới)</option><option value="85">Từ 85% (Rất tốt)</option><option value="75">Từ 75% (Còn tốt)</option>
            </select><ChevronDown size={14} /></label>
          </div>
          <div className="filter-group"><h3>Khu vực</h3>
            <label className="location-select"><MapPin size={15} />
              <select aria-label="Chọn khu vực" value={f.location} onChange={e => set({ location: e.target.value })}><option value="">Toàn quốc</option>{LOCS.map(l => <option key={l}>{l}</option>)}</select>
              <ChevronDown size={14} />
            </label>
          </div>
          <div className="sidebar-assurance"><ShieldCheck size={16} /><span>Mọi tin đăng đều được Admin kiểm duyệt.</span></div>
        </aside>

        <section className="browse-results" aria-label="Danh sách sản phẩm">
          <div className="results-topline"><span>{total} kết quả phù hợp</span>
            <div><span className="active-filter">{cat || 'Tất cả danh mục'}{cat && <button onClick={() => pickCategory('')} aria-label="Xóa bộ lọc danh mục"><X size={12} /></button>}</span></div>
          </div>
          {!d ? <div className="loading-note">Đang tải sản phẩm…</div>
            : d.items.length ? <div className="product-grid browse-product-grid">{d.items.map(p => <ProductCard key={p._id} p={p} />)}</div>
            : <div className="empty-state"><div className="empty-state-icon"><PackageCheck size={24} /></div><h2>Chưa tìm thấy món đồ phù hợp</h2><p>Thử thay đổi từ khóa hoặc bộ lọc để khám phá thêm nhé.</p><button className="button button-green" onClick={reset}>Xóa bộ lọc</button></div>}
          {d && total > 20 && (
            <div className="pager">
              <button className="button button-outline button-sm" disabled={page < 2} onClick={() => setPage(page - 1)}><ArrowLeft size={14} /> Trang trước</button>
              <span>Trang {page} / {Math.ceil(total / 20)}</span>
              <button className="button button-outline button-sm" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Trang sau <ArrowRight size={14} /></button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ================= CHI TIẾT SẢN PHẨM ================= */
function Detail({ id }) {
  const { me, go, toast, run, need, favs, toggleFav, refreshCart, pickCategory } = useApp();
  const [d, setD] = useState(null), [i, setI] = useState(0), [rv, setRv] = useState([]);
  useEffect(() => {
    setD(null); setI(0); setRv([]);
    api('/products/' + id)
      .then(x => { setD(x); return api('/users/' + x.product.seller.username); })
      .then(u => setRv(u.reviews))
      .catch(e => toast(e.message));
  }, [id]);
  if (!d) return <main className="page-wrap"><div className="loading-note">Đang tải chi tiết sản phẩm…</div></main>;

  const p = d.product, s = p.seller, own = me && me.id === s._id, imgs = p.images || [];
  const sellable = !own && p.status === 'approved';
  const add = goCart => need() && run(async () => {
    await api('/cart/' + id, { method: 'POST' });
    await refreshCart();
    toast('Đã thêm vào giỏ hàng');
    if (goCart) go('cart');
  });
  const report = () => need() && run(async () => {
    const reason = prompt('Lý do báo cáo tin này (lừa đảo, hàng cấm, sai thông tin…)?');
    if (!reason) return;
    await api('/reports', { method: 'POST', body: { productId: id, reason } });
    toast('Đã gửi báo cáo cho Admin');
  });
  const isFav = favs.includes(p._id);
  const phone = p.phone || s.phone || '';

  return (
    <main className="page-wrap detail-page">
      <div className="breadcrumb"><button onClick={() => pickCategory('')}>Mua sắm</button><span>/</span><button onClick={() => pickCategory(p.category)}>{p.category}</button><span>/</span><strong>{p.title}</strong></div>
      <button className="back-link" onClick={() => history.back()}><ArrowLeft size={16} /> Quay lại</button>
      <div className="detail-layout">
        <section className="detail-gallery">
          <div className="detail-main-image">
            {imgs[i] ? <img src={imgUrl(imgs[i])} alt={p.title} /> : <div className="ph" style={{ minHeight: 420 }}>📦</div>}
            {imgs.length > 0 && <span className="detail-image-count">0{i + 1} <span>/ 0{imgs.length}</span></span>}
            <button className={'detail-heart' + (isFav ? ' is-favorite' : '')} onClick={() => toggleFav(p._id)} aria-label="Lưu sản phẩm"><Heart size={19} fill={isFav ? 'currentColor' : 'none'} /></button>
          </div>
          {imgs.length > 1 && <div className="detail-thumbnails">{imgs.map((x, k) => <button key={k} className={i === k ? 'selected' : ''} onClick={() => setI(k)} aria-label={'Ảnh ' + (k + 1)}><img src={imgUrl(x)} alt="" /></button>)}</div>}
          <div className="detail-description">
            <div className="detail-section-title"><h2>Mô tả sản phẩm</h2><span className="condition-pill">{p.condition}</span></div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{p.description || 'Người bán chưa thêm mô tả.'}</p>
            <div className="detail-attributes">
              <div><span>Danh mục</span><strong>{p.category}</strong></div>
              <div><span>Độ mới</span><strong>{p.percentNew || 90}%</strong></div>
              <div><span>Khu vực</span><strong>{p.location || '—'}</strong></div>
            </div>
          </div>
        </section>

        <aside className="detail-panel">
          <div className="detail-status"><span className="live-dot" /> {p.status === 'sold' ? 'Đã bán' : p.status === 'reserved' ? 'Đang có khách đặt' : p.status === 'pending' ? 'Đang chờ duyệt' : 'Đang được rao bán'} <span className="detail-listed">• {ago(p.createdAt)}</span></div>
          <h1>{p.title}</h1>
          <div className="detail-price">{money(p.price)}{p.originalPrice > p.price && <span>{money(p.originalPrice)}</span>}</div>
          {p.originalPrice > p.price
            ? <div className="detail-saving">Tiết kiệm {Math.round((1 - p.price / p.originalPrice) * 100)}% so với mua mới</div>
            : p.vip && <div className="detail-saving">★ Tin VIP</div>}

          <div className="seller-panel">
            <Avatar name={s.name} size={42} />
            <div className="seller-panel-info">
              <strong>{s.name} <BadgeCheck size={15} fill="currentColor" /></strong>
              <span>{d.seller.count ? <><Star size={13} fill="currentColor" /> {d.seller.avg} <i>·</i> {d.seller.count} đánh giá</> : 'Chưa có đánh giá'}</span>
              <small>Tham gia {new Date(s.createdAt).toLocaleDateString('vi-VN')}</small>
            </div>
            <button className="seller-profile-button" onClick={() => go('u/' + s.username)}>Xem trang</button>
          </div>

          <div className="detail-benefits">
            <div><ShieldCheck size={17} /><span><strong>Giao dịch an tâm</strong><small>Kiểm tra kỹ trước khi thanh toán</small></span></div>
            <div><Truck size={17} /><span><strong>Hỗ trợ giao hàng</strong><small>Tự gặp, giao tiêu chuẩn hoặc giao nhanh</small></span></div>
            <div><MapPin size={17} /><span><strong>{p.location || 'Toàn quốc'}</strong><small><a target="_blank" rel="noreferrer" href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.location || '')}>Xem khu vực trên Google Maps</a></small></span></div>
          </div>

          <button className="button button-green detail-message-button" disabled={!sellable} onClick={() => add(true)}><ShoppingBag size={17} /> Mua ngay</button>
          <button className="button button-outline detail-offer-button" disabled={!sellable} onClick={() => add(false)}><ShoppingCart size={17} /> Thêm vào giỏ</button>
          <a className="button button-outline detail-offer-button" href={'tel:' + phone}><Phone size={16} /> {phone ? 'Gọi ' + phone : 'Chưa có số điện thoại'}</a>
          <button className="link-btn" style={{ display: 'block', margin: '14px auto 0' }} onClick={report}><Flag size={11} /> Báo cáo tin này</button>
          <p className="detail-safe-note"><ShieldCheck size={13} /> Không thanh toán trước khi kiểm tra hàng.</p>
        </aside>
      </div>

      <section className="section-block profile-products" style={{ marginTop: 40 }}>
        <div className="section-heading"><div><div className="eyebrow section-eyebrow">Phản hồi từ người mua</div><h2>Đánh giá về người bán</h2></div></div>
        {rv.length ? (
          <div className="review-list">{rv.map(r => (
            <div className="review-card" key={r._id}><div className="review-stars">{stars(r.rating)}</div><p>“{r.comment || 'Giao dịch tốt'}”</p><span>— {r.from?.name || 'Ẩn danh'} · {ago(r.createdAt)}</span></div>
          ))}</div>
        ) : <p className="muted-note">Chưa có đánh giá nào.</p>}
      </section>

      {d.related.length > 0 && (
        <section className="section-block related-section">
          <div className="section-heading"><div><div className="eyebrow section-eyebrow">Có thể bạn cũng thích</div><h2>Món đồ cùng danh mục</h2></div><button className="text-link" onClick={() => pickCategory(p.category)}>Xem tất cả <ArrowRight size={16} /></button></div>
          <div className="product-grid home-product-grid">{d.related.map(r => <ProductCard key={r._id} p={{ ...r, seller: undefined }} />)}</div>
        </section>
      )}
    </main>
  );
}

/* ================= TRANG NGƯỜI BÁN ================= */
function User({ name }) {
  const { go, toast, me } = useApp();
  const [u, setU] = useState(null), [l, setL] = useState([]), [tab, setTab] = useState('Đang bán');
  useEffect(() => {
    setU(null);
    api('/users/' + name).then(setU).catch(e => toast(e.message));
    api('/products?seller=' + name).then(x => setL(x.items)).catch(() => {});
  }, [name]);
  if (!u) return <main className="page-wrap"><div className="loading-note">Đang tải…</div></main>;
  const own = !!me && me.username === u.user.username;
  return (
    <main className="page-wrap profile-page">
      {own
        ? <div className="breadcrumb"><span>Tài khoản</span><span>/</span><strong>Hồ sơ cá nhân</strong></div>
        : <div className="breadcrumb"><button onClick={() => go('home')}>Trang chủ</button><span>/</span><strong>Người bán</strong></div>}
      <section className="profile-cover"><div className="profile-cover-pattern" /><span className="profile-cover-label"><ShieldCheck size={15} /> Cộng đồng Chợ Đồ Cũ</span></section>
      <section className="profile-intro">
        <div className="profile-avatar-wrap"><Avatar name={u.user.name} size={96} /><span className="verified-badge"><Check size={12} /></span></div>
        <div className="profile-main-info">
          <h1>{u.user.name} <BadgeCheck size={19} fill="currentColor" /></h1>
          <p>@{u.user.username} <span>·</span> Thành viên từ {new Date(u.user.joined).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}</p>
          <div className="profile-rating"><Star size={15} fill="currentColor" /><strong>{u.count ? u.avg : '—'}</strong><span>({u.count} đánh giá)</span></div>
        </div>
        {own && <div className="profile-actions">
          <button className="button button-outline" onClick={() => go('mine')}>Quản lý tin đăng</button>
          <button className="button button-green" onClick={() => go('post')}>Đăng món mới</button>
        </div>}
      </section>
      <div className="profile-stats">
        <div><strong>{u.sold}</strong><span>Món đồ đã bán</span></div>
        <div><strong>{u.good}</strong><span>Đánh giá tốt</span></div>
        <div><strong>{l.length}</strong><span>Món đang bán</span></div>
        <div><strong>{u.count ? u.avg : '—'}</strong><span>Điểm đánh giá</span></div>
      </div>
      <section className="profile-about">
        <div>
          <div className="eyebrow section-eyebrow">Một chút về mình</div>
          <h2>Mình tin món đồ tốt xứng đáng có thêm một vòng đời.</h2>
          {u.user.bio
            ? <p>{u.user.bio}</p>
            : own && <p>Bạn chưa viết phần giới thiệu. Thêm ở Kênh người bán → Hồ sơ của tôi.</p>}
        </div>
        {(u.user.phone || u.user.hasEmail) && <div className="profile-promise"><span><ShieldCheck size={18} /></span><div><strong>Có thông tin liên hệ</strong><small>{u.user.phone && u.user.hasEmail ? 'Đã cung cấp số điện thoại & email' : u.user.phone ? 'Đã cung cấp số điện thoại' : 'Đã cung cấp email'}</small></div></div>}
      </section>
      <section className="section-block profile-products">
        <div className="section-heading"><div><div className="eyebrow section-eyebrow">Góc nhỏ của {u.user.name}</div><h2>Cửa hàng</h2></div></div>
        <div className="profile-tabs">{['Đang bán', 'Đánh giá'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}{t === 'Đang bán' ? ` (${l.length})` : ` (${u.count})`}</button>)}</div>
        {tab === 'Đánh giá'
          ? (u.reviews.length ? <div className="review-list">{u.reviews.map(r => <div className="review-card" key={r._id}><div className="review-stars">{stars(r.rating)}</div><p>“{r.comment || 'Giao dịch tốt'}”</p><span>— {r.from?.name} · {ago(r.createdAt)}</span></div>)}</div> : <p className="muted-note">Chưa có đánh giá nào.</p>)
          : (l.length ? <div className="product-grid home-product-grid">{l.map(p => <ProductCard key={p._id} p={p} />)}</div> : <p className="muted-note">Người bán chưa có tin nào đang bán.</p>)}
      </section>
    </main>
  );
}

/* ================= YÊU THÍCH ================= */
function Favorites() {
  const { favs, go } = useApp();
  const [items, setItems] = useState(null);
  useEffect(() => {
    Promise.all(favs.map(id => api('/products/' + id).then(x => x.product).catch(() => null)))
      .then(r => setItems(r.filter(Boolean)));
  }, []);
  return (
    <main className="page-wrap browse-page">
      <div className="breadcrumb"><button onClick={() => go('home')}>Trang chủ</button><span>/</span><strong>Yêu thích</strong></div>
      <div className="listing-intro"><div><div className="eyebrow section-eyebrow">Những món bạn đã lưu</div><h1>Danh sách yêu thích</h1><p>Lưu trên thiết bị này.</p></div><div className="listing-count"><strong>{favs.length}</strong><span>món đồ</span></div></div>
      {!items ? <div className="loading-note">Đang tải…</div>
        : items.length ? <div className="product-grid home-product-grid">{items.filter(p => favs.includes(p._id)).map(p => <ProductCard key={p._id} p={p} />)}</div>
        : <div className="empty-state"><div className="empty-state-icon"><Heart size={24} /></div><h2>Chưa có món đồ nào được lưu</h2><p>Bấm vào biểu tượng trái tim trên sản phẩm để lưu lại.</p><button className="button button-green" onClick={() => go('browse')}>Khám phá ngay</button></div>}
    </main>
  );
}

/* ================= ĐĂNG NHẬP / ĐĂNG KÝ ================= */
function Auth() {
  const { setMe, go, toast, run } = useApp();
  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ username: '', email: '', phone: '', password: '', name: '' });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = () => run(async () => {
    const r = await api('/auth/' + (reg ? 'register' : 'login'), { method: 'POST', body: f });
    localStorage.setItem('tk', r.token);
    setMe(r.user);
    toast('Xin chào ' + r.user.name);
    go(r.user.role === 'admin' ? 'admin' : 'home');
  });
  return (
    <main className="page-wrap">
      <div className="narrow-wrap">
        <div className="form-card">
          <div className="eyebrow section-eyebrow" style={{ marginBottom: 8 }}>{reg ? 'Tham gia cộng đồng' : 'Chào mừng trở lại'}</div>
          <h1>{reg ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
          <p className="muted-note" style={{ marginBottom: 18 }}>{reg ? 'Chỉ mất một phút để bắt đầu mua bán.' : 'Đăng nhập để mua, bán và quản lý đơn hàng.'}</p>
          <div className="form-fields">
            {reg && <>
              <label className="form-field"><span>Họ và tên <b>*</b></span><input value={f.name} onChange={set('name')} placeholder="Nguyễn Văn A" /></label>
              <div className="form-field-row">
                <label className="form-field"><span>Email</span><input type="email" value={f.email} onChange={set('email')} placeholder="email@gmail.com" /></label>
                <label className="form-field"><span>Số điện thoại</span><input value={f.phone} onChange={set('phone')} placeholder="0987654321" /></label>
              </div>
            </>}
            <label className="form-field"><span>{reg ? 'Tên đăng nhập' : 'Tên đăng nhập hoặc Email'} <b>*</b></span><input autoCapitalize="none" value={f.username} onChange={set('username')} placeholder="VD: nguoiban" /></label>
            <label className="form-field"><span>Mật khẩu <b>*</b></span><input type="password" value={f.password} onChange={set('password')} onKeyDown={e => e.key === 'Enter' && submit()} /></label>
            <button className="button button-green button-block" onClick={submit}>{reg ? 'Tạo tài khoản' : 'Đăng nhập'} <ArrowRight size={16} /></button>
          </div>
          <p className="switch-line">{reg ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button className="link-btn" onClick={() => setReg(!reg)}>{reg ? 'Đăng nhập ngay' : 'Đăng ký mới'}</button></p>
          <div className="demo-accounts">
            <b>Tài khoản test:</b><br />
            Admin: <code>admin</code> / <code>admin123</code><br />
            Người bán: <code>nguoiban</code> / <code>123456</code><br />
            Người mua: <code>nguoimua</code> / <code>123456</code>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ================= KHUNG ỨNG DỤNG ================= */
export default function App() {
  const [me, setMe] = useState(null), [route, setRoute] = useState(location.hash.slice(1) || 'home'), [msg, setMsg] = useState('');
  const [q, setQ] = useState(''), [qInput, setQInput] = useState(''), [cat, setCat] = useState('');
  const [meta, setMeta] = useState({ categories: [], conditions: [], counts: {} });
  const [menuOpen, setMenuOpen] = useState(false), [cartCount, setCartCount] = useState(0);
  const searchRef = useRef(null);
  useEffect(() => {
    const k = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); } };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, []);
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem('favs') || '[]'); } catch { return []; } });

  useEffect(() => {
    const f = () => { setRoute(location.hash.slice(1) || 'home'); setMenuOpen(false); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  useEffect(() => { api('/categories').then(setMeta).catch(() => {}); }, []);
  useEffect(() => { localStorage.getItem('tk') && api('/me').then(setMe).catch(() => localStorage.removeItem('tk')); }, []);
  useEffect(() => { try { localStorage.setItem('favs', JSON.stringify(favs)); } catch {} }, [favs]);

  const refreshCart = () => localStorage.getItem('tk')
    ? api('/cart').then(x => setCartCount(Array.isArray(x) ? x.length : 0)).catch(() => setCartCount(0))
    : Promise.resolve(setCartCount(0));
  useEffect(() => { refreshCart(); }, [me]);

  const go = r => { if (location.hash.slice(1) === r) { setRoute(r); } else { location.hash = r; } scrollTo({ top: 0 }); };
  const toast = m => { setMsg(m); setTimeout(() => setMsg(''), 2800); };
  const run = async f => { try { await f(); } catch (e) { toast(e.message); } };
  const need = () => { if (!me) { toast('Vui lòng đăng nhập'); go('auth'); return false; } return true; };
  const logout = () => { localStorage.removeItem('tk'); setMe(null); setCartCount(0); go('home'); };
  const toggleFav = id => {
    const has = favs.includes(id);
    setFavs(c => has ? c.filter(x => x !== id) : [...c, id]);
    toast(has ? 'Đã bỏ khỏi danh sách yêu thích.' : 'Đã lưu vào danh sách yêu thích.');
  };
  const pickCategory = c => { setCat(c); setQ(''); setQInput(''); go('browse'); };
  const submitSearch = e => { e.preventDefault(); setQ(qInput.trim()); setCat(''); go('browse'); };

  const [r, id] = route.split('/');
  const page = r === 'p' ? <Detail id={id} />
    : r === 'u' ? <User name={id} />
    : r === 'auth' ? <Auth />
    : r === 'cart' ? <Cart />
    : r === 'orders' ? <Orders />
    : r === 'mine' ? <Mine />
    : r === 'post' ? <Post id={id} key={id} />
    : r === 'admin' ? <Admin />
    : r === 'fav' ? <Favorites />
    : r === 'browse' ? <Browse />
    : <Home />;

  const ctx = useMemo(() => ({ me, setMe, go, toast, run, need, q, setQ, cat, pickCategory, meta, favs, toggleFav, refreshCart }), [me, q, cat, meta, favs]);

  const toastEl = msg && <div className="toast-message" role="status"><span><Heart size={15} fill="currentColor" /></span>{msg}<button onClick={() => setMsg('')} aria-label="Đóng"><X size={14} /></button></div>;

  // Trang quản trị dùng bố cục riêng (sidebar), không có header/footer của sàn
  if (r === 'admin' && me?.role === 'admin') return <Ctx.Provider value={ctx}><div className="marketplace-app adm-root"><Admin />{toastEl}</div></Ctx.Provider>;

  return (
    <Ctx.Provider value={ctx}>
      <div className="marketplace-app">
        <div className="announcement-bar">
          <span><span className="announcement-mark">C</span> Mỗi món đồ tốt đều xứng đáng có thêm một vòng đời.</span>
          <button onClick={() => pickCategory('')}>Khám phá ngay <ArrowRight size={13} /></button>
        </div>
        <header className="site-header">
          <div className="header-main page-wrap">
            <button className="brand-lockup" onClick={() => go('home')} aria-label="Chợ Đồ Cũ — về trang chủ"><Brand /></button>
            <form className="header-search" onSubmit={submitSearch}>
              <Search size={18} />
              <input ref={searchRef} value={qInput} onChange={e => setQInput(e.target.value)} placeholder="Tìm điện thoại, xe đạp, sách cũ…" aria-label="Tìm kiếm sản phẩm" />
              <kbd>⌘ K</kbd>
              <button type="submit" aria-label="Tìm kiếm"><ArrowRight size={16} /></button>
            </form>
            <div className="header-actions">
              <button className="header-icon-button" onClick={() => go('fav')} aria-label={`Yêu thích, ${favs.length} món`}><Heart size={19} /><span className="action-label">Yêu thích</span>{favs.length > 0 && <i>{favs.length}</i>}</button>
              <button className="header-icon-button" onClick={() => go('cart')} aria-label={`Giỏ hàng, ${cartCount} món`}><ShoppingCart size={19} /><span className="action-label">Giỏ hàng</span>{cartCount > 0 && <i>{cartCount}</i>}</button>
              <button className="header-icon-button" onClick={() => go(me ? 'u/' + me.username : 'auth')}><span className="user-round"><UserRound size={17} /></span><span className="action-label">{me ? me.name : 'Đăng nhập'}</span></button>
              {me && <button className="header-icon-button" onClick={logout} aria-label="Thoát"><LogOut size={18} /><span className="action-label">Thoát</span></button>}
              <button className="header-sell-button" onClick={() => need() && go('post')}><Plus size={16} /> Đăng bán</button>
            </div>
            <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
          <div className={'header-subnav page-wrap' + (menuOpen ? ' mobile-open' : '')}>
            <nav aria-label="Điều hướng chính">
              <button className={r === 'home' ? 'nav-active' : ''} onClick={() => go('home')}>Trang chủ</button>
              <button className={r === 'browse' && !cat ? 'nav-active' : ''} onClick={() => pickCategory('')}>Mua sắm</button>
              {meta.categories.slice(0, 4).map(c => <button key={c} className={r === 'browse' && cat === c ? 'nav-active' : ''} onClick={() => pickCategory(c)}>{c}</button>)}
              <button className={r === 'orders' ? 'nav-active' : ''} onClick={() => need() && go('orders')}>Đơn hàng</button>
              {me?.role === 'admin' && <button className={r === 'admin' ? 'nav-active' : ''} onClick={() => go('admin')}>Quản trị</button>}
            </nav>
            <button className="nav-sell-link" onClick={() => need() && go('mine')}><ShoppingBag size={15} /> Kênh người bán</button>
            <div className="mobile-nav-extras">
              <button onClick={() => go('fav')}><Heart size={16} /> Yêu thích</button>
              <button onClick={() => go('cart')}><ShoppingCart size={16} /> Giỏ hàng</button>
              <button onClick={() => need() && go('orders')}><PackageCheck size={16} /> Đơn hàng</button>
              {me && <button onClick={() => go('u/' + me.username)}><UserRound size={16} /> Hồ sơ cá nhân</button>}
              <button onClick={() => need() && go('mine')}><ShoppingBag size={16} /> Kênh người bán</button>
              {me?.role === 'admin' && <button onClick={() => go('admin')}><ShieldCheck size={16} /> Quản trị</button>}
              <button onClick={() => (me ? logout() : go('auth'))}><UserRound size={16} /> {me ? 'Đăng xuất' : 'Đăng nhập'}</button>
            </div>
          </div>
        </header>

        {page}

        <footer className="site-footer">
          <div className="footer-inner page-wrap">
            <div className="footer-brand">
              <button className="brand-lockup footer-lockup" onClick={() => go('home')}><Brand /></button>
              <p>Đồ tốt tìm đúng người.<br />Mua bán tử tế, sống xanh mỗi ngày.</p>
            </div>
            <div className="footer-links">
              <div><strong>Khám phá</strong><button onClick={() => pickCategory('')}>Mua sắm</button><button onClick={() => need() && go('post')}>Đăng bán</button><button onClick={() => go('fav')}>Yêu thích</button></div>
              <div><strong>Tài khoản</strong><button onClick={() => go(me ? 'u/' + me.username : 'auth')}>{me ? 'Hồ sơ của tôi' : 'Đăng nhập'}</button><button onClick={() => need() && go('orders')}>Đơn hàng</button><button onClick={() => go('cart')}>Giỏ hàng</button></div>
            </div>
            <div className="footer-newsletter">
              <strong>Ở lại cùng chúng tôi</strong><p>Nhận tin về những món đồ hay ho mỗi tuần.</p>
              <form onSubmit={e => { e.preventDefault(); toast('Cảm ơn bạn đã đăng ký nhận tin!'); e.target.reset(); }}><input type="email" required placeholder="Email của bạn" aria-label="Email đăng ký nhận tin" /><button aria-label="Đăng ký nhận tin"><ArrowRight size={16} /></button></form>
            </div>
          </div>
          <div className="footer-bottom page-wrap"><span>© {new Date().getFullYear()} Chợ Đồ Cũ. Một vòng đời mới.</span><span><span className="footer-dot" /> Được làm với sự tử tế</span></div>
        </footer>

        <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh">
          <button className={r === 'home' ? 'active' : ''} onClick={() => go('home')}><span>⌂</span>Trang chủ</button>
          <button className={r === 'browse' ? 'active' : ''} onClick={() => pickCategory('')}><Search size={19} />Khám phá</button>
          <button className="mobile-post-button" onClick={() => need() && go('post')}><span><Plus size={18} /></span>Đăng bán</button>
          <button className={(r === 'u' && me && id === me.username) || r === 'mine' || r === 'auth' ? 'active' : ''} onClick={() => go(me ? 'u/' + me.username : 'auth')}><UserRound size={19} />Cá nhân</button>
        </nav>

        {toastEl}
      </div>
    </Ctx.Provider>
  );
}
