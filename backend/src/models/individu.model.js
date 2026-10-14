const pool = require('../config/database');

// Piagam Dharma Adibhakti dan Dharma Tokoh sudah dihentikan dukungannya —
// kolomnya masih ada di DB (untuk data lama) tapi tidak lagi bisa
// diupload/ditampilkan/didownload lewat aplikasi.
const FILE_COLUMNS = [
  'file_kepka', 'file_ktp', 'file_drh', 'file_pengangkatan',
  'file_keputusan_jabatan', 'file_piagam_x', 'file_piagam_xx', 'file_piagam_xxx',
  // Berkas baru -- surat_usulan & sk_cpns_pns tidak punya padanan kolom
  // lama; piagam_penghargaan menggantikan trio piagam_x/xx/xxx di UI (kolom
  // lama tetap ada untuk data historis, lihat komentar di atas).
  'file_surat_usulan', 'file_sk_cpns_pns', 'file_piagam_penghargaan',
];

const TEXT_COLUMNS = [
  'tgl_upload', 'tgl_penghargaan', 'nama', 'instansi', 'nama_instansi', 'jabatan', 'unit_kerja', 'nipnrp', 'pangkat', 'jenis_penghargaan',
  'pemda_tipe', 'pemda_provinsi', 'pemda_kabkota',
  // Links this record to the mst_user account that owns it (stable even if
  // the account's nama changes later) — not applicant-facing data, so it's
  // deliberately excluded from PERSONAL_DATA_COLUMNS below.
  'id_user',
  // Riwayat kepegawaian -- masa kerja "di persandian" (otomatis) dihitung
  // dari 4 nilai ini saat ditampilkan, tidak disimpan (lihat utils/masa-kerja.js).
  'tgl_tmt_cpns_pns', 'masa_kerja_kumulatif_tahun', 'masa_kerja_kumulatif_bulan',
  'masa_kerja_pengurangan_tahun', 'masa_kerja_pengurangan_bulan',
  // Judul bebas per berkas (mis. "Keputusan Bupati ... tentang ... tanggal ...").
  'judul_ktp', 'judul_drh', 'judul_surat_usulan', 'judul_sk_cpns_pns', 'judul_pengangkatan', 'judul_keputusan_jabatan', 'judul_piagam_penghargaan',
];

const VERIFIKASI_COLUMNS = [
  'verifikasi_data_status', 'verifikasi_data_oleh', 'verifikasi_data_at', 'verifikasi_data_catatan',
  'verifikasi_berkas_status', 'verifikasi_berkas_oleh', 'verifikasi_berkas_at', 'verifikasi_berkas_catatan',
];

// Column names are baked into SQL as raw identifiers below (not bound as
// parameters), so only ever accept keys present in this whitelist — never
// pass through arbitrary Object.keys(req.body) as SQL identifiers.
const ALLOWED_COLUMNS = new Set([...TEXT_COLUMNS, ...FILE_COLUMNS, ...VERIFIKASI_COLUMNS]);

// Fields that make up the "data pribadi" a Verifikator checks — used by
// callers to decide whether an edit should reset verifikasi_data_status
// back to 'Menunggu' (only compares keys actually present in `incoming`).
const PERSONAL_DATA_COLUMNS = [
  'instansi', 'nama_instansi', 'jabatan', 'unit_kerja', 'pangkat', 'jenis_penghargaan',
  'pemda_tipe', 'pemda_provinsi', 'pemda_kabkota',
  'tgl_tmt_cpns_pns', 'masa_kerja_kumulatif_tahun', 'masa_kerja_kumulatif_bulan',
  'masa_kerja_pengurangan_tahun', 'masa_kerja_pengurangan_bulan',
];

function personalDataChanged(existing, incoming) {
  return PERSONAL_DATA_COLUMNS.some(
    (k) => incoming[k] !== undefined && (existing?.[k] || '') !== (incoming[k] || '')
  );
}

const VERIFIKASI_RESET_DATA = {
  verifikasi_data_status: 'Menunggu', verifikasi_data_oleh: null, verifikasi_data_at: null, verifikasi_data_catatan: null,
};
const VERIFIKASI_RESET_BERKAS = {
  verifikasi_berkas_status: 'Menunggu', verifikasi_berkas_oleh: null, verifikasi_berkas_at: null, verifikasi_berkas_catatan: null,
};

const IndividuModel = {
  async findAll({ tahun, jenis, instansi } = {}) {
    let query = 'SELECT * FROM data_individu WHERE 1=1';
    const params = [];
    let idx = 1;

    if (tahun) {
      query += ' AND EXTRACT(YEAR FROM tgl_penghargaan) = $' + idx;
      params.push(parseInt(tahun));
      idx++;
    }
    if (jenis) {
      query += ' AND jenis_penghargaan = $' + idx;
      params.push(jenis);
      idx++;
    }
    if (instansi) {
      query += ' AND instansi = $' + idx;
      params.push(instansi);
      idx++;
    }

    query += ' ORDER BY tgl_upload DESC NULLS LAST';
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM data_individu WHERE id = $1', [id]);
    return rows[0] || null;
  },

  // db defaults to the shared pool; pass a transaction client to participate
  // in a caller's BEGIN/COMMIT (e.g. bulk-import's confirmBatch).
  async create(data, db = pool) {
    const cols = ['tgl_upload', 'tgl_penghargaan', 'nama', 'instansi', 'jabatan', 'unit_kerja', 'nipnrp', 'pangkat', 'jenis_penghargaan'];
    const vals = [
      data.tgl_upload || new Date().toISOString().split('T')[0],
      data.tgl_penghargaan,
      data.nama,
      data.instansi || null,
      data.jabatan || null,
      data.unit_kerja || null,
      data.nipnrp,
      data.pangkat || null,
      data.jenis_penghargaan || null,
    ];

    for (const fc of FILE_COLUMNS) {
      if (data[fc] !== undefined) {
        cols.push(fc);
        vals.push(data[fc]);
      }
    }

    // Riwayat kepegawaian & judul berkas -- opsional saat create, sisanya
    // dilengkapi lewat update() (profil User / edit Admin).
    const optionalTextCols = [
      'pemda_tipe', 'pemda_provinsi', 'pemda_kabkota',
      'tgl_tmt_cpns_pns', 'masa_kerja_kumulatif_tahun', 'masa_kerja_kumulatif_bulan',
      'masa_kerja_pengurangan_tahun', 'masa_kerja_pengurangan_bulan',
      'judul_ktp', 'judul_drh', 'judul_surat_usulan', 'judul_sk_cpns_pns', 'judul_pengangkatan', 'judul_keputusan_jabatan', 'judul_piagam_penghargaan',
    ];
    for (const c of optionalTextCols) {
      if (data[c] !== undefined) {
        cols.push(c);
        vals.push(data[c]);
      }
    }

    if (data.id_user !== undefined) {
      cols.push('id_user');
      vals.push(data.id_user);
    }

    const ph = cols.map((_, i) => '$' + (i + 1));
    const query = 'INSERT INTO data_individu (' + cols.join(', ') + ') VALUES (' + ph.join(', ') + ') RETURNING *';
    const { rows } = await db.query(query, vals);
    return rows[0];
  },

  async update(id, data, db = pool) {
    const sets = [];
    const params = [];
    let idx = 1;

    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && ALLOWED_COLUMNS.has(k)) {
        sets.push(k + ' = $' + idx);
        params.push(v);
        idx++;
      }
    }

    if (sets.length === 0) return null;
    params.push(id);

    const { rows } = await db.query(
      'UPDATE data_individu SET ' + sets.join(', ') + ', updated_at = NOW() WHERE id = $' + idx + ' RETURNING *',
      params
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM data_individu WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async filters() {
    const [tahun, jenis, instansi] = await Promise.all([
      pool.query('SELECT DISTINCT EXTRACT(YEAR FROM tgl_penghargaan)::int AS year FROM data_individu WHERE tgl_penghargaan IS NOT NULL ORDER BY year DESC'),
      pool.query('SELECT DISTINCT jenis_penghargaan FROM data_individu WHERE jenis_penghargaan IS NOT NULL ORDER BY jenis_penghargaan ASC'),
      pool.query('SELECT DISTINCT instansi FROM data_individu WHERE instansi IS NOT NULL ORDER BY instansi ASC'),
    ]);

    return {
      tahun: tahun.rows.map(r => r.year),
      jenis: jenis.rows.map(r => r.jenis_penghargaan),
      instansi: instansi.rows.map(r => r.instansi),
    };
  },

  FILE_COLUMNS,
  personalDataChanged,
  VERIFIKASI_RESET_DATA,
  VERIFIKASI_RESET_BERKAS,
};

module.exports = IndividuModel;
