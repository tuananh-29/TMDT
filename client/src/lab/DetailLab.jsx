// Lab09 – Bài 3: giao diện chi tiết sản phẩm (+ Lab10: thêm vào giỏ hàng với số lượng)
import React from 'react';
import { call, isLoggedIn, goLogin } from './labApi';
import { imgUrl, money } from '../lib.jsx';

class DetailLab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Biến Data chi tiết sản phẩm
      product_data: {},
      seller_rating: { avg: 0, count: 0 },
      related: [],
      reviews: [],
      // Biến lưu số lượng sản phẩm
      quantity: 1,
      // Biến trạng thái Tab
      activeTab: 'description',
      // Biến chọn ảnh
      selectedImage: null
    };
  }

  // Lấy dữ liệu lần đầu
  componentDidMount() {
    this.getDeatilProduct(this.props.id);
  }

  // Khi bấm sang sản phẩm liên quan (id đổi) thì tải lại
  componentDidUpdate(prev) {
    if (prev.id !== this.props.id) this.getDeatilProduct(this.props.id);
  }

  // Thêm vào giỏ (dùng chung cho Add to cart và Buy now)
  addToCart = async () => {
    if (!isLoggedIn()) { goLogin(); return false; }
    try {
      const data = await call('/products/products/cart/add', {
        method: 'POST',
        body: { product: { product_id: this.state.product_data._id, quantity: this.state.quantity } }
      });
      return data.message;
    } catch (e) { alert(e.message); return false; }
  };

  // Nút mua sp: thêm vào giỏ rồi sang trang giỏ hàng
  onClickBuyNow = async () => {
    if (await this.addToCart()) window.location.hash = '#cart';
  };

  // Nút thêm sp vào giỏ hàng
  onClickAddToCart = async () => {
    const message = await this.addToCart();
    if (message) alert(message);
  };

  // Thay đổi sl
  onChangeQuantity = e => {
    const value = Number(e.target.value);
    if (value > 0) this.setState({ quantity: value });
  };

  // Thay đổi thẻ Tab
  onChangeTabChange = tab => {
    this.setState({ activeTab: tab });
  };

  // Click chọn ảnh khác
  onChangeImageSelect = img => {
    this.setState({ selectedImage: img });
  };

  // Hàm request API lấy dữ liệu chi tiết 1 sản phẩm
  getDeatilProduct = id => {
    call(`/products/${id}`)
      .then(data => {
        const p = data.product;
        this.setState({
          product_data: p,
          seller_rating: data.seller || { avg: 0, count: 0 },
          related: data.related || [],
          // Hiển thị ảnh chính đầu tiên
          selectedImage: (p.images || [])[0] || null,
          quantity: 1,
          activeTab: 'description',
          reviews: []
        });
        console.log('API:\n', p);
        // Đánh giá của người bán (cho tab Review)
        return call(`/users/${p.seller.username}`);
      })
      .then(u => this.setState({ reviews: Array.isArray(u.reviews) ? u.reviews : [] }))
      .catch(error => console.log('Có lỗi nè :\n', error));
  };

  // Hiển thị dữ liệu lên GUI
  render() {
    const p = this.state.product_data, imgs = (p.images || []).filter(i => i && i.trim() !== '');
    const tab = this.state.activeTab, rv = this.state.reviews;
    return (
      <div className="lab-container">
        <h3>{p.title}</h3>
        <div className="lab-detail">
          {/* IMAGE sản phẩm */}
          <div>
            {this.state.selectedImage && <img src={imgUrl(this.state.selectedImage)} alt="Product" className="lab-detail-img" />}
            <div className="lab-thumbs">
              {imgs.map((img, idx) => (
                <img key={idx} src={imgUrl(img)} alt={`thumb-${idx}`}
                  className={'lab-thumb' + (this.state.selectedImage === img ? ' lab-thumb-active' : '')}
                  onClick={() => this.onChangeImageSelect(img)} />
              ))}
            </div>
          </div>

          {/* INFO sản phẩm */}
          <div>
            <div className="lab-meta">
              <span className="lab-badge">★ {this.state.seller_rating.avg}</span>
              <span>{p.description}</span>
            </div>
            <div className="lab-qty">
              <label>Quantity:</label>
              <input type="number" min="1" value={this.state.quantity} onChange={this.onChangeQuantity} />
            </div>
            <h4 className="lab-price">{p.price ? money(p.price) : '0₫'}</h4>
            <div className="lab-actions">
              <button className="lab-btn lab-btn-outline" onClick={this.onClickBuyNow}>Buy now</button>
              <button className="lab-btn lab-btn-primary" onClick={this.onClickAddToCart}>Add to cart</button>
            </div>
          </div>
        </div>

        {/* TAB */}
        <ul className="lab-tabs">
          <li><button className={tab === 'description' ? 'active' : ''} onClick={() => this.onChangeTabChange('description')}>Descriptions</button></li>
          <li><button className={tab === 'review' ? 'active' : ''} onClick={() => this.onChangeTabChange('review')}>Review ({rv.length})</button></li>
          <li><button className={tab === 'related' ? 'active' : ''} onClick={() => this.onChangeTabChange('related')}>Related Product</button></li>
        </ul>
        <div className="lab-tab-body">
          {tab === 'description' && (
            <div>
              <h5>Overview</h5>
              <p style={{ whiteSpace: 'pre-wrap' }}>{p.description}</p>
              <p><strong>Category:</strong> {p.category}</p>
              <p><strong>Condition:</strong> {p.condition} ({p.percentNew || 90}%)</p>
              <p><strong>Location:</strong> {p.location || '—'}</p>
            </div>
          )}
          {tab === 'review' && (rv.length === 0
            ? <p>Chưa có đánh giá nào.</p>
            : rv.map((r, i) => (
              <p key={i}><strong>{'★'.repeat(r.rating || 0)}</strong> {r.comment} <span className="lab-muted">{r.from && r.from.name ? '– ' + r.from.name : ''}</span></p>
            )))}
          {tab === 'related' && (this.state.related.length === 0
            ? <p>Chưa có sản phẩm liên quan.</p>
            : <div className="lab-grid-products">
              {this.state.related.map(r => (
                <a key={r._id} href={`#detail/${r._id}`} className="lab-card lab-link">
                  {r.images && r.images[0] && <img src={imgUrl(r.images[0])} alt={r.title} className="lab-card-img" />}
                  <div className="lab-card-body"><strong>{r.title}</strong><div className="lab-price">{money(r.price)}</div></div>
                </a>
              ))}
            </div>)}
        </div>
      </div>
    );
  }
}

export default DetailLab;



