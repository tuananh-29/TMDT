// Dữ liệu mẫu cho Chợ Đồ Cũ. Ưu tiên ảnh thật seed-X-Y.jpg trong server/uploads, nếu thiếu thì sinh ảnh SVG (không cần internet).
const fs = require('fs'), path = require('path');

// [emoji, màu nền 1, màu nền 2] theo danh mục
const THEME = {
  'Xe cộ': ['🚲', '#57CC99', '#2f9e6f'],
  'Điện thoại': ['📱', '#80ED99', '#38A3A5'],
  'Đồ điện tử': ['💻', '#57CC99', '#22577A'],
  'Đồ gia dụng': ['🍳', '#C7F9CC', '#57CC99'],
  'Thời trang': ['👕', '#80ED99', '#57CC99'],
  'Nội thất': ['🛋️', '#C7F9CC', '#38A3A5'],
  'Thú cưng': ['🐾', '#80ED99', '#2f9e6f'],
  'Sách & học tập': ['📚', '#C7F9CC', '#57CC99'],
  'Thể thao': ['🏸', '#57CC99', '#38A3A5'],
  'Mẹ & bé': ['🧸', '#C7F9CC', '#80ED99']
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Cắt tiêu đề thành tối đa 2 dòng, không cắt giữa từ
const wrap = (s, max = 22) => {
  const words = String(s).split(' '), lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + ' ' + w).trim().length <= max || !cur) lines[lines.length - 1] = (cur + ' ' + w).trim();
    else if (lines.length < 2) lines.push(w);
    else { lines[1] = (lines[1] + ' ' + w).trim(); }
  }
  if (lines[1] && lines[1].length > max + 4) lines[1] = lines[1].slice(0, max + 1).replace(/\s+\S*$/, '') + '…';
  return lines;
};

const svg = (cat, title, variant) => {
  const [emoji, c1, c2] = THEME[cat] || THEME['Đồ gia dụng'];
  const flip = variant % 2 === 1;
  const [l1, l2] = wrap(title);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${flip ? c2 : c1}"/><stop offset="1" stop-color="${flip ? c1 : c2}"/></linearGradient></defs>
<rect width="800" height="800" fill="url(#g)"/>
<circle cx="${flip ? 140 : 660}" cy="140" r="170" fill="#fff" opacity=".16"/>
<circle cx="${flip ? 700 : 120}" cy="720" r="210" fill="#fff" opacity=".12"/>
<text x="400" y="400" font-size="260" text-anchor="middle" dominant-baseline="central">${emoji}</text>
<rect x="60" y="590" width="680" height="${l2 ? 130 : 92}" rx="26" fill="#fff" opacity=".92"/>
<text x="400" y="${l2 ? 640 : 650}" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#14452f" text-anchor="middle">${esc(l1)}</text>
${l2 ? `<text x="400" y="692" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#14452f" text-anchor="middle">${esc(l2)}</text>` : ''}
</svg>`;
};

// [tiêu đề, danh mục, giá, giá gốc, tình trạng, % mới, khu vực, mô tả, trạng thái, vip, số ảnh]
const P = [
  ['Bộ boardgame Catan bản quốc tế, đủ phụ kiện', 'Sách & học tập', 450000, 690000, 'Như mới', 95, 'TP. Hồ Chí Minh', 'Mới chơi 2 lần, thẻ bài đã bọc sleeve, đầy đủ quân gỗ và hướng dẫn tiếng Việt. Hộp còn nguyên, không móp.', 'approved', true, 2],
  ['Xe đạp thể thao khung nhôm siêu nhẹ', 'Xe cộ', 2800000, 4500000, 'Đã dùng', 85, 'TP. Hồ Chí Minh', 'Xe chạy êm, đề Shimano 21 tốc độ mượt, phanh đĩa an toàn. Đã thay lốp mới tháng trước.', 'approved', true, 2],
  ['Áo hoodie nỉ bông form rộng unisex', 'Thời trang', 180000, 320000, 'Như mới', 90, 'Hà Nội', 'Nỉ dày dặn, không xù lông, mặc ấm và lên form chuẩn. Size L, mới mặc vài lần.', 'approved', false, 1],
  ['iPhone 12 128GB xanh, pin 88%', 'Điện thoại', 6900000, 13990000, 'Đã dùng', 85, 'TP. Hồ Chí Minh', 'Máy nguyên zin, Face ID tốt, màn hình không xước. Tặng ốp lưng và cáp sạc. Có thể xem máy trực tiếp.', 'approved', true, 2],
  ['Samsung Galaxy A54 5G 8/256GB', 'Điện thoại', 5200000, 9490000, 'Như mới', 95, 'Đà Nẵng', 'Dùng 6 tháng, còn bảo hành chính hãng đến cuối năm. Đủ hộp, sạc nhanh 25W.', 'approved', false, 1],
  ['Laptop Dell Inspiron 15 i5 gen 11, RAM 16GB', 'Đồ điện tử', 9500000, 16500000, 'Đã dùng', 80, 'Hà Nội', 'SSD 512GB, màn 15.6 inch Full HD. Pin dùng khoảng 4 tiếng, máy chạy mượt cho học tập và văn phòng.', 'approved', true, 2],
  ['Tai nghe Sony WH-1000XM4 chống ồn', 'Đồ điện tử', 3300000, 6490000, 'Như mới', 95, 'TP. Hồ Chí Minh', 'Chống ồn rất tốt, pin trâu. Đệm tai còn mới, đủ hộp và dây sạc.', 'approved', false, 2],
  ['Máy ảnh Canon EOS 200D kèm lens kit 18-55', 'Đồ điện tử', 7800000, 13900000, 'Đã dùng', 85, 'Cần Thơ', 'Shutter khoảng 8.000 kiểu, kèm thẻ nhớ 64GB và túi đựng. Màn hình xoay lật tiện chụp selfie.', 'approved', false, 2],
  ['Bàn phím cơ Keychron K2 bản không dây', 'Đồ điện tử', 1350000, 2200000, 'Mới 99%', 99, 'TP. Hồ Chí Minh', 'Switch Brown, đèn nền trắng, kết nối Bluetooth và có dây. Mới dùng 1 tháng, còn đủ keycap thay thế.', 'approved', false, 1],
  ['Nồi chiên không dầu Philips 4.1 lít', 'Đồ gia dụng', 950000, 2400000, 'Như mới', 95, 'Hải Phòng', 'Dùng ít, lòng nồi chống dính còn mới. Nướng gà, khoai tây rất giòn. Còn đủ hộp.', 'approved', false, 1],
  ['Máy xay sinh tố Panasonic 1.5 lít', 'Đồ gia dụng', 420000, 890000, 'Đã dùng', 80, 'TP. Hồ Chí Minh', 'Cối thủy tinh dày, motor khỏe, xay đá tốt. Có một vết xước nhỏ ở thân máy.', 'approved', false, 1],
  ['Quạt đứng Senko 5 cánh, remote điều khiển', 'Đồ gia dụng', 380000, 720000, 'Đã dùng', 80, 'Cần Thơ', 'Chạy êm, 3 tốc độ gió, có hẹn giờ tắt. Phù hợp phòng ngủ hoặc phòng khách.', 'approved', false, 1],
  ['Áo khoác denim vintage unisex size M', 'Thời trang', 260000, 480000, 'Đã dùng', 85, 'Đà Nẵng', 'Vải denim dày, phối màu xanh nhạt phong cách vintage. Không rách, không phai màu nhiều.', 'approved', false, 1],
  ['Giày Adidas Ultraboost size 42', 'Thời trang', 1150000, 4200000, 'Đã dùng', 80, 'Hà Nội', 'Đế boost còn êm, chạy bộ rất thích. Đã giặt sạch, đi vài chục km.', 'approved', false, 1],
  ['Túi xách da thật màu nâu bò', 'Thời trang', 520000, 1200000, 'Như mới', 90, 'TP. Hồ Chí Minh', 'Da thật, khóa kim loại không gỉ, ngăn trong rộng rãi. Mới đi vài lần, không trầy.', 'approved', false, 1],
  ['Ghế sofa đơn bọc vải nhung xanh mint', 'Nội thất', 1650000, 3200000, 'Như mới', 90, 'TP. Hồ Chí Minh', 'Khung gỗ chắc chắn, đệm mút dày êm. Màu xanh mint rất hợp phòng khách nhỏ. Tự vận chuyển.', 'approved', true, 2],
  ['Bàn làm việc gỗ 120x60cm kèm kệ sách', 'Nội thất', 780000, 1650000, 'Đã dùng', 80, 'Hà Nội', 'Mặt bàn chống xước, chân sắt sơn tĩnh điện. Dễ tháo lắp để vận chuyển.', 'approved', false, 1],
  ['Đèn bàn LED chống cận, 3 chế độ sáng', 'Nội thất', 190000, 390000, 'Như mới', 95, 'Đà Nẵng', 'Điều chỉnh độ sáng và nhiệt màu, cổng sạc USB tiện lợi. Dùng 3 tháng.', 'approved', false, 1],
  ['Lồng nuôi chim cảnh inox kèm phụ kiện', 'Thú cưng', 220000, 450000, 'Đã dùng', 80, 'Hải Phòng', 'Lồng inox không gỉ, kèm 2 chén ăn, cây đậu và khay hứng phân. Đã vệ sinh sạch.', 'approved', false, 1],
  ['Nhà cây cho mèo 3 tầng, cột cào sisal', 'Thú cưng', 540000, 1100000, 'Như mới', 90, 'TP. Hồ Chí Minh', 'Mèo nhà mình ít dùng nên còn rất mới. Có ổ nằm, võng và đồ chơi treo.', 'approved', false, 1],
  ['Combo sách tiếng Anh IELTS Cambridge 14-18', 'Sách & học tập', 320000, 780000, 'Đã dùng', 85, 'Hà Nội', 'Đủ 5 cuốn, kèm đáp án và audio. Có ghi chú bút chì nhẹ, dễ tẩy.', 'approved', false, 1],
  ['Bộ truyện Harry Potter tiếng Việt, 7 tập', 'Sách & học tập', 690000, 1300000, 'Đã dùng', 85, 'TP. Hồ Chí Minh', 'Bìa mềm, giấy còn trắng, không rách trang. Giữ gìn cẩn thận, phù hợp để sưu tầm.', 'approved', false, 1],
  ['Vợt cầu lông Yonex Astrox 77, kèm bao', 'Thể thao', 1250000, 2650000, 'Như mới', 95, 'TP. Hồ Chí Minh', 'Đã căng dây Yonex BG65, quấn cán mới. Đánh vài buổi nên còn rất mới, kèm bao đựng.', 'approved', false, 2],
  ['Tạ tay 2x10kg bọc cao su kèm giá đỡ', 'Thể thao', 680000, 1400000, 'Đã dùng', 85, 'Cần Thơ', 'Tạ điều chỉnh được mức nặng, bọc cao su êm không trầy sàn. Phù hợp tập tại nhà.', 'approved', false, 1],
  ['Xe đẩy em bé gấp gọn, 3 tư thế', 'Mẹ & bé', 850000, 2100000, 'Đã dùng', 80, 'Hà Nội', 'Gấp gọn một tay, mái che rộng, bánh xe chạy êm. Đã giặt sạch phần đệm.', 'approved', false, 1],
  ['Bộ đồ chơi xếp hình gỗ cho bé 2+ tuổi', 'Mẹ & bé', 150000, 320000, 'Như mới', 95, 'Đà Nẵng', 'Gỗ tự nhiên sơn an toàn, 60 chi tiết nhiều màu. Bé ít chơi nên còn rất mới.', 'approved', false, 1],
  ['Xe máy Honda Vision 2019, biển số TP.HCM', 'Xe cộ', 21500000, 32000000, 'Đã dùng', 80, 'TP. Hồ Chí Minh', 'Máy êm, đã chạy 28.000 km, giấy tờ đầy đủ, chính chủ. Bảo dưỡng định kỳ tại hãng.', 'sold', false, 2],
  ['Máy chơi game Nintendo Switch OLED', 'Đồ điện tử', 6200000, 8990000, 'Như mới', 95, 'Hà Nội', 'Kèm 2 game và thẻ nhớ 128GB. Màn OLED đẹp, không trầy. Đủ hộp, tay cầm Joy-Con còn tốt.', 'sold', false, 2],
  ['Máy lọc không khí Xiaomi 4 Lite', 'Đồ gia dụng', 1450000, 2690000, 'Như mới', 90, 'TP. Hồ Chí Minh', 'Lọc bụi mịn tốt, điều khiển qua app. Mới thay lõi lọc, dùng cho phòng khoảng 30m².', 'pending', false, 1],
  ['Áo dài lụa tơ tằm màu xanh ngọc, size S', 'Thời trang', 480000, 1100000, 'Như mới', 95, 'Đà Nẵng', 'Mặc đúng 1 lần dịp Tết, giặt khô sạch sẽ. Vải mát, đường may tỉ mỉ.', 'pending', false, 1]
];

// Ghi ảnh SVG vào thư mục uploads và trả về danh sách sản phẩm sẵn sàng insert
exports.buildProducts = (host, uploadDir, sellerId) => {
  fs.mkdirSync(uploadDir, { recursive: true });
  const now = Date.now();
  return P.map(([title, category, price, originalPrice, condition, percentNew, location, description, status, vip, nimg], i) => {
    const images = [];
    for (let k = 0; k < nimg; k++) {
      const base = `seed-${i + 1}-${k + 1}`;
      let name = `${base}.jpg`;
      // Có ảnh thật (.jpg) trong uploads thì dùng, chưa có thì tự sinh SVG
      if (!fs.existsSync(path.join(uploadDir, name))) {
        name = `${base}.svg`;
        fs.writeFileSync(path.join(uploadDir, name), svg(category, title, k));
      }
      images.push(`${host}/uploads/${name}`);
    }
    const created = new Date(now - (i * 7 + 1) * 3600e3 * 5);
    return {
      title, category, price, originalPrice, condition, percentNew, location,
      phone: '0901234567', description, images, seller: sellerId, status,
      shipping: i % 4 !== 3, vip,
      ...(vip && { vipUntil: new Date(now + 7 * 864e5) }),
      createdAt: created, updatedAt: created
    };
  });
};
