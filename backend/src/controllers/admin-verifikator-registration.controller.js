const fs = require('fs');
const pool = require('../config/database');
const { safeUploadPath } = require('../middleware/upload');

const uploadDirs = { file_surat_usulan: 'registrasi-surat', file_excel_usulan: 'registrasi-excel' };

// GET /admin/verifikator-registrations -- semua akun Verifikator yang lewat jalur registrasi mandiri
async function list(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id_user, u.nama, u.email, u.hp, u.username, u.date_created,
              u.reg_status, u.reg_catatan, u.reg_reviewed_at, u.reg_file_surat_usulan, u.reg_file_excel_usulan,
              u.reg_nipnrp, u.reg_pangkat, u.reg_jabatan, u.reg_unit_kerja,
              (SELECT STRING_AGG(vi.instansi, ', ') FROM verifikator_instansi vi WHERE vi.id_user = u.id_user) AS instansi
       FROM mst_user u
       WHERE u.level = 'Verifikator' AND u.reg_status IS NOT NULL
       ORDER BY u.date_created DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil daftar registrasi' });
  }
}

// GET /admin/verifikator-registrations/:id/download/:which
async function download(req, res) {
  try {
    const { id, which } = req.params;
    const fc = 'file_' + which;
    if (!uploadDirs[fc]) return res.status(400).json({ error: 'Berkas tidak dikenali' });

    const { rows } = await pool.query(
      "SELECT reg_" + fc + " AS filename FROM mst_user WHERE id_user = $1 AND level = 'Verifikator'",
      [id]
    );
    if (rows.length === 0 || !rows[0].filename) return res.status(404).json({ error: 'Berkas tidak ditemukan' });

    const filePath = safeUploadPath(uploadDirs[fc], rows[0].filename);
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Berkas tidak ditemukan di server' });

    res.download(filePath, rows[0].filename);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal download berkas' });
  }
}

// PUT /admin/verifikator-registrations/:id -- {status: 'Disetujui'|'Ditolak', catatan}
async function review(req, res) {
  try {
    const { status, catatan } = req.body;
    if (!['Disetujui', 'Ditolak'].includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
    if (status === 'Ditolak' && !catatan) return res.status(400).json({ error: 'Catatan wajib diisi saat menolak' });

    const { rows } = await pool.query(
      `UPDATE mst_user SET reg_status = $1, reg_catatan = $2, reg_reviewed_by = $3, reg_reviewed_at = NOW(), updated_at = NOW()
       WHERE id_user = $4 AND level = 'Verifikator' AND reg_status IS NOT NULL
       RETURNING id_user, nama, reg_status, reg_catatan, reg_reviewed_at`,
      [status, catatan || null, req.user.id_user, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Registrasi tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memproses registrasi' });
  }
}

module.exports = { list, download, review };
