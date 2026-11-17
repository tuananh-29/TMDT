// Trang chạy thử các bài lab: http://localhost:5173/lab.html
//   #category (mặc định) | #products | #detail/<id> | #cart
import React from 'react';
import CategoryLab from './CategoryLab.jsx';
import ProductsLab from './ProductsLab.jsx';
import DetailLab from './DetailLab.jsx';
import CartLab from './CartLab.jsx';

class LabApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hash: window.location.hash.replace('#', '') || 'category' };
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.onHashChange);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.onHashChange);
  }

  onHashChange = () => {
    this.setState({ hash: window.location.hash.replace('#', '') || 'category' });
  };

  render() {
    const h = this.state.hash;
    let page;
    if (h.startsWith('detail/')) page = <DetailLab id={h.split('/')[1]} />;
    else if (h === 'products') page = <ProductsLab />;
    else if (h === 'cart') page = <CartLab key="cart" />;
    else page = <CategoryLab />;
    return (
      <div>
        <nav className="lab-nav">
          <a href="/">← Về trang chính</a>
          <a href="#category">Category</a>
          <a href="#products">Sản phẩm</a>
          <a href="#cart">Giỏ hàng</a>
        </nav>
        {page}
      </div>
    );
  }
}

export default LabApp;
