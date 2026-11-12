import { useState, useEffect } from 'react';
import { ArrowRight, ImagePlus, PackagePlus, Plus, ShieldCheck, ShoppingCart, Sparkles, Trash2, Upload, Check, X } from 'lucide-react';
import { api } from './api';
import { useApp, LOCS, money, ago, Thumb } from './lib.jsx';

const ST = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', completed: 'Hoàn tất', cancelled: 'Đã hủy' };
const ST_CLASS = { pending: 'status-pending', confirmed: 'status-info', shipping: 'status-info', completed: '', cancelled: 'status-cancelled' };
const Pill = ({ cls = '', children }) => <span className={'status-pill ' + cls}><i />{children}</span>;

const Need = () => {
  const { go } = useApp();
  return (
    <main className="page-wrap">
      <div className="empty-state"><div className="empty-state-icon"><ShieldCheck size={24} /></div><h2>Vui lòng đăng nhập</h2><p>Bạn cần đăng nhập để sử dụng tính năng này.</p><button className="button button-green" onClick={() => go('auth')}>Đăng nhập</button></div>
    </main>
  );
};
const Crumb = ({ items }) => <div className="breadcrumb">{items.map((it, i) => <span key={i} style={{ display: 'contents' }}>{i > 0 && <span>/</span>}{i === items.length - 1 ? <strong>{it}</strong> : <span>{it}</span>}</span>)}</div>;
const Heading = ({ eyebrow, title, sub, action }) => (
  <div className="manage-heading"><div><div className="eyebrow section-eyebrow">{eyebrow}</div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{action}</div>
);

/* ===== 1. GIỎ HÀNG & ĐẶT HÀNG ===== */
export function Cart() {
  const { me, go, toast, run, refreshCart } = useApp();
  const [items, setItems] = useState(null);
  const [f, setF] = useState({ shippingMethod: 'meet', payment: 'cod', recipientName: '', phone: '', address: '' });
  const load = () => api('/cart').then(x => { setItems(x); refreshCart(); }).catch(e => toast(e.message));
  useEffect(() => {
    if (me) { load(); setF(x => ({ ...x, recipientName: me.name || '', phone: me.phone || '', address: me.address || '' })); }
  }, [me]);
  if (!me) return <Need />;
  const fee = { meet: 0, standard: 30000, express: 50000 }[f.shippingMethod];
  const sub = (items || []).reduce((a, p) => a + p.price, 0);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  return (
    <main className="page-wrap manage-page">
      <Crumb items={['Mua sắm', 'Giỏ hàng']} />
      <Heading eyebrow="Sắp có chủ mới" title={`Giỏ hàng (${items ? items.length : 0})`} sub="Hệ thống tự động tách đơn theo từng người bán." />
      {!items ? <div className="loading-note">Đang tải giỏ hàng…</div>
        : !items.length ? <div className="empty-state"><div className="empty-state-icon"><ShoppingCart size={24} /></div><h2>Giỏ hàng đang trống</h2><p>Hãy chọn vài món đồ bạn yêu thích nhé.</p><button className="button button-green" onClick={() => go('browse')}>Khám phá ngay</button></div>
        : (
          <div className="cart-layout">
            <div className="cart-list">
              {items.map(p => (
                <div className="cart-item" key={p._id}>
                  <button className="cart-item-img" onClick={() => go('p/' + p._id)}><Thumb p={p} /></button>
                  <div className="cart-item-info"><strong>{p.title}</strong><span className="price">{money(p.price)}</span><small>Người bán: {p.seller?.name || 'Thành viên'}</small></div>
                  <button className="button button-outline button-sm" onClick={() => run(async () => { await api('/cart/' + p._id, { method: 'DELETE' }); load(); })}><Trash2 size={13} /> Xóa</button>
                </div>
              ))}
              <div className="form-card" style={{ marginTop: 6 }}>
                <div className="form-card-heading"><span className="form-step-number">01</span><div><h2>Thông tin đặt hàng</h2><p>Người bán sẽ liên hệ theo thông tin này.</p></div></div>
                <div className="form-fields">
                  <div className="form-field-row">
                    <label className="form-field"><span>Người nhận</span><input value={f.recipientName} onChange={set('recipientName')} placeholder="Họ tên người nhận" /></label>
                    <label className="form-field"><span>Số điện thoại</span><input value={f.phone} onChange={set('phone')} placeholder="Số điện thoại" /></label>
                  </div>
                  <div className="form-field-row">
                    <label className="form-field"><span>Hình thức nhận hàng</span>
                      <select value={f.shippingMethod} onChange={set('shippingMethod')}><option value="meet">Tự gặp trực tiếp (miễn phí)</option><option value="standard">Giao tiêu chuẩn (+30.000đ)</option><option value="express">Giao nhanh (+50.000đ)</option></select></label>
                    <label className="form-field"><span>Thanh toán</span>
                      <select value={f.payment} onChange={set('payment')}><option value="cod">Thanh toán khi nhận hàng (COD)</option><option value="bank">Chuyển khoản (mô phỏng)</option><option value="wallet">Ví điện tử (mô phỏng)</option></select></label>
                  </div>
                  {f.shippingMethod !== 'meet' && <label className="form-field"><span>Địa chỉ nhận hàng</span><input value={f.address} onChange={set('address')} placeholder="Số nhà, đường, phường/xã, quận/huyện…" /></label>}
                </div>
              </div>
            </div>
            <aside className="summary-card">
              <h2>Tóm tắt đơn hàng</h2>
              <div className="summary-line"><span>Tạm tính ({items.length} món)</span><span>{money(sub)}</span></div>
              <div className="summary-line"><span>Phí giao hàng</span><span>{fee ? money(fee) : 'Miễn phí'}</span></div>
              <div className="summary-total"><span>Tổng cộng</span><strong>{money(sub + fee)}</strong></div>
              <button className="button button-green button-block" onClick={() => run(async () => { await api('/orders', { method: 'POST', body: f }); await refreshCart(); toast('Đặt hàng thành công!'); go('orders'); })}>Xác nhận đặt hàng <ArrowRight size={16} /></button>
              <p className="detail-safe-note"><ShieldCheck size={13} /> Không thanh toán trước khi kiểm tra hàng.</p>
            </aside>
          </div>
        )}
    </main>
  );
}

/* ===== 2. ĐƠN MUA / ĐƠN BÁN + ĐÁNH GIÁ ===== */
export function Orders() {
  const { me, toast, run } = useApp();
  const [side, setSide] = useState('buyer'), [os, setOs] = useState(null), [rt, setRt] = useState({});
  const load = () => api('/orders?role=' + side).then(setOs).catch(e => toast(e.message));
  useEffect(() => { me && (setOs(null), load()); }, [me, side]);
  const st = (o, s) => run(async () => { await api(`/orders/${o._id}/status`, { method: 'PATCH', body: { status: s } }); toast('Đã cập nhật trạng thái đơn hàng'); load(); });
  const rate = o => run(async () => {
    const r = rt[o._id] || {};
    await api('/reviews', { method: 'POST', body: { orderId: o._id, rating: r.rating || 5, comment: r.comment || '' } });
    toast('Cảm ơn bạn đã đánh giá người bán!'); load();
  });
  if (!me) return <Need />;
  return (
    <main className="page-wrap manage-page">
      <Crumb items={['Tài khoản', 'Đơn hàng']} />
      <Heading eyebrow="Theo dõi hành trình" title="Đơn hàng của tôi" sub="Quản lý đơn bạn mua và đơn khách đặt từ bạn." />
      <section className="manage-list-card">
        <div className="manage-toolbar"><div className="manage-tabs">
          <button className={side === 'buyer' ? 'active' : ''} onClick={() => setSide('buyer')}>Đơn tôi mua</button>
          <button className={side === 'seller' ? 'active' : ''} onClick={() => setSide('seller')}>Đơn khách đặt mua</button>
        </div></div>
        <div className="stack admin-section">
          {!os ? <div className="loading-note">Đang tải đơn hàng…</div> : os.map(o => (
            <div className="order-card" key={o._id}>
              <div className="order-head"><strong>Mã đơn #{String(o._id).slice(-6)}</strong><Pill cls={ST_CLASS[o.status]}>{ST[o.status]}</Pill></div>
              <div className="order-meta">
                {side === 'buyer' ? `Người bán: ${o.seller?.name || ''} (@${o.seller?.username || ''})` : `Người mua: ${o.buyer?.name || ''} · SĐT: ${o.shipping?.phone || o.buyer?.phone || 'Chưa có'}`} · {ago(o.createdAt)}
              </div>
              {o.items.map((i, k) => <div className="order-item" key={k}><span>{i.title}</span><b>{money(i.price)}</b></div>)}
              <div className="order-meta" style={{ marginTop: 8 }}>Giao nhận: {o.shipping.method === 'meet' ? 'Gặp trực tiếp' : o.shipping.address} · Thanh toán: {o.payment.toUpperCase()} · Phí giao: {money(o.shipping.fee)}</div>
              <div className="order-total">Tổng thanh toán: {money(o.total)}</div>
              <div className="order-actions">
                {side === 'seller' && o.status === 'pending' && <><button className="button button-green button-sm" onClick={() => st(o, 'confirmed')}>Xác nhận đơn</button><button className="button button-danger button-sm" onClick={() => st(o, 'cancelled')}>Từ chối</button></>}
                {side === 'seller' && o.status === 'confirmed' && <><button className="button button-green button-sm" onClick={() => st(o, 'shipping')}>Bắt đầu giao hàng</button><button className="button button-danger button-sm" onClick={() => st(o, 'cancelled')}>Hủy đơn</button></>}
                {side === 'seller' && o.status === 'shipping' && <button className="button button-green button-sm" onClick={() => st(o, 'completed')}>Đánh dấu hoàn tất</button>}
                {side === 'buyer' && o.status === 'pending' && <button className="button button-danger button-sm" onClick={() => st(o, 'cancelled')}>Hủy đơn</button>}
                {side === 'buyer' && (o.status === 'shipping' || (o.status === 'confirmed' && o.shipping.method === 'meet')) && <button className="button button-green button-sm" onClick={() => st(o, 'completed')}>Đã nhận được hàng</button>}
              </div>
              {side === 'buyer' && o.status === 'completed' && (o.reviewed
                ? <div className="reviewed-note"><Check size={12} /> Bạn đã đánh giá đơn hàng này</div>
                : <div className="review-inline">
                    <select onChange={e => setRt({ ...rt, [o._id]: { ...rt[o._id], rating: +e.target.value } })}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}</select>
                    <input placeholder="Nhận xét về người bán…" onChange={e => setRt({ ...rt, [o._id]: { ...rt[o._id], comment: e.target.value } })} />
                    <button className="button button-outline button-sm" onClick={() => rate(o)}>Gửi đánh giá</button>
                  </div>)}
            </div>
          ))}
          {os && !os.length && <p className="muted-note" style={{ textAlign: 'center', padding: '30px 0' }}>Chưa có đơn hàng nào trong mục này.</p>}
        </div>
      </section>
    </main>
  );
}

/* ===== 3. ĐĂNG TIN / SỬA TIN ===== */
export function Post({ id }) {
  const { me, go, toast, run } = useApp();
  const [meta, setMeta] = useState({ categories: [], conditions: [] }), [files, setFiles] = useState([]);
  const [f, setF] = useState({ title: '', category: '', price: '', condition: '', percentNew: 90, location: LOCS[0], phone: '', description: '', imageUrls: '' });
  useEffect(() => {
    api('/categories').then(m => { setMeta(m); setF(x => ({ ...x, category: x.category || m.categories[0], condition: x.condition || m.conditions[1] })); }).catch(() => {});
    if (id) api('/my/products').then(l => {
      const p = l.find(x => x._id === id);
      if (p) setF({ title: p.title, category: p.category, price: p.price, condition: p.condition, percentNew: p.percentNew || 90, location: p.location || LOCS[0], phone: p.phone || '', description: p.description || '', imageUrls: (p.images || []).join('\n') });
    });
  }, [id]);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = e => {
    e.preventDefault();
    run(async () => {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      files.forEach(x => fd.append('images', x));
      await api(id ? '/products/' + id : '/products', { method: id ? 'PUT' : 'POST', form: fd });
      toast(me.role === 'admin' ? 'Đã đăng tin thành công!' : 'Đã gửi tin, chờ Quản trị viên duyệt');
      go('mine');
    });
  };
  if (!me) return <Need />;
  return (
    <main className="page-wrap create-page">
      <Crumb items={['Mua sắm', id ? 'Sửa tin' : 'Đăng bán']} />
      <div className="create-heading">
        <div><div className="eyebrow section-eyebrow">Bắt đầu một vòng đời mới</div><h1>{id ? 'Sửa tin đăng' : 'Đăng món đồ của bạn'}</h1><p>Chỉ vài phút để món đồ tốt tìm được chủ nhân tiếp theo.</p></div>
      </div>
      <form className="listing-form" onSubmit={submit}>
        <div className="listing-form-main">
          <section className="form-card">
            <div className="form-card-heading"><span className="form-step-number">01</span><div><h2>Ảnh sản phẩm</h2><p>Ảnh rõ nét giúp món đồ của bạn được chú ý hơn.</p></div></div>
            <label className="upload-zone" style={{ position: 'relative' }}>
              <input type="file" accept="image/*" multiple onChange={e => setFiles([...e.target.files].slice(0, 5))} />
              <span className="upload-icon"><ImagePlus size={24} /></span>
              <strong>{files.length ? `Đã chọn ${files.length} ảnh` : 'Kéo ảnh vào đây hoặc chọn từ thiết bị'}</strong>
              <small>Tối đa 5 ảnh · JPG, PNG · Tối đa 5MB / ảnh</small>
              <span className="upload-action"><Upload size={14} /> Chọn ảnh</span>
            </label>
            {files.length > 0 && <div className="upload-previews">{files.map((x, k) => <img key={k} src={URL.createObjectURL(x)} alt="" />)}</div>}
            <label className="form-field" style={{ marginTop: 16 }}><span>Hoặc dán link ảnh <small>(mỗi dòng một link)</small></span><textarea rows={2} value={f.imageUrls} onChange={set('imageUrls')} placeholder="https://example.com/anh1.jpg" /></label>
          </section>
          <section className="form-card">
            <div className="form-card-heading"><span className="form-step-number">02</span><div><h2>Thông tin món đồ</h2><p>Hãy mô tả chân thật để người mua dễ lựa chọn.</p></div></div>
            <div className="form-fields">
              <label className="form-field"><span>Tiêu đề sản phẩm <b>*</b></span><input required maxLength={120} value={f.title} onChange={set('title')} placeholder="VD: Bàn phím cơ Keychron K2 còn mới 95%" /></label>
              <div className="form-field-row">
                <label className="form-field"><span>Danh mục <b>*</b></span><select value={f.category} onChange={set('category')}>{meta.categories.map(c => <option key={c}>{c}</option>)}</select></label>
                <label className="form-field"><span>Tình trạng <b>*</b></span><select value={f.condition} onChange={set('condition')}>{meta.conditions.map(c => <option key={c}>{c}</option>)}</select></label>
              </div>
              <label className="form-field"><span>Độ mới ước tính: {f.percentNew}%</span><div className="range-row"><input type="range" min="10" max="100" step="5" value={f.percentNew} onChange={set('percentNew')} /></div></label>
              <label className="form-field"><span>Mô tả chi tiết</span><textarea rows={5} value={f.description} onChange={set('description')} placeholder="Tình trạng, phụ kiện, bảo hành… Mô tả rõ để người mua dễ chốt đơn." /></label>
            </div>
          </section>
          <section className="form-card">
            <div className="form-card-heading"><span className="form-step-number">03</span><div><h2>Giá bán & liên hệ</h2><p>Một mức giá hợp lý giúp bạn bán nhanh hơn.</p></div></div>
            <div className="form-fields">
              <div className="form-field-row">
                <label className="form-field"><span>Giá bán <b>*</b></span><div className="input-suffix"><input required type="number" min="0" step="1000" value={f.price} onChange={set('price')} placeholder="0" /><span>đ</span></div></label>
                <label className="form-field"><span>Khu vực</span><select value={f.location} onChange={set('location')}>{LOCS.map(c => <option key={c}>{c}</option>)}</select></label>
              </div>
              <label className="form-field"><span>Số điện thoại liên hệ</span><input type="tel" value={f.phone} onChange={set('phone')} placeholder={me.phone || '09xxxxxxxx'} /></label>
            </div>
          </section>
          <div className="form-footer"><p><ShieldCheck size={15} /> Đăng tin miễn phí. Tin sẽ được Admin duyệt trước khi hiển thị.</p><button className="button button-green form-submit" type="submit">{id ? 'Lưu thay đổi' : 'Đăng tin ngay'} <ArrowRight size={16} /></button></div>
        </div>
        <aside className="listing-aside">
          <div className="listing-tip-card"><span className="tip-spark"><Sparkles size={19} /></span><div className="eyebrow section-eyebrow">Mẹo đăng tin</div><h3>Ảnh đẹp, bán nhanh hơn</h3><p>Chụp món đồ ở nơi đủ sáng, nền gọn gàng. Đừng quên chụp cả những chi tiết nhỏ.</p><div className="tip-trust"><ShieldCheck size={16} /><span><strong>Giao dịch an toàn</strong><small>Không chia sẻ mã OTP hay mật khẩu.</small></span></div></div>
          <div className="listing-preview-note"><strong>Hành trình của món đồ</strong>
            <div><span>01</span><p><b>Bạn đăng tin</b><small>Thêm ảnh và thông tin rõ ràng</small></p></div>
            <div><span>02</span><p><b>Admin duyệt tin</b><small>Tin được hiển thị trên sàn</small></p></div>
            <div><span>03</span><p><b>Món đồ có chủ mới</b><small>Một lựa chọn tốt cho cả hai</small></p></div>
          </div>
        </aside>
      </form>
    </main>
  );
}

/* ===== ĐƠN KHÁCH ĐẶT MUA (trong Kênh người bán): xác nhận → đang giao → hoàn tất ===== */
function SellerOrders() {
  const { toast, run } = useApp();
  const [os, setOs] = useState(null), [flt, setFlt] = useState('all');
  const load = () => api('/orders?role=seller').then(setOs).catch(e => toast(e.message));
  useEffect(() => { load(); }, []);
  const st = (o, s) => run(async () => { await api(`/orders/${o._id}/status`, { method: 'PATCH', body: { status: s } }); toast('Đã cập nhật trạng thái đơn hàng'); load(); });
  const list = os || [];
  const cnt = k => list.filter(o => o.status === k).length;
  const shown = flt === 'all' ? list : list.filter(o => o.status === flt);
  const tabs = [['all', `Tất cả (${list.length})`], ...Object.keys(ST).map(k => [k, `${ST[k]} (${cnt(k)})`])];
  return (
    <section className="manage-list-card">
      <div className="manage-toolbar"><div className="manage-tabs admin-tabs">{tabs.map(([k, n]) => <button key={k} className={flt === k ? 'active' : ''} onClick={() => setFlt(k)}>{n}</button>)}</div></div>
      <div className="stack admin-section">
        {!os ? <div className="loading-note">Đang tải đơn hàng…</div> : shown.map(o => (
          <div className="order-card" key={o._id}>
            <div className="order-head"><strong>Mã đơn #{String(o._id).slice(-6)}</strong><Pill cls={ST_CLASS[o.status]}>{ST[o.status]}</Pill></div>
            <div className="order-meta">Người mua: {o.buyer?.name || ''} (@{o.buyer?.username || ''}) · SĐT: {o.shipping?.phone || o.buyer?.phone || 'Chưa có'} · {ago(o.createdAt)}</div>
            {o.items.map((i, k) => <div className="order-item" key={k}><span>{i.title}</span><b>{money(i.price)}</b></div>)}
            <div className="order-meta" style={{ marginTop: 8 }}>Người nhận: {o.shipping.recipientName || o.buyer?.name} · Giao nhận: {o.shipping.method === 'meet' ? 'Gặp trực tiếp' : o.shipping.address} · Thanh toán: {o.payment.toUpperCase()} · Phí giao: {money(o.shipping.fee)}</div>
            <div className="order-total">Tổng thanh toán: {money(o.total)}</div>
            <div className="order-actions">
              {o.status === 'pending' && <><button className="button button-green button-sm" onClick={() => st(o, 'confirmed')}>Xác nhận đơn</button><button className="button button-danger button-sm" onClick={() => st(o, 'cancelled')}>Từ chối</button></>}
              {o.status === 'confirmed' && <><button className="button button-green button-sm" onClick={() => st(o, 'shipping')}>Bắt đầu giao hàng</button><button className="button button-danger button-sm" onClick={() => st(o, 'cancelled')}>Hủy đơn</button></>}
              {o.status === 'shipping' && <button className="button button-green button-sm" onClick={() => st(o, 'completed')}>Đánh dấu hoàn tất</button>}
            </div>
          </div>
        ))}
        {os && !shown.length && <p className="muted-note" style={{ textAlign: 'center', padding: '30px 0' }}>Chưa có đơn khách đặt nào trong mục này.</p>}
      </div>
    </section>
  );
}

/* ===== 4. KÊNH NGƯỜI BÁN: hồ sơ + tin đã đăng ===== */
const LB = { pending: ['Chờ Admin duyệt', 'status-pending'], approved: ['Đang bán', ''], rejected: ['Bị từ chối', 'status-rejected'], reserved: ['Đang có khách đặt', 'status-info'], sold: ['Đã bán', 'status-sold'] };
export function Mine() {
  const { me, setMe, go, toast, run } = useApp();
  const [l, setL] = useState(null), [tab, setTab] = useState('all'), [view, setView] = useState('products');
  const [pf, setPf] = useState({ name: '', phone: '', email: '', address: '' });
  const load = () => api('/my/products').then(setL).catch(e => toast(e.message));
  useEffect(() => { if (me) { load(); setPf({ name: me.name || '', phone: me.phone || '', email: me.email || '', address: me.address || '' }); } }, [me]);
  const act = (fn, ok) => run(async () => { await fn(); ok && toast(ok); load(); });
  const saveProfile = e => { e.preventDefault(); run(async () => { setMe(await api('/me', { method: 'PUT', body: pf })); toast('Đã cập nhật hồ sơ cá nhân'); }); };
  if (!me) return <Need />;
  const list = l || [];
  const shown = tab === 'all' ? list : list.filter(p => p.status === tab);
  const cnt = s => list.filter(p => p.status === s).length;
  const tabs = [['all', `Tất cả (${list.length})`], ['approved', `Đang bán (${cnt('approved')})`], ['pending', `Chờ duyệt (${cnt('pending')})`], ['sold', `Đã bán (${cnt('sold')})`], ['rejected', `Bị từ chối (${cnt('rejected')})`]];
  const pset = k => e => setPf({ ...pf, [k]: e.target.value });

  return (
    <main className="page-wrap manage-page">
      <Crumb items={['Tài khoản', 'Kênh người bán']} />
      <Heading eyebrow="Góc quản lý của bạn" title="Quản lý tin đăng" sub={`Xin chào ${me.name} (@${me.username}) — quản lý tin đăng và đơn khách đặt mua.`}
        action={<button className="button button-green" onClick={() => go('post')}><PackagePlus size={16} /> Đăng món mới</button>} />
      <div className="manage-tabs" style={{ marginBottom: 16 }}>
        <button className={view === 'products' ? 'active' : ''} onClick={() => setView('products')}>Tin đăng của tôi</button>
        <button className={view === 'orders' ? 'active' : ''} onClick={() => setView('orders')}>Đơn khách đặt mua</button>
      </div>
      {view === 'orders' ? <SellerOrders /> : (<>
      <section className="manage-metrics">
        <div><small>Tổng tin đăng</small><strong>{list.length}</strong></div>
        <div><small>Đang bán</small><strong>{cnt('approved')}</strong></div>
        <div><small>Đã bán</small><strong>{cnt('sold')}</strong></div>
      </section>

      <section className="manage-list-card">
        <div className="manage-toolbar"><div className="manage-tabs admin-tabs">{tabs.map(([k, n]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{n}</button>)}</div></div>
        <div className="mine-head"><span>Sản phẩm</span><span>Giá bán</span><span>Trạng thái</span><span>Thao tác</span></div>
        {!l ? <div className="loading-note">Đang tải…</div> : shown.map(p => (
          <article className="mine-row" key={p._id}>
            <div className="manage-product" onClick={() => go('p/' + p._id)}>
              <div style={{ width: 52, height: 52, flex: 'none', borderRadius: 5, overflow: 'hidden' }}><Thumb p={p} /></div>
              <div><strong>{p.title}</strong><span>{p.category} · Độ mới {p.percentNew || 90}% {p.vip && '· ★ VIP'}</span></div>
            </div>
            <strong className="manage-price">{money(p.price)}</strong>
            <div><Pill cls={LB[p.status][1]}>{LB[p.status][0]}</Pill>{p.status === 'rejected' && p.rejectReason && <div className="reject-reason">Lý do: {p.rejectReason}</div>}</div>
            <div className="row-actions">
              {!['reserved', 'sold'].includes(p.status) && <button className="button button-outline button-sm" onClick={() => go('post/' + p._id)}>Sửa</button>}
              {p.status === 'approved' && <>
                <button className="button button-green button-sm" onClick={() => act(() => api(`/products/${p._id}/sold`, { method: 'PATCH' }), 'Đã đánh dấu Đã bán')}>Đã bán</button>
                <button className="button button-amber button-sm" onClick={() => confirm('Đẩy tin VIP 7 ngày (Demo miễn phí)?') && act(() => api(`/products/${p._id}/vip`, { method: 'POST', body: { days: 7 } }), 'Đã kích hoạt VIP 7 ngày')}>★ VIP</button>
              </>}
              {p.status !== 'reserved' && <button className="button button-danger button-sm" onClick={() => confirm('Xóa tin đăng này?') && act(() => api('/products/' + p._id, { method: 'DELETE' }), 'Đã xóa tin')}><Trash2 size={12} /></button>}
            </div>
          </article>
        ))}
        {l && !shown.length && <p className="muted-note" style={{ textAlign: 'center', padding: '36px 0' }}>Chưa có tin nào trong mục này.</p>}
      </section>

      </>)}

      <form className="form-card" style={{ marginTop: 22 }} onSubmit={saveProfile}>
        <div className="form-card-heading"><span className="form-step-number">★</span><div><h2>Hồ sơ của tôi</h2><p>Thông tin được dùng cho đơn hàng và liên hệ.</p></div></div>
        <div className="form-fields">
          <div className="form-field-row">
            <label className="form-field"><span>Họ và tên</span><input value={pf.name} onChange={pset('name')} /></label>
            <label className="form-field"><span>Số điện thoại</span><input value={pf.phone} onChange={pset('phone')} /></label>
          </div>
          <div className="form-field-row">
            <label className="form-field"><span>Email</span><input value={pf.email} onChange={pset('email')} /></label>
            <label className="form-field"><span>Địa chỉ</span><input value={pf.address} onChange={pset('address')} /></label>
          </div>
          <div><button className="button button-green" type="submit">Lưu hồ sơ</button></div>
        </div>
      </form>
    </main>
  );
}

/* ===== 5. ADMIN ===== */
export function Admin() {
  const { me, go, toast, run } = useApp();
  const [tab, setTab] = useState('stats'), [d, setD] = useState(null), [newCat, setNewCat] = useState('');
  const EP = { stats: '/admin/stats', pending: '/admin/pending', products: '/admin/products', categories: '/admin/categories', orders: '/admin/orders', reports: '/admin/reports', users: '/admin/users', logs: '/admin/logs' };
  const load = () => api(EP[tab]).then(setD).catch(e => toast(e.message));
  useEffect(() => { if (me && me.role === 'admin') load(); }, [me, tab]);
  const act = (fn, msg) => run(async () => { await fn(); msg && toast(msg); load(); });
  const reject = id => {
    const reason = prompt('Nhập lý do từ chối tin đăng này:', 'Thông tin hoặc hình ảnh chưa hợp lệ');
    if (reason) act(() => api('/admin/products/' + id, { method: 'PATCH', body: { status: 'rejected', rejectReason: reason } }), 'Đã từ chối tin đăng');
  };
  if (!me || me.role !== 'admin') return <main className="page-wrap"><div className="empty-state"><div className="empty-state-icon"><ShieldCheck size={24} /></div><h2>Chỉ dành cho Quản trị viên</h2><p>Bạn không có quyền truy cập trang này.</p></div></main>;
  const TABS = [['stats', 'Thống kê'], ['pending', 'Duyệt tin'], ['products', 'Tất cả tin'], ['categories', 'Danh mục'], ['orders', 'Đơn hàng'], ['reports', 'Báo cáo'], ['users', 'Người dùng'], ['logs', 'Nhật ký']];
  const arr = Array.isArray(d) ? d : [];
  const Item = ({ p, children }) => (
    <div className="admin-line">
      <div className="admin-thumb" onClick={() => go('p/' + p._id)}><Thumb p={p} /></div>
      <div className="grow">{children}</div>
    </div>
  );

  return (
    <main className="page-wrap manage-page">
      <Crumb items={['Tài khoản', 'Quản trị']} />
      <Heading eyebrow="Bảng điều khiển" title="Quản trị hệ thống" sub="Duyệt tin, quản lý danh mục, đơn hàng, báo cáo và người dùng." />
      <section className="manage-list-card">
        <div className="manage-toolbar"><div className="manage-tabs admin-tabs">{TABS.map(([k, n]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => { setD(null); setTab(k); }}>{n}</button>)}</div></div>
        <div className="admin-section">
          {!d ? <div className="loading-note">Đang tải dữ liệu…</div>

          : tab === 'stats' ? (
            <div className="admin-metrics">
              <div><small>Người dùng</small><strong>{d.users}</strong></div>
              <div><small>Tổng tin đăng</small><strong>{d.products}</strong></div>
              <div><small>Tin chờ duyệt</small><strong className="warn">{d.pending}</strong></div>
              <div><small>Tin đang bán</small><strong>{d.approved}</strong></div>
              <div><small>Tổng đơn hàng</small><strong>{d.orders}</strong></div>
              <div><small>Đơn hoàn tất</small><strong>{d.completedOrders}</strong></div>
              <div><small>Doanh số hoàn tất</small><strong style={{ fontSize: 20 }}>{money(d.revenue)}</strong></div>
              <div><small>Báo cáo đang mở</small><strong className="bad">{d.reports}</strong></div>
            </div>)

          : tab === 'pending' ? (<>
              <h3>Tin đang chờ duyệt ({arr.length})</h3>
              {arr.map(p => (
                <Item key={p._id} p={p}>
                  <strong>{p.title}</strong>
                  <p>{money(p.price)} · {p.category} · {p.condition} (Mới {p.percentNew || 90}%) · Người đăng: <b>{p.seller?.name}</b> (@{p.seller?.username})</p>
                  <p>{p.description}</p>
                  <div className="row-actions" style={{ marginTop: 8 }}>
                    <button className="button button-green button-sm" onClick={() => act(() => api('/admin/products/' + p._id, { method: 'PATCH', body: { status: 'approved' } }), 'Đã duyệt tin!')}><Check size={12} /> Duyệt hiển thị</button>
                    <button className="button button-danger button-sm" onClick={() => reject(p._id)}><X size={12} /> Từ chối</button>
                  </div>
                </Item>
              ))}</>)

          : tab === 'products' ? (<>
              <h3>Tất cả sản phẩm ({arr.length})</h3>
              {arr.map(p => (
                <Item key={p._id} p={p}>
                  <strong>{p.title}</strong> {p.vip && <Pill cls="status-pending">VIP</Pill>}
                  <p>{money(p.price)} · Trạng thái: <b>{p.status}</b> · {p.category} · Người bán: @{p.seller?.username}</p>
                  <div className="row-actions" style={{ marginTop: 8 }}>
                    {p.status !== 'approved' && <button className="button button-green button-sm" onClick={() => act(() => api('/admin/products/' + p._id, { method: 'PATCH', body: { status: 'approved' } }), 'Đã duyệt')}>Duyệt</button>}
                    {p.status !== 'rejected' && <button className="button button-outline button-sm" onClick={() => reject(p._id)}>Từ chối</button>}
                    <button className="button button-amber button-sm" onClick={() => act(() => api('/admin/products/' + p._id, { method: 'PATCH', body: { vip: !p.vip } }), 'Đã cập nhật VIP')}>{p.vip ? 'Tắt VIP' : '★ Bật VIP'}</button>
                    <button className="button button-danger button-sm" onClick={() => confirm('Xóa vĩnh viễn sản phẩm này?') && act(() => api('/products/' + p._id, { method: 'DELETE' }), 'Đã xóa sản phẩm')}><Trash2 size={12} /></button>
                  </div>
                </Item>
              ))}</>)

          : tab === 'categories' ? (<>
              <h3>Danh mục sản phẩm</h3>
              <div className="admin-form">
                <input placeholder="Nhập tên danh mục mới…" value={newCat} onChange={e => setNewCat(e.target.value)} />
                <button className="button button-green" onClick={() => act(async () => { await api('/admin/categories', { method: 'POST', body: { name: newCat } }); setNewCat(''); }, 'Đã thêm danh mục')}><Plus size={14} /> Thêm</button>
              </div>
              {arr.map(c => (
                <div className="admin-line" key={c._id}>
                  <div className="grow"><strong>{c.name}</strong></div>
                  <div className="row-actions">
                    <button className="button button-outline button-sm" onClick={() => { const name = prompt('Đổi tên danh mục:', c.name); if (name && name.trim()) act(() => api('/admin/categories/' + c._id, { method: 'PUT', body: { name } }), 'Đã đổi tên danh mục'); }}>Sửa tên</button>
                    <button className="button button-danger button-sm" onClick={() => confirm(`Xóa danh mục "${c.name}"?`) && act(() => api('/admin/categories/' + c._id, { method: 'DELETE' }), 'Đã xóa danh mục')}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}</>)

          : tab === 'orders' ? (<>
              <h3>Toàn bộ đơn hàng ({arr.length}) — chỉ xem</h3>
              {arr.map(o => (
                <div className="order-card" key={o._id} style={{ marginBottom: 12 }}>
                  <div className="order-head"><strong>Đơn #{String(o._id).slice(-6)}</strong><Pill cls={ST_CLASS[o.status]}>{ST[o.status]}</Pill></div>
                  <div className="order-meta">Người mua: <b>{o.buyer?.name}</b> (@{o.buyer?.username}) → Người bán: <b>{o.seller?.name}</b> (@{o.seller?.username})</div>
                  {o.items?.map((i, k) => <div className="order-item" key={k}><span>{i.title}</span><b>{money(i.price)}</b></div>)}
                  <div className="order-total">Tổng: {money(o.total)} · {o.payment?.toUpperCase()}</div>
                  <p className="muted-note" style={{ marginTop: 8 }}>Admin chỉ theo dõi đơn. Người bán là người xác nhận, giao hàng và hoàn tất đơn.</p>
                </div>
              ))}</>)

          : tab === 'reports' ? (<>
              <h3>Báo cáo vi phạm đang mở ({arr.length})</h3>
              {arr.map(r => (
                <div className="admin-line" key={r._id}>
                  <div className="grow"><strong>Lý do: {r.reason}</strong><p>Tin: <b>{r.product ? r.product.title : '(Đã xóa)'}</b> · Báo cáo bởi @{r.by?.username} {r.note}</p></div>
                  <div className="row-actions">
                    {r.product && <button className="button button-outline button-sm" onClick={() => go('p/' + r.product._id)}>Xem tin</button>}
                    <button className="button button-danger button-sm" onClick={() => act(() => api('/admin/reports/' + r._id, { method: 'PATCH', body: { action: 'remove' } }), 'Đã gỡ tin vi phạm')}>Gỡ tin</button>
                    <button className="button button-outline button-sm" onClick={() => act(() => api('/admin/reports/' + r._id, { method: 'PATCH', body: { action: 'dismiss' } }), 'Đã bỏ qua báo cáo')}>Bỏ qua</button>
                  </div>
                </div>
              ))}</>)

          : tab === 'users' ? (<>
              <h3>Người dùng ({arr.length})</h3>
              {arr.map(u => (
                <div className="admin-line" key={u._id}>
                  <div className="grow"><strong>{u.name}</strong> <span className="muted-note">@{u.username} · {u.phone || 'Chưa có SĐT'}</span>
                    <p>Vai trò: <b>{u.role.toUpperCase()}</b> · <Pill cls={u.banned ? 'status-rejected' : ''}>{u.banned ? 'Đã khóa' : 'Hoạt động'}</Pill></p></div>
                  {u._id !== me.id && <div className="row-actions">
                    <button className="button button-outline button-sm" onClick={() => act(() => api(`/admin/users/${u._id}/role`, { method: 'PATCH', body: { role: u.role === 'admin' ? 'user' : 'admin' } }), 'Đã đổi vai trò')}>{u.role === 'admin' ? 'Hạ xuống User' : 'Cấp quyền Admin'}</button>
                    <button className={'button button-sm ' + (u.banned ? 'button-green' : 'button-danger')} onClick={() => act(() => api(`/admin/users/${u._id}/ban`, { method: 'PATCH', body: { banned: !u.banned } }), u.banned ? 'Đã mở khóa' : 'Đã khóa tài khoản')}>{u.banned ? 'Mở khóa' : 'Khóa TK'}</button>
                  </div>}
                </div>
              ))}</>)

          : (<>
              <h3>Nhật ký hoạt động</h3>
              {arr.map(l => <div className="log-line" key={l._id}>{new Date(l.createdAt).toLocaleString('vi-VN')} · <b>@{l.actor}</b> · <code>{l.action}</code> · {l.ref} {l.data ? JSON.stringify(l.data) : ''}</div>)}</>)}
          {d && Array.isArray(d) && !d.length && <p className="muted-note" style={{ textAlign: 'center', padding: '30px 0' }}>Không có dữ liệu trong mục này.</p>}
        </div>
      </section>
    </main>
  );
}
