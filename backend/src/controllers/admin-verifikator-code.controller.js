const crypto = require('crypto');
const CodeModel = require('../models/verifikator-code.model');

function generateKode() {
  return crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 karakter, mis. 3F9A2B7C1D
}

// GET /admin/verifikator-codes
async function list(req, res) {
  try {
    const rows = await CodeModel.findAll();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil daftar kode pendaftaran' });
  }
}

// POST /admin/verifikator-codes -- { keterangan, expired_at }
async function create(req, res) {
  try {
    const { keterangan, expired_at } = req.body;
    if (!expired_at) return res.status(400).json({ error: 'Tanggal kadaluarsa wajib diisi' });
    const expiredDate = new Date(expired_at);
    if (Number.isNaN(expiredDate.getTime()) || expiredDate <= new Date()) {
      return res.status(400).json({ error: 'Tanggal kadaluarsa harus di masa depan' });
    }

    const kode = generateKode();
    const row = await CodeModel.create({ kode, keterangan, expired_at: expiredDate, created_by: req.user.id_user });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat kode pendaftaran' });
  }
}

// PUT /admin/verifikator-codes/:id -- { is_active }
async function setActive(req, res) {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'is_active harus boolean' });
    const row = await CodeModel.setActive(req.params.id, is_active);
    if (!row) return res.status(404).json({ error: 'Kode tidak ditemukan' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui kode pendaftaran' });
  }
}

module.exports = { list, create, setActive };
