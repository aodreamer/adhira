const pool = require('../config/database');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Column names below are concatenated directly into SQL as raw identifiers,
// so update() must never accept arbitrary Object.keys(data) — only this set.
const ALLOWED_UPDATE_COLUMNS = new Set(['nama', 'email', 'hp', 'level', 'is_active', 'password', 'image']);

const UserModel = {
  async findAll(search) {
    let query = 'SELECT id_user, nama, email, hp, username, level, image, date_created, is_active, last_login_at FROM mst_user';
    const params = [];
    if (search) {
      query += ' WHERE nama ILIKE $1 OR username ILIKE $1 OR email ILIKE $1';
      params.push('%' + search + '%');
    }
    query += ' ORDER BY id_user DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id_user, nama, email, hp, username, level, image, date_created, is_active, last_login_at, must_change_password, reg_status, reg_catatan FROM mst_user WHERE id_user = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findByUsername(username) {
    const { rows } = await pool.query(
      'SELECT * FROM mst_user WHERE username = $1',
      [username]
    );
    return rows[0] || null;
  },

  // db defaults to the shared pool; pass a transaction client to participate
  // in a caller's BEGIN/COMMIT (e.g. bulk-import's confirmBatch).
  async create(data, db = pool) {
    const { rows } = await db.query(
      `INSERT INTO mst_user (nama, email, hp, username, password, level, image, date_created, is_active, must_change_password, reg_status, reg_nipnrp, reg_pangkat, reg_jabatan, reg_unit_kerja, reg_code_id, reg_nama_instansi, reg_pemda_tipe, reg_pemda_provinsi, reg_pemda_kabkota)
       VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id_user, nama, email, hp, username, level, date_created, is_active, reg_status`,
      [
        data.nama, data.email, data.hp, data.username, data.password, data.level || 'User', data.image || 'default.jpg',
        data.is_active ?? 1, data.must_change_password ?? 0, data.reg_status || null, data.reg_nipnrp || null, data.reg_pangkat || null,
        data.reg_jabatan || null, data.reg_unit_kerja || null, data.reg_code_id || null,
        data.reg_nama_instansi || null, data.reg_pemda_tipe || null, data.reg_pemda_provinsi || null, data.reg_pemda_kabkota || null,
      ]
    );
    return rows[0];
  },

  async update(id, data) {
    const sets = [];
    const params = [];
    let idx = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && ALLOWED_UPDATE_COLUMNS.has(k)) {
        sets.push(k + ' = $' + idx);
        params.push(v);
        idx++;
      }
    }
    if (sets.length === 0) return null;
    params.push(id);
    const { rows } = await pool.query(
      'UPDATE mst_user SET ' + sets.join(', ') + ', updated_at = NOW() WHERE id_user = $' + idx + ' RETURNING id_user, nama, email, hp, username, level, date_created, is_active',
      params
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM mst_user WHERE id_user = $1', [id]);
    return rowCount > 0;
  },

  async countActiveAdmins(excludeId) {
    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM mst_user WHERE level = 'Admin' AND is_active = 1 AND id_user != $1",
      [excludeId || 0]
    );
    return parseInt(rows[0].count, 10);
  },

  async recordFailedLogin(id, currentFailedAttempts) {
    const attempts = currentFailedAttempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    await pool.query(
      `UPDATE mst_user SET failed_attempts = $1,
              locked_until = ${lock ? "NOW() + INTERVAL '" + LOCKOUT_MINUTES + " minutes'" : 'locked_until'}
       WHERE id_user = $2`,
      [attempts, id]
    );
    return { attempts, locked: lock };
  },

  async recordSuccessfulLogin(id) {
    await pool.query(
      'UPDATE mst_user SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id_user = $1',
      [id]
    );
  },

  async stats() {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM mst_user) AS total,
        (SELECT COUNT(*) FROM mst_user WHERE is_active = 1) AS aktif,
        (SELECT COUNT(*) FROM mst_user WHERE is_active = 0) AS tak_aktif,
        (SELECT COUNT(*) FROM mst_user WHERE date_created >= date_trunc('month', CURRENT_DATE)) AS perbulan
    `);
    return rows[0];
  },
};

module.exports = UserModel;
