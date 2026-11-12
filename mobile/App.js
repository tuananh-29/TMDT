import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Image, Alert, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Đổi IP hoặc dùng localhost nếu chạy emulator. Điện thoại và máy tính cùng Wi-Fi.
const HOST = '10.0.2.2'; // Hoặc IP máy tính của bạn
const API = `http://${HOST}:5000/api`;
let TOKEN = null;

const api = async (p, m = 'GET', b) => {
  const r = await fetch(API + p, {
    method: m,
    headers: { 'Content-Type': 'application/json', ...(TOKEN && { Authorization: 'Bearer ' + TOKEN }) },
    body: b ? JSON.stringify(b) : undefined
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Lỗi ' + r.status);
  return d;
};

const money = n => (n || 0).toLocaleString('vi-VN') + ' đ';
const imgUri = u => {
  if (!u) return '';
  if (/^(https?:|data:|blob:)/.test(u)) return u;
  if (u.startsWith('/uploads/')) return `http://${HOST}:5000${u}`;
  return `http://${HOST}:5000/assets/${u.replace(/^\/?assets\//, '')}`;
};
const fail = e => Alert.alert('Thông báo', e.message);
const C = { ink: '#14231c', teal: '#0f8a5f', tag: '#e7f5ee', bg: '#f4f6f8', line: '#e2e8f0' };

const Btn = ({ t, onPress, kind = 'p', style }) => (
  <TouchableOpacity onPress={onPress} style={[s.btn, kind === 'o' && s.btnO, kind === 'd' && s.btnD, kind === 'g' && s.btnG, style]}>
    <Text style={[s.btnT, kind !== 'p' && { color: kind === 'd' ? '#dc2626' : kind === 'g' ? '#16a34a' : C.teal }]}>{t}</Text>
  </TouchableOpacity>
);
const In = p => <TextInput placeholderTextColor="#94a3b8" {...p} style={[s.in, p.style]} />;
const Gia = ({ v }) => <Text style={s.gia}>{money(v)}</Text>;
const Thumb = ({ p, h = 140 }) => p.images && p.images[0] ? <Image source={{ uri: imgUri(p.images[0]) }} style={{ height: h, backgroundColor: '#e2e8f0' }} /> : <View style={[{ height: h, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: '#64748b' }}>📦</Text></View>;
const Chip = ({ t, on, onPress }) => <TouchableOpacity onPress={onPress} style={[s.chip, on && { backgroundColor: C.teal, borderColor: C.teal }]}><Text style={{ color: on ? '#fff' : C.ink, fontWeight: on ? '700' : '500' }}>{t}</Text></TouchableOpacity>;

function Auth({ onLogin }) {
  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ username: '', password: '', name: '', phone: '' });
  const go = async () => {
    try {
      if (reg) {
        if (!f.username || !f.password || !f.name) return Alert.alert('Thông báo', 'Vui lòng điền đầy đủ tên, tên đăng nhập và mật khẩu');
        await api('/auth/register', 'POST', f);
        Alert.alert('Thông báo', 'Đăng ký thành công, hãy đăng nhập');
        setReg(false);
      } else {
        if (!f.username || !f.password) return Alert.alert('Thông báo', 'Vui lòng nhập tài khoản và mật khẩu');
        const r = await api('/auth/login', 'POST', { username: f.username, password: f.password });
        onLogin(r.token, r.user);
      }
    } catch (e) { fail(e); }
  };
  return (
    <ScrollView contentContainerStyle={[s.pad, { justifyContent: 'center', flexGrow: 1 }]}>
      <Text style={[s.h1, { textAlign: 'center', marginBottom: 20 }]}>♻️ Chợ Đồ Cũ</Text>
      {reg && <In placeholder="Họ và tên" value={f.name} onChangeText={v => setF({ ...f, name: v })} />}
      <In placeholder="Tên đăng nhập (username)" autoCapitalize="none" value={f.username} onChangeText={v => setF({ ...f, username: v })} />
      <In placeholder="Mật khẩu" secureTextEntry value={f.password} onChangeText={v => setF({ ...f, password: v })} />
      {reg && <In placeholder="Số điện thoại" keyboardType="phone-pad" value={f.phone} onChangeText={v => setF({ ...f, phone: v })} />}
      <Btn t={reg ? 'Tạo tài khoản' : 'Đăng nhập'} onPress={go} />
      <Btn kind="o" t={reg ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký mới'} onPress={() => setReg(!reg)} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

function Home({ open }) {
  const [ds, setDs] = useState([]), [dm, setDm] = useState([]), [q, setQ] = useState(''), [cat, setCat] = useState('');
  const tim = useCallback((c = cat) => api('/products?' + new URLSearchParams(Object.entries({ q, category: c }).filter(([, v]) => v))).then(d => setDs(d.items || [])).catch(fail), [q, cat]);
  useEffect(() => {
    api('/categories').then(m => setDm(m.categoryList || m.categories || [])).catch(fail);
    tim('');
  }, []); // eslint-disable-line
  return (
    <View style={{ flex: 1 }}>
      <View style={s.pad}>
        <In placeholder="🔍 Tìm điện thoại, xe đạp, sách cũ..." value={q} onChangeText={setQ} onSubmitEditing={() => tim()} returnKeyType="search" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          <Chip t="Tất cả" on={!cat} onPress={() => { setCat(''); tim(''); }} />
          {dm.map(c => <Chip key={c._id || c} t={c.name || c} on={cat === (c.name || c)} onPress={() => { const name = c.name || c; setCat(name); tim(name); }} />)}
        </ScrollView>
      </View>
      <FlatList data={ds} keyExtractor={p => p._id} numColumns={2} contentContainerStyle={{ padding: 8 }} ListEmptyComponent={<Text style={[s.muted, { textAlign: 'center', marginTop: 40 }]}>Chưa có sản phẩm phù hợp.</Text>}
        renderItem={({ item: p }) => (
          <TouchableOpacity style={s.card} onPress={() => open(p._id)}>
            <Thumb p={p} />
            <View style={{ padding: 10 }}>
              <Text numberOfLines={2} style={{ fontWeight: '600', fontSize: 14 }}>{p.title}</Text>
              <Gia v={p.price} />
              <Text style={s.muted}>{p.location} · Mới {p.percentNew || 90}%</Text>
            </View>
          </TouchableOpacity>
        )} />
    </View>
  );
}

function Detail({ id, me, back }) {
  const [p, setP] = useState();
  useEffect(() => { api('/products/' + id).then(res => setP(res.product)).catch(e => { fail(e); back(); }); }, [id]); // eslint-disable-line
  if (!p) return null;
  const ban = p.status === 'approved', laToi = String(p.seller?._id || p.seller) === String(me._id);
  const them = () => api('/cart/' + id, 'POST').then(() => Alert.alert('Thông báo', 'Đã thêm vào giỏ hàng')).catch(fail);
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Thumb p={p} h={260} />
      <Btn kind="o" t="‹ Quay lại" onPress={back} style={{ marginVertical: 10 }} />
      <Text style={s.h1}>{p.title}</Text>
      <Gia v={p.price} />
      <Text style={{ marginVertical: 8, lineHeight: 20 }}>{p.description}</Text>
      <Text style={s.muted}>Khu vực: {p.location} · Độ mới: {p.percentNew || 90}%</Text>
      <Text style={{ fontWeight: '600', marginTop: 12 }}>Người bán: {p.seller?.name || 'Thành viên'}</Text>
      {ban && !laToi && <Btn t="🛒 Thêm vào giỏ hàng" onPress={them} style={{ marginTop: 16 }} />}
    </ScrollView>
  );
}

function Cart({ me, done }) {
  const [ds, setDs] = useState([]);
  const load = () => api('/cart').then(setDs).catch(fail);
  useEffect(() => { load(); }, []);
  const xoa = id => api('/cart/' + id, { method: 'DELETE' }).then(load).catch(fail);
  const dat = () => api('/orders', { method: 'POST', body: { shippingMethod: 'meet', payment: 'cod', recipientName: me.name, phone: me.phone || '0900000000', address: me.address || 'Tại nhà' } }).then(() => { Alert.alert('Thông báo', 'Đặt hàng thành công!'); done(); }).catch(fail);
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h1}>🛒 Giỏ hàng</Text>
      {!ds.length && <Text style={s.muted}>Giỏ hàng trống.</Text>}
      {ds.map(p => (
        <View key={p._id} style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600' }}>{p.title}</Text>
            <Gia v={p.price} />
          </View>
          <Btn kind="d" t="Xóa" onPress={() => xoa(p._id)} />
        </View>
      ))}
      {!!ds.length && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Tổng tạm tính: {money(ds.reduce((t, p) => t + p.price, 0))}</Text>
          <Btn t="Xác nhận đặt hàng (COD)" onPress={dat} />
        </View>
      )}
    </ScrollView>
  );
}

const ST = { pending: '⏳ Chờ xác nhận', confirmed: '✔️ Đã xác nhận', shipping: '🚚 Đang giao', completed: '✅ Hoàn tất', cancelled: '❌ Đã hủy' };
function MyOrders() {
  const [ds, setDs] = useState([]);
  const load = () => api('/orders?role=buyer').then(setDs).catch(fail);
  useEffect(() => { load(); }, []);
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h1}>📦 Đơn mua của tôi</Text>
      {!ds.length && <Text style={s.muted}>Chưa có đơn hàng nào.</Text>}
      {ds.map(o => (
        <View key={o._id} style={s.card2}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700' }}>Đơn #{String(o._id).slice(-6)}</Text>
            <Text style={{ color: C.teal, fontWeight: '600' }}>{ST[o.status]}</Text>
          </View>
          {o.items.map((x, i) => <Text key={i} style={{ marginVertical: 2 }}>• {x.title} – {money(x.price)}</Text>)}
          <Text style={{ fontWeight: '700', marginTop: 6 }}>Tổng: {money(o.total)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Me({ user, setUser, logout }) {
  const [f, setF] = useState({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
  const luu = () => api('/me', { method: 'PUT', body: f }).then(u => { setUser(u); AsyncStorage.setItem('user', JSON.stringify(u)); Alert.alert('Thông báo', 'Đã lưu hồ sơ'); }).catch(fail);
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.h1}>👤 Hồ sơ cá nhân</Text>
      <Text style={s.muted}>Tài khoản: @{user.username}</Text>
      <In placeholder="Họ và tên" value={f.name} onChangeText={v => setF({ ...f, name: v })} />
      <In placeholder="Số điện thoại" value={f.phone} onChangeText={v => setF({ ...f, phone: v })} />
      <In placeholder="Địa chỉ" value={f.address} onChangeText={v => setF({ ...f, address: v })} />
      <Btn t="💾 Lưu hồ sơ" onPress={luu} />
      <Btn kind="d" t="Đăng xuất" onPress={logout} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), [tab, setTab] = useState('home'), [detail, setDetail] = useState(null);
  useEffect(() => {
    AsyncStorage.multiGet(['token', 'user']).then(([[, t], [, u]]) => {
      if (t && u) { TOKEN = t; setUser(JSON.parse(u)); }
      setReady(true);
    });
  }, []);
  const login = async (t, u) => {
    TOKEN = t;
    await AsyncStorage.multiSet([['token', t], ['user', JSON.stringify(u)]]);
    setUser(u);
  };
  const logout = async () => {
    TOKEN = null;
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
    setTab('home');
  };
  if (!ready) return null;
  const tabs = [['home', '🏠 Khám phá'], ['cart', '🛒 Giỏ hàng'], ['orders', '📦 Đơn mua'], ['me', '👤 Tôi']];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, paddingTop: StatusBar.currentHeight || 0 }}>
      <View style={{ flex: 1 }}>
        {!user ? <Auth onLogin={login} /> : detail ? <Detail id={detail} me={user} back={() => setDetail(null)} />
          : tab === 'home' ? <Home open={setDetail} /> : tab === 'cart' ? <Cart me={user} done={() => setTab('orders')} />
          : tab === 'orders' ? <MyOrders /> : <Me user={user} setUser={setUser} logout={logout} />}
      </View>
      {user && !detail && (
        <View style={s.tabs}>
          {tabs.map(([k, t]) => (
            <TouchableOpacity key={k} style={{ flex: 1, padding: 12, alignItems: 'center' }} onPress={() => setTab(k)}>
              <Text style={{ fontSize: 12, fontWeight: tab === k ? '700' : '500', color: tab === k ? '#fff' : '#94a3b8' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16 },
  h1: { fontSize: 22, fontWeight: '700', marginVertical: 8, color: C.ink },
  muted: { color: '#64748b', fontSize: 13, marginVertical: 2 },
  in: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  btn: { backgroundColor: C.teal, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnO: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.teal },
  btnD: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#dc2626' },
  btnG: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#16a34a' },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  card: { flex: 1, margin: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 12, overflow: 'hidden' },
  card2: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12, marginBottom: 10 },
  gia: { alignSelf: 'flex-start', backgroundColor: C.tag, color: C.teal, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: C.ink, borderTopWidth: 1, borderTopColor: '#2c3340' }
});
