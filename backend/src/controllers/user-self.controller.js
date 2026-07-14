// Self-service controller untuk user biasa (non-admin)
const fs = require('fs');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { createFieldMappedUploader, safeUploadPath } = require('../middleware/upload');
const IndividuModel = require('../models/individu.model');
const UserModel = require('../models/user.model');
const { isProfileComplete } = require('../utils/profile-completeness');

const uploadDir = {
  file_kepka: 'kepka', file_ktp: 'ktp', file_drh: 'drh', file_pengangkatan: 'pengangkatan',
  file_keputusan_jabatan: 'keputusan', file_piagam_x: 'piagamx', file_piagam_xx: 'piagamxx',
  file_piagam_xxx: 'piagamxxx', file_piagam_adibhakti: 'adibhakti', file_piagam_tokoh: 'tokoh',
};
const multiUpload = createFieldMappedUploader(uploadDir);

// GET /user/self/profile — ambil profil diri
async function profile(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id_user, u.nama, u.email, u.hp, u.username, u.level, u.image, u.date_created,
              d.id as individu_id, d.nipnrp, d.instansi, d.jabatan, d.unit_kerja, d.pangkat, d.jenis_penghargaan,
              d.pemda_tipe, d.pemda_provinsi, d.pemda_kabkota,
              d.verifikasi_data_status, d.verifikasi_data_catatan,
              d.verifikasi_berkas_status, d.verifikasi_berkas_catatan,
              d.tgl_penghargaan, d.tgl_upload,
              d.file_kepka, d.file_ktp, d.file_drh, d.file_pengangkatan,
              d.file_keputusan_jabatan, d.file_piagam_x, d.file_piagam_xx,
              d.file_piagam_xxx, d.file_piagam_adibhakti, d.file_piagam_tokoh
       FROM mst_user u LEFT JOIN data_individu d ON u.nama = d.nama
       WHERE u.id_user = $1 ORDER BY d.id LIMIT 1`,
      [req.user.id_user]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ ...rows[0], profileComplete: isProfileComplete(rows[0], rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil profil' });
  }
}

// PUT /user/self/profile — update profil (mst_user) + data instansi/jabatan/pangkat (data_individu)
async function updateProfile(req, res) {
  try {
    const { nama, email, hp, instansi, jabatan, unit_kerja, pangkat, pemda_tipe, pemda_provinsi, pemda_kabkota } = req.body;

    const current = await pool.query('SELECT nama FROM mst_user WHERE id_user = $1', [req.user.id_user]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    const currentNama = current.rows[0].nama;

    const sets = []; const params = []; let idx = 1;
    if (nama !== undefined) { sets.push('nama = $' + idx); params.push(nama); idx++; }
    if (email !== undefined) { sets.push('email = $' + idx); params.push(email); idx++; }
    if (hp !== undefined) { sets.push('hp = $' + idx); params.push(hp); idx++; }

    let updatedUser = null;
    if (sets.length > 0) {
      params.push(req.user.id_user);
      const { rows } = await pool.query(
        'UPDATE mst_user SET ' + sets.join(', ') + ', updated_at = NOW() WHERE id_user = $' + idx + ' RETURNING id_user, nama, email, hp, username, level',
        params
      );
      updatedUser = rows[0];
    }

    let updatedIndividu = null;
    const incomingIndividu = { instansi, jabatan, unit_kerja, pangkat, pemda_tipe, pemda_provinsi, pemda_kabkota };
    if (Object.values(incomingIndividu).some((v) => v !== undefined)) {
      // Linked by matching nama (pre-update value, so a nama change in this
      // same request doesn't orphan the lookup) — same fragile association
      // used by profile()/uploadBerkas() elsewhere in this controller.
      const individu = await pool.query('SELECT * FROM data_individu WHERE nama = $1 ORDER BY id LIMIT 1', [currentNama]);
      if (individu.rows.length > 0) {
        const updates = { ...incomingIndividu };
        if (IndividuModel.personalDataChanged(individu.rows[0], incomingIndividu)) {
          Object.assign(updates, IndividuModel.VERIFIKASI_RESET_DATA);
        }
        updatedIndividu = await IndividuModel.update(individu.rows[0].id, updates);
      }
    }

    if (!updatedUser && !updatedIndividu) return res.status(400).json({ error: 'Tidak ada data yang diubah' });

    res.json({
      ...(updatedUser || {}),
      instansi: updatedIndividu?.instansi,
      jabatan: updatedIndividu?.jabatan,
      unit_kerja: updatedIndividu?.unit_kerja,
      pangkat: updatedIndividu?.pangkat,
      pemda_tipe: updatedIndividu?.pemda_tipe,
      pemda_provinsi: updatedIndividu?.pemda_provinsi,
      pemda_kabkota: updatedIndividu?.pemda_kabkota,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal update profil' });
  }
}

// PUT /user/self/password — ganti password sendiri
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    const { rows } = await pool.query('SELECT password FROM mst_user WHERE id_user = $1', [req.user.id_user]);
    if (rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Password saat ini salah' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE mst_user SET password = $1, updated_at = NOW() WHERE id_user = $2',
      [hashed, req.user.id_user]
    );
    await UserModel.recordSuccessfulLogin(req.user.id_user);

    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengubah password' });
  }
}

// PUT /user/self/usulan — upload berkas usulan
async function uploadBerkas(req, res) {
  // Checked before multiUpload runs (not inside its callback) so an
  // incomplete profile is rejected before any file is written to disk.
  try {
    const user = await pool.query('SELECT nama, email, hp FROM mst_user WHERE id_user = $1', [req.user.id_user]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

    const precheck = await pool.query('SELECT * FROM data_individu WHERE nama = $1 ORDER BY id LIMIT 1', [user.rows[0].nama]);
    if (!isProfileComplete(user.rows[0], precheck.rows[0] || null)) {
      return res.status(403).json({ error: 'Lengkapi data profil (instansi, jabatan, pangkat, dan data wilayah bila instansi Pemerintah Daerah) di halaman Profil Saya sebelum mengupload berkas.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gagal memeriksa kelengkapan profil' });
  }

  multiUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      // Cari data_individu milik user ini
      const user = await pool.query('SELECT nama FROM mst_user WHERE id_user = $1', [req.user.id_user]);
      if (user.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

      const { rows } = await pool.query(
        'SELECT id FROM data_individu WHERE nama = $1 AND nipnrp = $2 LIMIT 1',
        [user.rows[0].nama, req.body.nipnrp]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Data individu tidak ditemukan. Registrasi ulang mungkin diperlukan.' });

      const individuId = rows[0].id;
      const existing = await IndividuModel.findById(individuId);

      const fileData = {};
      for (const [fc, dir] of Object.entries(uploadDir)) {
        if (req.files && req.files[fc] && req.files[fc][0]) {
          if (existing[fc]) {
            const oldPath = safeUploadPath(dir, existing[fc]);
            if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          fileData[fc] = req.files[fc][0].filename;
        }
      }

      // Update data individu fields
      const sets = []; const params = []; let idx = 1;
      const textFields = ['instansi', 'jabatan', 'pangkat', 'jenis_penghargaan'];
      for (const f of textFields) {
        if (req.body[f]) { sets.push(f + ' = $' + idx); params.push(req.body[f]); idx++; }
      }
      for (const [fc, val] of Object.entries(fileData)) {
        sets.push(fc + ' = $' + idx); params.push(val); idx++;
      }
      if (Object.keys(fileData).length > 0) {
        for (const [k, v] of Object.entries(IndividuModel.VERIFIKASI_RESET_BERKAS)) {
          sets.push(k + ' = $' + idx); params.push(v); idx++;
        }
      }
      sets.push('tgl_upload = CURRENT_DATE');

      if (sets.length > 0) {
        params.push(individuId);
        await pool.query(
          'UPDATE data_individu SET ' + sets.join(', ') + ', updated_at = NOW() WHERE id = $' + idx,
          params
        );
      }

      const updated = await IndividuModel.findById(individuId);
      res.json({ message: 'Berkas berhasil diupload', data: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Gagal upload berkas' });
    }
  });
}

// GET /user/self/usulan/download/:fileColumn — download file sendiri
async function downloadBerkas(req, res) {
  try {
    const { fileColumn } = req.params;
    if (!IndividuModel.FILE_COLUMNS.includes(fileColumn)) return res.status(400).json({ error: 'Kolom tidak valid' });

    const user = await pool.query('SELECT nama FROM mst_user WHERE id_user = $1', [req.user.id_user]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

    const { rows } = await pool.query('SELECT * FROM data_individu WHERE nama = $1 ORDER BY id LIMIT 1', [user.rows[0].nama]);
    if (rows.length === 0 || !rows[0][fileColumn]) return res.status(404).json({ error: 'File tidak ditemukan' });

    const dir = uploadDir[fileColumn];
    const filePath = safeUploadPath(dir, rows[0][fileColumn]);
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'File tidak ditemukan di server' });

    res.download(filePath, rows[0][fileColumn]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal download' });
  }
}

module.exports = { profile, updateProfile, changePassword, uploadBerkas, downloadBerkas };
