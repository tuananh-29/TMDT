// Lab10 – Giao diện xem giỏ hàng, cập nhật số lượng (+/-), xóa (có xác nhận), tổng giá
import React from 'react';
import { call, isLoggedIn, goLogin } from './labApi';
import { imgUrl, money } from '../lib.jsx';

class CartLab extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: [], loaded: false };
  }

  componentDidMount() {
    // Chưa đăng nhập → điều hướng đến trang đăng nhập
    if (!isLoggedIn()) { goLogin(); return; }
    this.get_cart();
  }

  // Xem giỏ hàng
  get_cart = () => {
    call('/products/products/cart')
      .then(data => this.setState({ items: data.items, loaded: true }))
      .catch(error => { console.log('Có lỗi nè :\n', error); this.setState({ loaded: true }); });
  };

  // Click vào dấu + | - để tăng giảm số lượng sản phẩm
  onClickChangeQuantity = async (item, delta) => {
    const quantity = item.quantity + delta;
    if (quantity < 1) return; // muốn bỏ hẳn thì dùng nút Xóa
    try {
      await call('/products/products/cart/update', { method: 'PUT', body: { product_id: item.product_id, quantity } });
      this.get_cart();
    } catch (e) { alert(e.message); }
  };

  // Click vào nút xóa và xác nhận xóa sản phẩm
  onClickRemove = async item => {
    if (!window.confirm(`Xóa "${item.name}" khỏi giỏ hàng?`)) return;
    try {
      await call(`/products/products/cart/remove/${item.product_id}`, { method: 'DELETE' });
      this.get_cart();
    } catch (e) { alert(e.message); }
  };

  render() {
    const { items, loaded } = this.state;
    // Tổng giá = đơn giá x số lượng
    const total = items.reduce((a, i) => a + i.price * i.quantity, 0);
    if (!loaded) return <div className="lab-container">Đang tải giỏ hàng…</div>;
    return (
      <div className="lab-container">
        <h3>Giỏ hàng ({items.length})</h3>
        {items.length === 0 && <p>Giỏ hàng đang trống.</p>}
        {items.map(item => (
          <div key={item.product_id} className="lab-cart-row">
            {item.image && <img src={imgUrl(item.image)} alt={item.name} className="lab-cart-img" />}
            <div className="lab-cart-info">
              <strong>{item.name}</strong>
              <div className="lab-price">{money(item.price)}</div>
            </div>
            <div className="lab-stepper">
              <button onClick={() => this.onClickChangeQuantity(item, -1)} disabled={item.quantity <= 1}>−</button>
              <span>{item.quantity}</span>
              <button onClick={() => this.onClickChangeQuantity(item, 1)}>+</button>
            </div>
            <div className="lab-cart-sum">{money(item.price * item.quantity)}</div>
            <button className="lab-btn lab-btn-danger" onClick={() => this.onClickRemove(item)}>Xóa</button>
          </div>
        ))}
        {items.length > 0 && <div className="lab-total">Tổng cộng: <strong>{money(total)}</strong></div>}
      </div>
    );
  }
}

export default CartLab;
