const jwt = require('jsonwebtoken');

// يتأكد إن الطلب فيه توكن صالح
exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'التوكن مطلوب' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'التوكن غير صالح أو منتهي' });
  }
};

// يسمح فقط للأدوار المحددة (patient أو staff)
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'ليس لديك صلاحية' });
  }
  next();
};