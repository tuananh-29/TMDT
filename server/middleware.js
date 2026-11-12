const jwt = require('jsonwebtoken'), { User } = require('./models');
const SECRET = () => process.env.JWT_SECRET || 'cho-do-cu-secret-key-2026';

exports.auth = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const { id } = jwt.verify(t, SECRET());
    const u = await User.findById(id);
    if (!u || u.banned) throw 0;
    req.user = u;
    next();
  } catch {
    res.status(401).json({ message: 'Cần đăng nhập hoặc tài khoản đã bị khóa' });
  }
};

exports.role = r => (req, res, next) => req.user.role === r ? next() : res.status(403).json({ message: 'Không đủ quyền truy cập' });
exports.w = f => (q, s, n) => f(q, s, n).catch(n);
exports.SECRET = SECRET;
