// Danh sách sản phẩm có nút View (→ chi tiết) và Thêm vào giỏ (mặc định số lượng 1, theo Lab10)
import React from 'react';
import { call, isLoggedIn, goLogin } from './labApi';
import { imgUrl, money } from '../lib.jsx';

class ProductsLab extends React.Component {
  constructor(props) {
    super(props);
    this.state = { products: [] };
  }

  componentDidMount() {
    call('/products')
      .then(data => this.setState({ products: data.items || [] }))
      .catch(error => console.log('Có lỗi nè :\n', error));
  }

  // Người dùng chưa đăng nhập → điều hướng đến trang đăng nhập
  onClickAddToCart = async p => {
    if (!isLoggedIn()) { goLogin(); return; }
    try {
      const data = await call('/products/products/cart/add', {
        method: 'POST',
        body: { product: { product_id: p._id, quantity: 1 } }
      });
      alert(data.message);
    } catch (e) { alert(e.message); }
  };

  render() {
    return (
      <div className="lab-container">
        <h3>Sản phẩm</h3>
        <div className="lab-grid-products">
          {this.state.products.map(p => (
            <div key={p._id} className="lab-card">
              {p.images && p.images[0] && <img src={imgUrl(p.images[0])} alt={p.title} className="lab-card-img" />}
              <div className="lab-card-body">
                <strong>{p.title}</strong>
                <div className="lab-price">{money(p.price)}</div>
                <a href={`#detail/${p._id}`} className="lab-btn lab-btn-outline lab-block">View</a>
                <button className="lab-btn lab-btn-primary lab-block" onClick={() => this.onClickAddToCart(p)}>Add to cart</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default ProductsLab;
