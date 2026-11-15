import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  LayoutDashboard, PackageCheck, ClipboardList, Ticket, Percent, Star, FileCheck2, Store, Users, Wallet,
  ShieldAlert, Cpu, Network, Search, RefreshCw, LogOut, Banknote, ShoppingBag, Box, UserRound, Check, X,
  Trash2, Plus, ShieldCheck, ScrollText, ExternalLink, Menu, Pencil, TrendingUp, Lock
} from 'lucide-react';
import { api, API_BASE } from './api';
import { imgUrl } from './lib.jsx';

/* ================= helpers ================= */
const vnd = n => new Intl.NumberFormat('vi-VN').format(Number(n || 0)) + ' ₫';
const num = n => new Intl.NumberFormat('vi-VN').format(Number(n || 0));
const dt = t => new Date(t).toLocaleString('vi-VN', { hour12: false });
const day = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const short = id => String(id).slice(-6).toUpperCase();
const norm = s => String(s || '').toLowerCase();

const P_ST = { pending: ['Chờ duyệt', 'warn'], approved: ['Đang bán', 'ok'], rejected: ['Bị từ chối', 'bad'], reserved: ['Đang giữ chỗ', 'info'], sold: ['Đã bán', 'mute'] };
const O_ST = { pending: ['Chờ xác nhận', 'warn'], confirmed: ['Đã xác nhận', 'info'], shipping: ['Đang giao', 'info'], completed: ['Hoàn tất', 'ok'], cancelled: ['Đã hủy', 'bad'] };

const NAV = [
  ['Tổng quan', [['dashboard', 'Tổng Quan Dashboard', LayoutDashboard]]],
  ['Vận hành thương mại', [
    ['products', 'Kiểm Duyệt Sản Phẩm', PackageCheck, 'pending'],
    ['orders', 'Quản Lý Đơn Hàng', ClipboardList],
    ['vouchers', 'Khuyến Mãi & Voucher', Ticket],
    ['fees', 'Phí Sàn & Hoa Hồng', Percent],
    ['reviews', 'Quản Lý Đánh Giá', Star]
  ]],
  ['Đối tác & người dùng', [
    ['sellerReq', 'Duyệt Đơn Nhà Bán', FileCheck2],
    ['sellers', 'Quản Lý Nhà Bán', Store],
    ['users', 'Quản Lý Người Dùng', Users]
  ]],
  ['Hệ thống & tài chính', [
    ['finance', 'Tài Chính Sàn (GMV)', Wallet],
    ['disputes', 'Khiếu Nại Đơn Hàng', ShieldAlert, 'reports'],
    ['inventory', 'Tồn Kho & Danh Mục', Cpu],
    ['categories', 'Quản Lý Danh Mục', Network],
    ['logs', 'Nhật Ký Hệ Thống', ScrollText]
  ]]
];
const TITLES = Object.fromEntries(NAV.flatMap(([, items]) => items.map(i => [i[0], i[1]])));

/* ================= small UI ================= */
const PILL = { ok: '', warn: 'status-pending', bad: 'status-rejected', info: 'status-info', mute: 'status-sold' };
const Pill = ({ tone = 'mute', children }) => <span className={'status-pill ' + (PILL[tone] ?? '')}><i />{children}</span>;
const Empty = ({ icon: Icon = Box, title, children }) => (
  <div className="empty"><span><Icon size={22} /></span><h3>{title}</h3>{children && <p>{children}</p>}</div>
);
const BTN = { primary: 'button-green', success: 'button-green', ghost: 'button-outline', danger: 'button-danger', 'danger-o': 'button-danger' };
const Btn = ({ tone = 'ghost', size, icon: Icon, children, ...p }) => (
  <button className={`button ${BTN[tone] || 'button-outline'}${size ? ' button-' + size : ''}`} {...p}>{Icon && <Icon size={14} />}{children}</button>
);
const Card = ({ title, sub, right, children, className = '' }) => (
  <section className={'card ' + className}>
    {(title || right) && <header className="card-head"><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{right}</header>}
    {children}
  </section>
);
const Chips = ({ value, onChange, items }) => (
  <div className="chips">{items.map(([k, n, c]) => (
    <button key={k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{n}{c != null && <b>{c}</b>}</button>
  ))}</div>
);
const Thumb = ({ p }) => (
  <div className="thumb">{p.images?.[0] ? <img src={imgUrl(p.images[0])} alt="" loading="lazy" /> : <Box size={18} />}</div>
);
const Avatar = ({ name }) => <span className="avatar">{(name || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase()}</span>;

function Kpi({ label, value, icon: Icon, color, foot, footRight, hero, valueSize }) {
  return (
    <article className={'kpi' + (hero ? ' kpi-hero' : '')}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon" style={{ background: color }}><Icon size={22} /></span>
      </div>
      <strong className="kpi-value" style={valueSize ? { fontSize: valueSize } : null}>{value}</strong>
      <div className="kpi-foot">{foot}<small>{footRight}</small></div>
    </article>
  );
}

/* Biểu đồ cột doanh thu theo ngày (30 ngày gần nhất, đơn hoàn tất) */
function RevenueChart({ orders }) {
  const days = useMemo(() => {
    const out = [], map = {};
    (orders || []).filter(o => o.status === 'completed').forEach(o => { const k = day(o.createdAt); map[k] = (map[k] || 0) + (o.total || 0); });
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      out.push({ d, v: map[day(d)] || 0 });
    }
    return out;
  }, [orders]);
  const max = Math.max(...days.map(x => x.v), 1);
  return (
    <div className="chart" role="img" aria-label="Biểu đồ doanh thu 30 ngày">
      <div className="chart-bars">
        {days.map((x, i) => (
          <div className="bar-col" key={i} title={`${x.d.toLocaleDateString('vi-VN')}: ${vnd(x.v)}`}>
            <span className={'bar' + (x.v ? '' : ' bar-zero')} style={x.v ? { height: Math.max(6, (x.v / max) * 100) + '%' } : null} />
          </div>
        ))}
      </div>
      <div className="chart-axis"><span>{days[0].d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span><span>Hôm nay</span></div>
    </div>
  );
}

/* Hộp thoại nhập liệu (thay cho prompt()) */
function AskModal({ cfg, onClose }) {
  const [v, setV] = useState(cfg.initial || '');
  const ok = () => { if (cfg.required && !v.trim()) return; cfg.onOk(v.trim()); onClose(); };
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <h3>{cfg.title}</h3>
        {cfg.multiline
          ? <textarea autoFocus rows={4} value={v} onChange={e => setV(e.target.value)} placeholder={cfg.placeholder} />
          : <input autoFocus value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && ok()} placeholder={cfg.placeholder} />}
        <div className="modal-actions"><Btn onClick={onClose}>Hủy</Btn><Btn tone={cfg.danger ? 'danger' : 'primary'} onClick={ok}>{cfg.okLabel || 'Xác nhận'}</Btn></div>
      </div>
    </div>
  );
}

/* ================= đăng nhập admin ================= */
function Login({ onLogin }) {
  const [f, setF] = useState({ username: '', password: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await api('/auth/login', { method: 'POST', body: f });
      if (r.user.role !== 'admin') throw new Error('Tài khoản này không có quyền quản trị');
      localStorage.setItem('tk', r.token); onLogin(r.user);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand brand-lg"><span className="brand-mark"><ShieldCheck size={22} /></span><div><b>NO MALL</b><small>ADMIN CONSOLE</small></div></div>
        <h1>Đăng nhập quản trị</h1>
        <p>Khu vực dành riêng cho Quản trị viên sàn.</p>
        <label>Tên đăng nhập<input autoFocus value={f.username} onChange={e => setF({ ...f, username: e.target.value })} placeholder="admin" /></label>
        <label>Mật khẩu<input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} placeholder="••••••••" /></label>
        {err && <div className="form-err">{err}</div>}
        <Btn tone="primary" type="submit" icon={Lock} disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</Btn>
      </form>
    </div>
  );
}

/* ================= ỨNG DỤNG ================= */
export default function AdminApp() {
  const [me, setMe] = useState(null), [ready, setReady] = useState(false);
  const [page, setPage] = useState(() => location.hash.slice(1) || 'dashboard');
  const [data, setData] = useState(null), [loading, setLoading] = useState(false);
  const [q, setQ] = useState(''), [toastMsg, setToast] = useState(''), [ask, setAsk] = useState(null), [navOpen, setNavOpen] = useState(false);
  const searchRef = useRef(null), toastT = useRef(null);

  const toast = m => { setToast(m); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (!localStorage.getItem('tk')) return setReady(true);
    api('/me').then(u => { if (u.role === 'admin') { setMe(u); toast('Xin chào ' + u.name + '!'); } }).catch(() => localStorage.removeItem('tk')).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    const h = () => { setPage(location.hash.slice(1) || 'dashboard'); setQ(''); setNavOpen(false); };
    addEventListener('hashchange', h); return () => removeEventListener('hashchange', h);
  }, []);
  useEffect(() => {
    const k = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); } };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const g = p => api(p).catch(() => null);
    const [stats, products, orders, users, reports, categories, logs, reviews] = await Promise.all(
      ['/admin/stats', '/admin/products', '/admin/orders', '/admin/users', '/admin/reports', '/admin/categories', '/admin/logs', '/admin/reviews'].map(g)
    );
    setData({ stats: stats || {}, products: products || [], orders: orders || [], users: users || [], reports: reports || [], categories: categories || [], logs: logs || [], reviews });
    setLoading(false);
  }, []);
  useEffect(() => { if (me) load(); }, [me, load]);

  const act = async (fn, msg) => { try { await fn(); msg && toast(msg); await load(); } catch (e) { toast(e.message); } };
  const go = p => { location.hash = p; };
  const logout = () => { localStorage.removeItem('tk'); setMe(null); setData(null); };

  if (!ready) return <div className="boot">Đang tải…</div>;
  if (!me) return <Login onLogin={u => { setMe(u); toast('Xin chào ' + u.name + '!'); }} />;

  const pendingCount = data?.products.filter(p => p.status === 'pending').length || 0;
  const badges = { pending: pendingCount, reports: data?.reports.length || 0 };
  const ctx = { data, q, act, go, toast, setAsk, me };
  const View = { dashboard: Dashboard, products: Products, orders: Orders, vouchers: Vouchers, fees: Fees, reviews: Reviews, sellerReq: SellerReq, sellers: Sellers, users: UsersView, finance: Finance, disputes: Disputes, inventory: Inventory, categories: Categories, logs: Logs }[page] || Dashboard;
  const siteUrl = API_BASE.replace(':5000', ':5173');

  return (
    <div className="shell">
      <aside className={'side' + (navOpen ? ' open' : '')}>
        <div className="brand side-brand"><span className="brand-mark"><ShieldCheck size={22} /></span><b>NO MALL</b><em>ADMIN</em></div>
        <nav>
          {NAV.map(([group, items]) => (
            <div className="nav-group" key={group}>
              <div className="nav-title">{group}</div>
              {items.map(([key, label, Icon, badge]) => (
                <button key={key} className={'nav-item' + (page === key ? ' active' : '')} onClick={() => go(key)}>
                  <Icon size={18} /><span>{label}</span>
                  {badge && badges[badge] > 0 && <b className="nav-badge">{badges[badge]}</b>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot"><span className="dot" /> Hệ thống trực tuyến <code>API v1</code></div>
      </aside>
      {navOpen && <div className="side-scrim" onClick={() => setNavOpen(false)} />}

      <div className="main">
        <header className="top">
          <button className="icon-btn menu-btn" onClick={() => setNavOpen(true)} aria-label="Mở menu"><Menu size={20} /></button>
          <label className="search">
            <Search size={17} />
            <input ref={searchRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm kiếm trong mục hiện tại: người dùng, sản phẩm, đơn hàng…" />
            <kbd>⌘K</kbd>
          </label>
          <a className="top-link" href={siteUrl} target="_blank" rel="noreferrer"><ShoppingBag size={15} /> Về trang mua bán</a>
          <div className="top-user"><Avatar name={me.name} /><div><b>{me.name}</b><small>Quản trị viên</small></div></div>
          <button className="icon-btn" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={18} /></button>
        </header>

        <main className="content">
          {page !== 'dashboard' && <div className="page-head"><div><small>Admin / {TITLES[page]}</small><h1>{TITLES[page]}</h1></div></div>}
          {!data ? <div className="loading">Đang tải dữ liệu…</div> : <View {...ctx} loading={loading} reload={load} />}
        </main>
      </div>

      {ask && <AskModal cfg={ask} onClose={() => setAsk(null)} />}
      {toastMsg && <div className="toast" role="status">{toastMsg}<button onClick={() => setToast('')} aria-label="Đóng"><X size={16} /></button></div>}
    </div>
  );
}

/* ================= DASHBOARD ================= */
function Dashboard({ data, go, reload, loading }) {
  const { stats: s, products, orders, users } = data;
  const sellers = useMemo(() => new Set(products.map(p => p.seller?._id).filter(Boolean)).size, [products]);
  const onSale = products.filter(p => p.status === 'approved').length;
  const recent = orders.slice(0, 5);
  return (<>
    <section className="hero">
      <div>
        <span className="live"><i /> HỆ THỐNG GIÁM SÁT THỜI GIAN THỰC</span>
        <h1>Trung Tâm Điều Hành Toàn Sàn</h1>
        <p>Giám sát chỉ số KPI, hiệu suất thương mại, giao dịch GMV và an toàn vận hành nền tảng NO MALL B2C.</p>
      </div>
      <div className="hero-actions">
        <Btn icon={RefreshCw} onClick={reload} disabled={loading}>{loading ? 'Đang làm mới…' : 'Làm mới dữ liệu'}</Btn>
        <Btn tone="primary" icon={PackageCheck} onClick={() => go('products')}>Duyệt sản phẩm</Btn>
      </div>
    </section>

    <div className="kpi-grid">
      <Kpi hero label="Tổng doanh thu toàn sàn" value={vnd(s.revenue)} icon={Banknote} color="linear-gradient(135deg,#3f8564,#2f6b4f)"
        foot={<span className="tag tag-green"><TrendingUp size={13} /> GMV Tích Lũy</span>} footRight="Toàn bộ giao dịch hoàn tất" />
      <Kpi label="Tổng người dùng" value={num(s.users)} icon={Users} color="linear-gradient(135deg,#5b7f6a,#3f6350)"
        foot={<span className="tag tag-indigo"><Check size={13} /> {num(users.filter(u => !u.banned).length)} Hoạt động</span>} footRight="Khách hàng & Seller" />
      <Kpi label="Nhà bán hàng (Sellers)" value={num(sellers)} icon={Store} color="linear-gradient(135deg,#4f8f98,#357077)"
        foot={<span className="tag tag-cyan"><ShieldCheck size={13} /> {num(sellers)} Đang bán</span>} footRight="Người có tin đăng" />
      <Kpi label="Tổng sản phẩm" value={num(s.products)} icon={Box} color="linear-gradient(135deg,#d9a441,#b7791f)"
        foot={<span className="tag tag-amber">{num(onSale)} Đang bán</span>} footRight="SKU trong danh mục" />
      <Kpi label="Tổng đơn hàng" value={num(s.orders)} icon={ClipboardList} color="linear-gradient(135deg,#a07b4b,#85632f)"
        foot={<span className="tag tag-violet">{num(s.completedOrders)} Hoàn tất</span>} footRight="Lượt đặt mua" />
      <Kpi label="Tin chờ duyệt" value={num(s.pending)} icon={FileCheck2} color="linear-gradient(135deg,#d9695a,#c0392b)"
        foot={s.pending ? <span className="tag tag-amber">Cần xử lý</span> : <span className="tag tag-green"><Check size={13} /> Đã sạch hàng chờ</span>}
        footRight={<a className="link-red" onClick={() => go('products')}>Xem ngay ›</a>} />
    </div>

    <div className="grid-2">
      <Card title="Biểu Đồ Doanh Thu" sub="Doanh thu đơn hoàn tất 30 ngày gần nhất (VNĐ)" right={<span className="legend"><i /> Doanh thu (VNĐ)</span>}>
        <RevenueChart orders={orders} />
      </Card>
      <Card title="Cảnh Báo Vận Hành" sub="Các mục cần quản trị viên xử lý">
        <ul className="todo">
          <li onClick={() => go('products')}><span className="t-ic warn"><PackageCheck size={16} /></span><div><b>{s.pending || 0} tin chờ duyệt</b><small>Kiểm duyệt sản phẩm</small></div><em>›</em></li>
          <li onClick={() => go('disputes')}><span className="t-ic bad"><ShieldAlert size={16} /></span><div><b>{s.reports || 0} báo cáo vi phạm</b><small>Khiếu nại đang mở</small></div><em>›</em></li>
          <li onClick={() => go('orders')}><span className="t-ic info"><ClipboardList size={16} /></span><div><b>{orders.filter(o => o.status === 'pending').length} đơn chờ xác nhận</b><small>Người bán chưa xử lý</small></div><em>›</em></li>
          <li onClick={() => go('users')}><span className="t-ic mute"><UserRound size={16} /></span><div><b>{users.filter(u => u.banned).length} tài khoản bị khóa</b><small>Quản lý người dùng</small></div><em>›</em></li>
        </ul>
      </Card>
    </div>

    <Card title="Đơn Hàng Mới Nhất" right={<Btn size="sm" onClick={() => go('orders')}>Xem tất cả</Btn>}>
      {recent.length ? <OrderTable rows={recent} /> : <Empty title="Chưa có đơn hàng" />}
    </Card>
  </>);
}

/* ================= KIỂM DUYỆT SẢN PHẨM ================= */
function Products({ data, q, act, setAsk, go }) {
  const [st, setSt] = useState('pending');
  const rows = data.products.filter(p => (st === 'all' || p.status === st) && (!q || norm(p.title + p.category + p.seller?.name + p.seller?.username).includes(norm(q))));
  const cnt = k => data.products.filter(p => p.status === k).length;
  const patch = (id, body, msg) => act(() => api('/admin/products/' + id, { method: 'PATCH', body }), msg);
  const reject = p => setAsk({ title: 'Lý do từ chối tin đăng', multiline: true, required: true, initial: 'Thông tin hoặc hình ảnh chưa hợp lệ', okLabel: 'Từ chối', danger: true, onOk: v => patch(p._id, { status: 'rejected', rejectReason: v }, 'Đã từ chối tin đăng') });
  return (
    <Card right={<Chips value={st} onChange={setSt} items={[['pending', 'Chờ duyệt', cnt('pending')], ['approved', 'Đang bán', cnt('approved')], ['rejected', 'Từ chối', cnt('rejected')], ['all', 'Tất cả', data.products.length]]} />}>
      {!rows.length ? <Empty icon={PackageCheck} title="Không có sản phẩm nào">{st === 'pending' ? 'Hàng chờ duyệt đã sạch.' : 'Thử đổi bộ lọc hoặc từ khóa.'}</Empty> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Người bán</th><th>Trạng thái</th><th className="r">Thao tác</th></tr></thead>
          <tbody>{rows.map(p => (
            <tr key={p._id}>
              <td><div className="cell-prod"><Thumb p={p} /><div><b>{p.title}</b><small>{p.condition} · Mới {p.percentNew || 90}% {p.vip && <span className="vip">★ VIP</span>}</small>{p.rejectReason && p.status === 'rejected' && <small className="bad-t">Lý do: {p.rejectReason}</small>}</div></div></td>
              <td>{p.category}</td><td><b>{vnd(p.price)}</b></td>
              <td>{p.seller?.name}<small className="sub">@{p.seller?.username}</small></td>
              <td><Pill tone={P_ST[p.status]?.[1]}>{P_ST[p.status]?.[0] || p.status}</Pill></td>
              <td className="r"><div className="acts">
                {p.status !== 'approved' && <Btn tone="success" size="sm" icon={Check} onClick={() => patch(p._id, { status: 'approved' }, 'Đã duyệt tin')}>Duyệt</Btn>}
                {p.status !== 'rejected' && <Btn tone="danger-o" size="sm" icon={X} onClick={() => reject(p)}>Từ chối</Btn>}
                <Btn size="sm" onClick={() => patch(p._id, { vip: !p.vip }, 'Đã cập nhật VIP')}>{p.vip ? 'Tắt VIP' : '★ VIP'}</Btn>
                <Btn tone="danger-o" size="sm" icon={Trash2} aria-label="Xóa" onClick={() => confirm('Xóa vĩnh viễn sản phẩm này?') && act(() => api('/products/' + p._id, { method: 'DELETE' }), 'Đã xóa sản phẩm')} />
              </div></td>
            </tr>))}</tbody>
        </table></div>)}
    </Card>
  );
}

/* ================= ĐƠN HÀNG ================= */
function OrderTable({ rows }) {
  return (
    <div className="table-wrap"><table>
      <thead><tr><th>Mã đơn</th><th>Người mua</th><th>Người bán</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày đặt</th></tr></thead>
      <tbody>{rows.map(o => (
        <tr key={o._id}>
          <td><b>#{short(o._id)}</b></td>
          <td>{o.buyer?.name}<small className="sub">@{o.buyer?.username}</small></td>
          <td>{o.seller?.name}<small className="sub">@{o.seller?.username}</small></td>
          <td>{o.items?.map((i, k) => <div key={k} className="clip">{i.title}</div>)}</td>
          <td><b>{vnd(o.total)}</b></td><td>{String(o.payment || '').toUpperCase()}</td>
          <td><Pill tone={O_ST[o.status]?.[1]}>{O_ST[o.status]?.[0]}</Pill></td>
          <td>{dt(o.createdAt)}</td>
        </tr>))}</tbody>
    </table></div>
  );
}
function Orders({ data, q }) {
  const [st, setSt] = useState('all');
  const rows = data.orders.filter(o => (st === 'all' || o.status === st) && (!q || norm(short(o._id) + o.buyer?.name + o.buyer?.username + o.seller?.name + o.items?.map(i => i.title).join(' ')).includes(norm(q))));
  const cnt = k => data.orders.filter(o => o.status === k).length;
  return (
    <Card sub="Admin chỉ theo dõi. Người bán là người xác nhận, giao hàng và hoàn tất đơn."
      right={<Chips value={st} onChange={setSt} items={[['all', 'Tất cả', data.orders.length], ...Object.entries(O_ST).map(([k, [n]]) => [k, n, cnt(k)])]} />}>
      {rows.length ? <OrderTable rows={rows} /> : <Empty icon={ClipboardList} title="Không có đơn hàng phù hợp" />}
    </Card>
  );
}

/* ================= KHUYẾN MÃI & VOUCHER (chưa có backend) ================= */
function Vouchers() {
  return <Card><Empty icon={Ticket} title="Module Voucher chưa được xây dựng ở backend">
    Server hiện chưa có model/API voucher. Giao diện đã sẵn chỗ để gắn vào sau khi bạn thêm <code>Voucher</code> model và route <code>/admin/vouchers</code>.</Empty></Card>;
}

/* ================= PHÍ SÀN & HOA HỒNG ================= */
function Fees({ data }) {
  const [rate, setRate] = useState(() => { try { return Number(localStorage.getItem('feeRate')) || 5; } catch { return 5; } });
  useEffect(() => { try { localStorage.setItem('feeRate', rate); } catch {} }, [rate]);
  const done = data.orders.filter(o => o.status === 'completed');
  const by = useMemo(() => {
    const m = {};
    done.forEach(o => { const k = o.seller?._id; if (!k) return; m[k] = m[k] || { seller: o.seller, gmv: 0, n: 0 }; m[k].gmv += o.total || 0; m[k].n++; });
    return Object.values(m).sort((a, b) => b.gmv - a.gmv);
  }, [data.orders]);
  const gmv = done.reduce((a, o) => a + (o.total || 0), 0), fee = Math.round(gmv * rate / 100);
  return (<>
    <div className="kpi-grid kpi-grid-3">
      <Kpi label="GMV hoàn tất" value={vnd(gmv)} icon={Banknote} color="linear-gradient(135deg,#3f8564,#2f6b4f)" foot={<span className="tag tag-green">{done.length} đơn</span>} />
      <Kpi label={`Phí sàn ước tính (${rate}%)`} value={vnd(fee)} icon={Percent} color="linear-gradient(135deg,#5b7f6a,#3f6350)" foot={<span className="tag tag-indigo">Doanh thu nền tảng</span>} />
      <Kpi label="Người bán trả phí" value={num(by.length)} icon={Store} color="linear-gradient(135deg,#4f8f98,#357077)" foot={<span className="tag tag-cyan">Có đơn hoàn tất</span>} />
    </div>
    <Card title="Biểu phí hoa hồng" sub="Tỷ lệ chỉ dùng để ước tính tại trình duyệt này (backend chưa lưu cấu hình phí)."
      right={<label className="rate">Hoa hồng <input type="number" min="0" max="50" step="0.5" value={rate} onChange={e => setRate(Math.max(0, Math.min(50, Number(e.target.value))))} /> %</label>}>
      {by.length ? (
        <div className="table-wrap"><table>
          <thead><tr><th>Người bán</th><th className="r">Số đơn</th><th className="r">GMV</th><th className="r">Phí sàn ({rate}%)</th><th className="r">Thực nhận</th></tr></thead>
          <tbody>{by.map(x => (
            <tr key={x.seller._id}><td><b>{x.seller.name}</b><small className="sub">@{x.seller.username}</small></td><td className="r">{x.n}</td><td className="r">{vnd(x.gmv)}</td>
              <td className="r">{vnd(Math.round(x.gmv * rate / 100))}</td><td className="r"><b>{vnd(x.gmv - Math.round(x.gmv * rate / 100))}</b></td></tr>))}</tbody>
        </table></div>) : <Empty icon={Percent} title="Chưa có đơn hoàn tất để tính phí" />}
    </Card>
  </>);
}

/* ================= ĐÁNH GIÁ ================= */
function Reviews({ data, q, act }) {
  if (data.reviews == null) return <Card><Empty icon={Star} title="Chưa tải được đánh giá">Hãy cập nhật <code>server/routes.js</code> (đã thêm endpoint <code>GET /admin/reviews</code>) và khởi động lại server.</Empty></Card>;
  const rows = data.reviews.filter(r => !q || norm(r.comment + r.from?.name + r.to?.name).includes(norm(q)));
  const avg = data.reviews.length ? (data.reviews.reduce((a, r) => a + r.rating, 0) / data.reviews.length).toFixed(1) : '–';
  return (
    <Card title={`${data.reviews.length} đánh giá`} sub={`Điểm trung bình toàn sàn: ${avg} / 5`}>
      {!rows.length ? <Empty icon={Star} title="Chưa có đánh giá" /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Người đánh giá</th><th>Người bán</th><th>Điểm</th><th>Nội dung</th><th>Ngày</th><th className="r"></th></tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r._id}><td>{r.from?.name}</td><td>{r.to?.name}</td>
              <td><span className="stars">{'★'.repeat(r.rating)}<i>{'★'.repeat(5 - r.rating)}</i></span></td>
              <td className="wrap">{r.comment || <small className="sub">(không có nội dung)</small>}</td><td>{dt(r.createdAt)}</td>
              <td className="r"><Btn tone="danger-o" size="sm" icon={Trash2} aria-label="Xóa đánh giá" onClick={() => confirm('Xóa đánh giá này?') && act(() => api('/admin/reviews/' + r._id, { method: 'DELETE' }), 'Đã xóa đánh giá')} /></td></tr>))}</tbody>
        </table></div>)}
    </Card>
  );
}

/* ================= NHÀ BÁN ================= */
function sellerStats(data) {
  const m = {};
  const get = u => (m[u._id] = m[u._id] || { user: u, products: 0, pending: 0, approved: 0, orders: 0, gmv: 0 });
  data.products.forEach(p => { if (!p.seller?._id) return; const s = get(p.seller); s.products++; if (p.status === 'pending') s.pending++; if (p.status === 'approved') s.approved++; });
  data.orders.forEach(o => { if (!o.seller?._id) return; const s = get(o.seller); s.orders++; if (o.status === 'completed') s.gmv += o.total || 0; });
  return Object.values(m);
}
function SellerReq({ data, go }) {
  const rows = sellerStats(data).filter(s => s.pending > 0);
  return (
    <Card sub="Hệ thống không có đơn đăng ký bán riêng: ai cũng đăng bán được, admin duyệt từng tin. Đây là các người bán đang có tin chờ duyệt.">
      {!rows.length ? <Empty icon={FileCheck2} title="Đã sạch hàng chờ" /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Người bán</th><th>SĐT</th><th className="r">Tin chờ duyệt</th><th className="r">Tổng tin</th><th className="r"></th></tr></thead>
          <tbody>{rows.map(s => (
            <tr key={s.user._id}><td><div className="cell-user"><Avatar name={s.user.name} /><div><b>{s.user.name}</b><small>@{s.user.username}</small></div></div></td>
              <td>{s.user.phone || '—'}</td><td className="r"><Pill tone="warn">{s.pending}</Pill></td><td className="r">{s.products}</td>
              <td className="r"><Btn tone="primary" size="sm" onClick={() => go('products')}>Duyệt tin</Btn></td></tr>))}</tbody>
        </table></div>)}
    </Card>
  );
}
function Sellers({ data, q, act, me }) {
  const rows = sellerStats(data).filter(s => !q || norm(s.user.name + s.user.username).includes(norm(q))).sort((a, b) => b.gmv - a.gmv);
  const full = id => data.users.find(u => u._id === id);
  return (
    <Card title={`${rows.length} nhà bán`} sub="Người dùng có ít nhất một tin đăng hoặc đơn bán.">
      {!rows.length ? <Empty icon={Store} title="Chưa có nhà bán" /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Nhà bán</th><th className="r">Tin đăng</th><th className="r">Đang bán</th><th className="r">Đơn</th><th className="r">GMV</th><th>Trạng thái</th><th className="r"></th></tr></thead>
          <tbody>{rows.map(s => { const u = full(s.user._id); return (
            <tr key={s.user._id}><td><div className="cell-user"><Avatar name={s.user.name} /><div><b>{s.user.name}</b><small>@{s.user.username}</small></div></div></td>
              <td className="r">{s.products}</td><td className="r">{s.approved}</td><td className="r">{s.orders}</td><td className="r"><b>{vnd(s.gmv)}</b></td>
              <td>{u?.banned ? <Pill tone="bad">Đã khóa</Pill> : <Pill tone="ok">Hoạt động</Pill>}</td>
              <td className="r">{u && u._id !== me.id && <Btn size="sm" tone={u.banned ? 'success' : 'danger-o'} onClick={() => act(() => api(`/admin/users/${u._id}/ban`, { method: 'PATCH', body: { banned: !u.banned } }), u.banned ? 'Đã mở khóa' : 'Đã khóa tài khoản')}>{u.banned ? 'Mở khóa' : 'Khóa'}</Btn>}</td></tr>); })}</tbody>
        </table></div>)}
    </Card>
  );
}

/* ================= NGƯỜI DÙNG ================= */
function UsersView({ data, q, act, me }) {
  const [f, setF] = useState('all');
  const rows = data.users.filter(u => (f === 'all' || (f === 'admin' ? u.role === 'admin' : f === 'banned' ? u.banned : u.role === 'user' && !u.banned)) && (!q || norm(u.name + u.username + u.email + u.phone).includes(norm(q))));
  return (
    <Card right={<Chips value={f} onChange={setF} items={[['all', 'Tất cả', data.users.length], ['user', 'Thành viên'], ['admin', 'Admin', data.users.filter(u => u.role === 'admin').length], ['banned', 'Bị khóa', data.users.filter(u => u.banned).length]]} />}>
      {!rows.length ? <Empty icon={Users} title="Không tìm thấy người dùng" /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tham gia</th><th className="r">Thao tác</th></tr></thead>
          <tbody>{rows.map(u => (
            <tr key={u._id}><td><div className="cell-user"><Avatar name={u.name} /><div><b>{u.name}</b><small>@{u.username}</small></div></div></td>
              <td>{u.email || '—'}<small className="sub">{u.phone || 'Chưa có SĐT'}</small></td>
              <td><Pill tone={u.role === 'admin' ? 'info' : 'mute'}>{u.role === 'admin' ? 'Admin' : 'Thành viên'}</Pill></td>
              <td>{u.banned ? <Pill tone="bad">Đã khóa</Pill> : <Pill tone="ok">Hoạt động</Pill>}</td><td>{u.createdAt ? dt(u.createdAt) : '—'}</td>
              <td className="r">{u._id !== me.id ? <div className="acts">
                <Btn size="sm" onClick={() => act(() => api(`/admin/users/${u._id}/role`, { method: 'PATCH', body: { role: u.role === 'admin' ? 'user' : 'admin' } }), 'Đã đổi vai trò')}>{u.role === 'admin' ? 'Hạ xuống User' : 'Cấp Admin'}</Btn>
                <Btn size="sm" tone={u.banned ? 'success' : 'danger-o'} onClick={() => act(() => api(`/admin/users/${u._id}/ban`, { method: 'PATCH', body: { banned: !u.banned } }), u.banned ? 'Đã mở khóa' : 'Đã khóa tài khoản')}>{u.banned ? 'Mở khóa' : 'Khóa TK'}</Btn>
              </div> : <small className="sub">Bạn</small>}</td></tr>))}</tbody>
        </table></div>)}
    </Card>
  );
}

/* ================= TÀI CHÍNH ================= */
function Finance({ data }) {
  const done = data.orders.filter(o => o.status === 'completed');
  const open = data.orders.filter(o => ['pending', 'confirmed', 'shipping'].includes(o.status));
  const sum = a => a.reduce((x, o) => x + (o.total || 0), 0);
  const pay = useMemo(() => { const m = {}; done.forEach(o => { const k = String(o.payment || 'khác').toUpperCase(); m[k] = (m[k] || 0) + (o.total || 0); }); return Object.entries(m); }, [data.orders]);
  const gmv = sum(done);
  return (<>
    <div className="kpi-grid kpi-grid-3">
      <Kpi hero label="GMV tích lũy" value={vnd(gmv)} icon={Banknote} color="linear-gradient(135deg,#3f8564,#2f6b4f)" foot={<span className="tag tag-green">{done.length} đơn hoàn tất</span>} />
      <Kpi label="Giá trị đang xử lý" value={vnd(sum(open))} icon={Wallet} color="linear-gradient(135deg,#d9a441,#b7791f)" foot={<span className="tag tag-amber">{open.length} đơn mở</span>} />
      <Kpi label="Giá trị đơn trung bình" value={vnd(done.length ? gmv / done.length : 0)} icon={TrendingUp} color="linear-gradient(135deg,#5b7f6a,#3f6350)" foot={<span className="tag tag-indigo">Đơn hoàn tất</span>} />
    </div>
    <div className="grid-2">
      <Card title="Doanh thu theo ngày" sub="30 ngày gần nhất"><RevenueChart orders={data.orders} /></Card>
      <Card title="Theo phương thức thanh toán" sub="Đơn hoàn tất">
        {pay.length ? <ul className="bars">{pay.map(([k, v]) => <li key={k}><span>{k}</span><div><i style={{ width: (v / gmv * 100) + '%' }} /></div><b>{vnd(v)}</b></li>)}</ul> : <Empty title="Chưa có dữ liệu" />}
      </Card>
    </div>
  </>);
}

/* ================= KHIẾU NẠI (báo cáo vi phạm) ================= */
function Disputes({ data, q, act, go }) {
  const rows = data.reports.filter(r => !q || norm(r.reason + r.product?.title + r.by?.username + r.note).includes(norm(q)));
  return (
    <Card title={`${rows.length} báo cáo đang mở`} sub="Báo cáo vi phạm tin đăng do người dùng gửi.">
      {!rows.length ? <Empty icon={ShieldCheck} title="Không có khiếu nại nào đang mở" /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Lý do</th><th>Sản phẩm bị báo cáo</th><th>Người báo cáo</th><th>Ghi chú</th><th>Ngày</th><th className="r">Xử lý</th></tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r._id}><td><b>{r.reason}</b></td><td>{r.product ? r.product.title : <small className="sub">(Đã xóa)</small>}</td><td>@{r.by?.username}</td><td className="wrap">{r.note || '—'}</td><td>{dt(r.createdAt)}</td>
              <td className="r"><div className="acts">
                <Btn tone="danger" size="sm" onClick={() => act(() => api('/admin/reports/' + r._id, { method: 'PATCH', body: { action: 'remove' } }), 'Đã gỡ tin vi phạm')}>Gỡ tin</Btn>
                <Btn size="sm" onClick={() => act(() => api('/admin/reports/' + r._id, { method: 'PATCH', body: { action: 'dismiss' } }), 'Đã bỏ qua báo cáo')}>Bỏ qua</Btn>
              </div></td></tr>))}</tbody>
        </table></div>)}
    </Card>
  );
}

/* ================= TỒN KHO & DANH MỤC ================= */
function Inventory({ data }) {
  const rows = useMemo(() => {
    const m = {};
    data.categories.forEach(c => (m[c.name] = { name: c.name, approved: 0, pending: 0, reserved: 0, sold: 0, rejected: 0 }));
    data.products.forEach(p => { const r = (m[p.category] = m[p.category] || { name: p.category, approved: 0, pending: 0, reserved: 0, sold: 0, rejected: 0 }); r[p.status] = (r[p.status] || 0) + 1; });
    return Object.values(m);
  }, [data]);
  const total = data.products.length || 1;
  return (
    <Card title="Tồn kho theo danh mục" sub="Mỗi tin đăng là một SKU. Tồn = số tin đang bán + đang giữ chỗ.">
      <div className="table-wrap"><table>
        <thead><tr><th>Danh mục</th><th className="r">Đang bán</th><th className="r">Giữ chỗ</th><th className="r">Chờ duyệt</th><th className="r">Đã bán</th><th className="r">Từ chối</th><th style={{ width: 200 }}>Tỷ trọng</th></tr></thead>
        <tbody>{rows.map(r => { const t = r.approved + r.reserved + r.pending + r.sold + r.rejected; return (
          <tr key={r.name}><td><b>{r.name}</b></td><td className="r">{r.approved}</td><td className="r">{r.reserved}</td><td className="r">{r.pending}</td><td className="r">{r.sold}</td><td className="r">{r.rejected}</td>
            <td><div className="meter"><i style={{ width: (t / total * 100) + '%' }} /></div></td></tr>); })}</tbody>
      </table></div>
    </Card>
  );
}
function Categories({ data, q, act, setAsk }) {
  const rows = data.categories.filter(c => !q || norm(c.name).includes(norm(q)));
  const used = n => data.products.filter(p => p.category === n).length;
  return (
    <Card title={`${data.categories.length} danh mục`} right={<Btn tone="primary" icon={Plus} onClick={() => setAsk({ title: 'Thêm danh mục mới', placeholder: 'Tên danh mục…', required: true, okLabel: 'Thêm', onOk: v => act(() => api('/admin/categories', { method: 'POST', body: { name: v } }), 'Đã thêm danh mục') })}>Thêm danh mục</Btn>}>
      {!rows.length ? <Empty icon={Network} title="Chưa có danh mục" /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Tên danh mục</th><th className="r">Số sản phẩm</th><th className="r">Thao tác</th></tr></thead>
          <tbody>{rows.map(c => (
            <tr key={c._id}><td><b>{c.name}</b></td><td className="r">{used(c.name)}</td>
              <td className="r"><div className="acts">
                <Btn size="sm" icon={Pencil} onClick={() => setAsk({ title: 'Đổi tên danh mục', initial: c.name, required: true, okLabel: 'Lưu', onOk: v => act(() => api('/admin/categories/' + c._id, { method: 'PUT', body: { name: v } }), 'Đã đổi tên danh mục') })}>Sửa tên</Btn>
                <Btn tone="danger-o" size="sm" icon={Trash2} aria-label="Xóa" onClick={() => confirm(`Xóa danh mục "${c.name}"?`) && act(() => api('/admin/categories/' + c._id, { method: 'DELETE' }), 'Đã xóa danh mục')} />
              </div></td></tr>))}</tbody>
        </table></div>)}
    </Card>
  );
}

/* ================= NHẬT KÝ ================= */
function Logs({ data, q }) {
  const rows = data.logs.filter(l => !q || norm(l.actor + l.action + l.ref).includes(norm(q)));
  return (
    <Card title="Nhật ký hoạt động" sub="200 thao tác gần nhất trên hệ thống.">
      {!rows.length ? <Empty icon={ScrollText} title="Chưa có nhật ký" /> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
          <tbody>{rows.map(l => (
            <tr key={l._id}><td>{dt(l.createdAt)}</td><td>@{l.actor}</td><td><code>{l.action}</code></td><td>{short(l.ref)}</td><td className="wrap mono">{l.data ? JSON.stringify(l.data) : '—'}</td></tr>))}</tbody>
        </table></div>)}
    </Card>
  );
}
