const pool = require('../config/database');

async function index(req, res) {
  try {
    const [stats, perTahun, perJenis, perInstansi, recentPemberitahuan, docCounts] = await Promise.all([
      pool.query(`SELECT
        (SELECT COUNT(*) FROM mst_user) AS total_user,
        (SELECT COUNT(*) FROM mst_user WHERE is_active=1) AS user_aktif,
        (SELECT COUNT(*) FROM mst_user WHERE is_active=0) AS user_tak_aktif,
        (SELECT COUNT(*) FROM mst_user WHERE date_created >= date_trunc('month', CURRENT_DATE)) AS user_bulan_ini,
        (SELECT COUNT(*) FROM data_individu) AS total_individu,
        (SELECT COUNT(*) FROM tb_surat_pemberitahuan) AS total_pemberitahuan,
        (SELECT COUNT(*) FROM tb_laporan_kegiatan) AS total_laporan,
        (SELECT COUNT(*) FROM tb_usulan) AS total_usulan,
        (SELECT COUNT(*) FROM tb_distribusi) AS total_distribusi`),
      pool.query('SELECT EXTRACT(YEAR FROM tgl_penghargaan)::int AS tahun, COUNT(*) AS jumlah FROM data_individu WHERE tgl_penghargaan IS NOT NULL GROUP BY tahun ORDER BY tahun ASC'),
      pool.query('SELECT jenis_penghargaan AS jenis, COUNT(*) AS jumlah FROM data_individu WHERE jenis_penghargaan IS NOT NULL GROUP BY jenis_penghargaan ORDER BY jumlah DESC'),
      pool.query('SELECT instansi, COUNT(*) AS jumlah FROM data_individu WHERE instansi IS NOT NULL GROUP BY instansi ORDER BY jumlah DESC LIMIT 10'),
      pool.query('SELECT id, nama, nipnrp, instansi, jenis_penghargaan, tgl_penghargaan, tgl_upload FROM data_individu ORDER BY tgl_upload DESC NULLS LAST LIMIT 10'),
      pool.query(`SELECT
        'pemberitahuan' AS modul, COUNT(*) AS jumlah FROM tb_surat_pemberitahuan
        UNION ALL SELECT 'laporan', COUNT(*) FROM tb_laporan_kegiatan
        UNION ALL SELECT 'usulan', COUNT(*) FROM tb_usulan
        UNION ALL SELECT 'distribusi', COUNT(*) FROM tb_distribusi`)
    ]);

    res.json({
      stats: stats.rows[0],
      penghargaanPerTahun: perTahun.rows,
      penghargaanPerJenis: perJenis.rows,
      penghargaanPerInstansi: perInstansi.rows,
      recentIndividu: recentPemberitahuan.rows,
      docCounts: docCounts.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Gagal mengambil data dashboard' });
  }
}

module.exports = { index };
