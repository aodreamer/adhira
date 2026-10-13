const UserModel = require('../models/user.model');

// Verifikator hasil registrasi mandiri punya reg_status ('Pending'/'Ditolak'/
// 'Disetujui') yang mengunci akses ke fitur Verifikator sampai Admin acc
// berkas registrasinya. Verifikator lama (dibuat manual, reg_status NULL)
// tidak pernah lewat alur ini sehingga tetap diizinkan.
async function requireApprovedVerifikator(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id_user);
    if (!user) return res.status(401).json({ error: 'Tidak terautentikasi' });
    if (user.reg_status && user.reg_status !== 'Disetujui') {
      return res.status(403).json({ error: 'Akun Anda belum disetujui Admin. Silakan lengkapi/tunggu persetujuan registrasi.' });
    }
    next();
  } catch (err) {
    console.error('requireApprovedVerifikator error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan internal' });
  }
}

module.exports = requireApprovedVerifikator;
