const pool = require('../config/database');

const FILE_COLUMNS = [
  'file_kepka', 'file_ktp', 'file_drh', 'file_pengangkatan',
  'file_keputusan_jabatan', 'file_piagam_x', 'file_piagam_xx',
  'file_piagam_xxx', 'file_piagam_adibhakti', 'file_piagam_tokoh',
];

const TEXT_COLUMNS = [
  'tgl_upload', 'tgl_penghargaan', 'nama', 'instansi', 'jabatan', 'unit_kerja', 'nipnrp', 'pangkat', 'jenis_penghargaan',
  'pemda_tipe', 'pemda_provinsi', 'pemda_kabkota',
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
  'instansi', 'jabatan', 'unit_kerja', 'pangkat', 'jenis_penghargaan',
  'pemda_tipe', 'pemda_provinsi', 'pemda_kabkota',
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

  async create(data) {
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

    const ph = cols.map((_, i) => '$' + (i + 1));
    const query = 'INSERT INTO data_individu (' + cols.join(', ') + ') VALUES (' + ph.join(', ') + ') RETURNING *';
    const { rows } = await pool.query(query, vals);
    return rows[0];
  },

  async update(id, data) {
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

    const { rows } = await pool.query(
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
