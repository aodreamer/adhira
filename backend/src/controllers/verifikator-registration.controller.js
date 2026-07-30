const fs = require('fs');
const pool = require('../config/database');
const { createRegistrationUploader, safeUploadPath } = require('../middleware/upload');

const uploadDirs = { file_surat_usulan: 'registrasi-surat', file_excel_usulan: 'registrasi-excel' };
const multiUpload = createRegistrationUploader();

// GET /verifikator/registration -- status registrasi milik akun sendiri
async function status(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT reg_status, reg_catatan, reg_reviewed_at, reg_file_surat_usulan, reg_file_excel_usulan FROM mst_user WHERE id_user = $1',
      [req.user.id_user]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil status registrasi' });
  }
}

// PUT /verifikator/registration -- upload/re-upload surat usulan (PDF) + excel usulan (.xlsx)
function upload(req, res) {
  multiUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const { rows } = await pool.query('SELECT * FROM mst_user WHERE id_user = $1', [req.user.id_user]);
      if (rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
      const existing = rows[0];

      const sets = []; const params = []; let idx = 1;
      for (const [fc, dir] of Object.entries(uploadDirs)) {
        if (req.files && req.files[fc] && req.files[fc][0]) {
          if (existing[fc]) {
            const oldPath = safeUploadPath(dir, existing[fc]);
            if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          const column = 'reg_' + fc;
          sets.push(column + ' = $' + idx); params.push(req.files[fc][0].filename); idx++;
        }
      }
      if (sets.length === 0) return res.status(400).json({ error: 'Tidak ada berkas yang diupload' });

      // Resubmit setelah ditolak -- balikkan ke antrian review Admin.
      if (existing.reg_status === 'Ditolak' || !existing.reg_status) {
        sets.push('reg_status = $' + idx); params.push('Pending'); idx++;
        sets.push('reg_catatan = NULL');
        sets.push('reg_reviewed_by = NULL');
        sets.push('reg_reviewed_at = NULL');
      }

      params.push(req.user.id_user);
      await pool.query('UPDATE mst_user SET ' + sets.join(', ') + ', updated_at = NOW() WHERE id_user = $' + idx, params);

      const { rows: updated } = await pool.query(
        'SELECT reg_status, reg_catatan, reg_reviewed_at, reg_file_surat_usulan, reg_file_excel_usulan FROM mst_user WHERE id_user = $1',
        [req.user.id_user]
      );
      res.json({ message: 'Berkas berhasil diupload', data: updated[0] });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Gagal upload berkas' });
    }
  });
}

// GET /verifikator/registration/download/:which -- which = surat_usulan | excel_usulan
async function download(req, res) {
  try {
    const { which } = req.params;
    const fc = 'file_' + which;
    if (!uploadDirs[fc]) return res.status(400).json({ error: 'Berkas tidak dikenali' });

    const { rows } = await pool.query('SELECT reg_' + fc + ' AS filename FROM mst_user WHERE id_user = $1', [req.user.id_user]);
    if (rows.length === 0 || !rows[0].filename) return res.status(404).json({ error: 'Berkas tidak ditemukan' });

    const filePath = safeUploadPath(uploadDirs[fc], rows[0].filename);
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Berkas tidak ditemukan di server' });

    res.download(filePath, rows[0].filename);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal download berkas' });
  }
}

module.exports = { status, upload, download };
