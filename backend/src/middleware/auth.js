const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const verifiedAccount = Symbol('verifiedAccount');

async function authenticate(req, res, next) {
  if (req[verifiedAccount]) return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
  }
  try {
    // A role change to Pimpinan must revoke operational access immediately,
    // including sessions created while the account was an Admin or User.
    const { rows } = await pool.query('SELECT level, is_active FROM mst_user WHERE id_user = $1', [decoded.id_user]);
    const user = rows[0];
    if (!user || user.is_active !== 1) return res.status(401).json({ error: 'Akun tidak aktif atau tidak tersedia' });
    req.user = { ...decoded, level: user.level };
    req[verifiedAccount] = true;
    next();
  } catch (err) {
    console.error('Authentication account check error:', err);
    return res.status(500).json({ error: 'Gagal memeriksa akun' });
  }
}

module.exports = authenticate;
