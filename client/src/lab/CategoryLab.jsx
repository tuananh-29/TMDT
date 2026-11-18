// Lab09 – Bài 1: giao diện loại sản phẩm (Category + View All)
import React from 'react';
import { call } from './labApi';
import { imgUrl } from '../lib.jsx';

class CategoryLab extends React.Component {
  constructor(props) {
    super(props);
    this.state = { category_data: [] };
  }

  // Lấy dữ liệu lần đầu
  componentDidMount() {
    this.get_category('category');
  }

  // Lấy dữ liệu khi ấn nút View All
  onClickViewAll = () => {
    this.get_category('category/viewall');
  };

  // Hàm request API lấy dữ liệu
  get_category = view_all => {
    call(`/categories/${view_all}`)
      .then(data => {
        console.log('category_data=', data.category);
        this.setState({ category_data: data.category });
      })
      .catch(error => console.log('Có lỗi nè :\n', error));
  };

  // icon: link ảnh → <img>, emoji/chữ → hiển thị trực tiếp, rỗng → 📦
  renderIcon = icon => {
    if (/^(https?:|\/)/.test(icon)) return <img src={imgUrl(icon)} alt="" className="lab-cat-img" />;
    return <div className="lab-cat-emoji">{icon || '📦'}</div>;
  };

  render() {
    return (
      <div className="lab-container">
        <div className="lab-row-between">
          <h3>Category</h3>
          <button className="lab-btn lab-btn-outline" onClick={this.onClickViewAll}>View All</button>
        </div>
        <div className="lab-grid-cat">
          {this.state.category_data.map((cat, idx) => (
            <div key={idx} className="lab-cat">
              {this.renderIcon(cat.icon)}
              <h6>{cat.name}</h6>
              <p className="lab-muted">{cat.items} items</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default CategoryLab;



