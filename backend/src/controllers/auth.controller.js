const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');
const UserModel = require('../models/user.model');
const VerifikatorModel = require('../models/verifikator.model');
const CodeModel = require('../models/verifikator-code.model');

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak percobaan login dari perangkat ini. Silakan coba lagi setelah 5 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak percobaan registrasi dari perangkat ini. Silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

async function login(req, res) {
  try {
    const { username, password } = req.body;

    const user = await UserModel.findByUsername(username);
    // Run a dummy bcrypt compare even when the user doesn't exist, so response
    // timing doesn't reveal whether the username is registered.
    if (!user) {
      await bcrypt.compare(password, '$2a$10$CwTycUXWue0Thq9StjUM0uJ8T6/xkfMbWTBZ5H8LqB4LNbYY0.4c6');
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({
        error: `Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${minutesLeft} menit.`,
      });
    }

    if (user.is_active !== 1) return res.status(403).json({ error: 'Akun tidak aktif' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const { locked } = await UserModel.recordFailedLogin(user.id_user, user.failed_attempts || 0);
      if (locked) {
        return res.status(423).json({
          error: 'Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.',
        });
      }
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    await UserModel.recordSuccessfulLogin(user.id_user);

    const payload = { id_user: user.id_user, username: user.username, nama: user.nama, level: user.level };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });

    res.json({
      token,
      user: {
        id_user: user.id_user, username: user.username, nama: user.nama, level: user.level,
        must_change_password: user.must_change_password === 1,
        reg_status: user.reg_status || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan internal' });
  }
}

async function me(req, res) {
  const user = await UserModel.findById(req.user.id_user);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  res.json(user);
}

async function register(req, res) {
  try {
    // level is always forced to 'User' here — registration can never grant
    // elevated access; only an existing Admin can promote an account later.
    const { nama, email, hp, username, password, nipnrp, instansi, jabatan, unit_kerja, pangkat } = req.body;

    const exists = await UserModel.findByUsername(username);
    if (exists) return res.status(400).json({ error: 'Username sudah terdaftar' });

    const nipExists = await pool.query('SELECT id FROM data_individu WHERE nipnrp = $1', [nipnrp]);
    if (nipExists.rows.length > 0) {
      return res.status(400).json({ error: 'NIP/NRP sudah terdaftar dalam sistem' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      nama, email: email || '', hp: hp || '', username, password: hashed, level: 'User', is_active: 1,
    });

    await pool.query(
      `INSERT INTO data_individu (nipnrp, nama, instansi, jabatan, unit_kerja, pangkat, jenis_penghargaan, tgl_penghargaan, tgl_upload, id_user)
       VALUES ($1,$2,$3,$4,$5,$6,'Sedang Diajukan',CURRENT_DATE,CURRENT_DATE,$7)`,
      [nipnrp, nama, instansi || '', jabatan || '', unit_kerja || '', pangkat || '', user.id_user]
    );

    res.status(201).json({
      message: 'Registrasi berhasil. Silakan login.',
      user: { id_user: user.id_user, username: user.username, nama: user.nama, level: user.level },
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.constraint === 'mst_user_username_key') {
      return res.status(400).json({ error: 'Username sudah terdaftar' });
    }
    if (err.constraint === 'idx_user_email_unique') {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }
    res.status(500).json({ error: 'Terjadi kesalahan saat registrasi' });
  }
}

// Registrasi mandiri untuk perwakilan instansi (Dewan Penghargaan). Akun
// dibuat dengan level Verifikator langsung, tapi reg_status='Pending'
// mengunci akses ke fitur Verifikator biasa sampai Admin acc berkas
// registrasinya (lihat router guard di frontend dan authorize di routes).
async function registerVerifikator(req, res) {
  try {
    const { kode_pendaftaran, nama, email, hp, username, password, instansi, nipnrp, jabatan, unit_kerja, pangkat } = req.body;

    const code = await CodeModel.findValidByKode(kode_pendaftaran);
    if (!code) return res.status(400).json({ error: 'Kode pendaftaran tidak valid atau sudah kadaluarsa' });

    const exists = await UserModel.findByUsername(username);
    if (exists) return res.status(400).json({ error: 'Username sudah terdaftar' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      nama, email, hp, username, password: hashed, level: 'Verifikator', is_active: 1, reg_status: 'Pending',
      reg_nipnrp: nipnrp, reg_pangkat: pangkat, reg_jabatan: jabatan, reg_unit_kerja: unit_kerja,
      reg_code_id: code.id,
    });

    await VerifikatorModel.setScope(user.id_user, [instansi]);

    res.status(201).json({
      message: 'Registrasi berhasil. Silakan login untuk mengupload surat usulan dan menunggu persetujuan Admin.',
      user: { id_user: user.id_user, username: user.username, nama: user.nama, level: user.level },
    });
  } catch (err) {
    console.error('Register verifikator error:', err);
    if (err.constraint === 'mst_user_username_key') {
      return res.status(400).json({ error: 'Username sudah terdaftar' });
    }
    if (err.constraint === 'idx_user_email_unique') {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }
    res.status(500).json({ error: 'Terjadi kesalahan saat registrasi' });
  }
}

module.exports = { login, me, register, registerVerifikator, loginLimiter, registerLimiter };
