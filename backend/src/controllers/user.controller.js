const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const VerifikatorModel = require('../models/verifikator.model');

async function list(req, res) {
  try {
    const users = await UserModel.findAll(req.query.search);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
}

async function getById(req, res) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    const instansi_scope = user.level === 'Verifikator' ? await VerifikatorModel.getScope(user.id_user) : [];
    res.json({ ...user, instansi_scope });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
}

async function create(req, res) {
  try {
    const { nama, email, hp, username, password, level, is_active } = req.body;

    const exists = await UserModel.findByUsername(username);
    if (exists) return res.status(400).json({ error: 'Username sudah ada' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      nama,
      email: email || '',
      hp: hp || '',
      username,
      password: hashed,
      level: level || 'User',
      is_active: is_active ?? 1,
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    if (err.constraint === 'idx_user_email_unique') {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }
    res.status(500).json({ error: 'Gagal membuat user' });
  }
}

async function update(req, res) {
  try {
    const existing = await UserModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User tidak ditemukan' });

    const { nama, email, hp, level, is_active, password, instansi_scope } = req.body;
    const demoting = existing.level === 'Admin' && level !== undefined && level !== 'Admin';
    const deactivating = existing.level === 'Admin' && is_active !== undefined && Number(is_active) === 0;

    if (demoting || deactivating) {
      const remainingAdmins = await UserModel.countActiveAdmins(existing.id_user);
      if (remainingAdmins === 0) {
        return res.status(400).json({ error: 'Tidak dapat mengubah admin terakhir yang tersisa' });
      }
    }

    const data = {};
    if (nama !== undefined) data.nama = nama;
    if (email !== undefined) data.email = email;
    if (hp !== undefined) data.hp = hp;
    if (level !== undefined) data.level = level;
    if (is_active !== undefined) data.is_active = is_active;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await UserModel.update(req.params.id, data);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const finalLevel = level !== undefined ? level : existing.level;
    if (finalLevel === 'Verifikator' && instansi_scope !== undefined) {
      await VerifikatorModel.setScope(existing.id_user, instansi_scope);
    } else if (existing.level === 'Verifikator' && finalLevel !== 'Verifikator') {
      await VerifikatorModel.clearScope(existing.id_user);
    }

    const scope = finalLevel === 'Verifikator' ? await VerifikatorModel.getScope(existing.id_user) : [];
    res.json({ ...user, instansi_scope: scope });
  } catch (err) {
    console.error(err);
    if (err.constraint === 'idx_user_email_unique') {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }
    res.status(500).json({ error: 'Gagal update user' });
  }
}

async function remove(req, res) {
  try {
    const existing = await UserModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User tidak ditemukan' });

    if (existing.level === 'Admin') {
      const remainingAdmins = await UserModel.countActiveAdmins(existing.id_user);
      if (remainingAdmins === 0) {
        return res.status(400).json({ error: 'Tidak dapat menghapus admin terakhir yang tersisa' });
      }
    }

    const ok = await UserModel.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus user' });
  }
}

async function stats(req, res) {
  try {
    const data = await UserModel.stats();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil statistik' });
  }
}

module.exports = { list, getById, create, update, remove, stats };
