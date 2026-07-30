const pool = require('../config/database');

const VerifikatorModel = {
  async getScope(idUser) {
    const { rows } = await pool.query(
      'SELECT instansi FROM verifikator_instansi WHERE id_user = $1 ORDER BY instansi',
      [idUser]
    );
    return rows.map((r) => r.instansi);
  },

  async setScope(idUser, instansiList) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM verifikator_instansi WHERE id_user = $1', [idUser]);
      for (const instansi of instansiList) {
        await client.query(
          'INSERT INTO verifikator_instansi (id_user, instansi) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [idUser, instansi]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async clearScope(idUser) {
    await pool.query('DELETE FROM verifikator_instansi WHERE id_user = $1', [idUser]);
  },

  async findQueue(scope, { tahun, jenis, instansi, statusData, statusBerkas } = {}) {
    if (!scope || scope.length === 0) return [];
    let query = 'SELECT * FROM data_individu WHERE instansi = ANY($1)';
    const params = [scope];
    let idx = 2;

    if (tahun) { query += ' AND EXTRACT(YEAR FROM tgl_penghargaan) = $' + idx; params.push(parseInt(tahun)); idx++; }
    if (jenis) { query += ' AND jenis_penghargaan = $' + idx; params.push(jenis); idx++; }
    if (instansi) { query += ' AND instansi = $' + idx; params.push(instansi); idx++; }
    if (statusData) { query += ' AND verifikasi_data_status = $' + idx; params.push(statusData); idx++; }
    if (statusBerkas) { query += ' AND verifikasi_berkas_status = $' + idx; params.push(statusBerkas); idx++; }

    query += ' ORDER BY tgl_upload DESC NULLS LAST';
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async findByIdInScope(id, scope) {
    if (!scope || scope.length === 0) return null;
    const { rows } = await pool.query(
      'SELECT * FROM data_individu WHERE id = $1 AND instansi = ANY($2)',
      [id, scope]
    );
    return rows[0] || null;
  },

  async stats(scope) {
    if (!scope || scope.length === 0) {
      return {
        data: { Menunggu: 0, Disetujui: 0, Ditolak: 0 },
        berkas: { Menunggu: 0, Disetujui: 0, Ditolak: 0 },
      };
    }
    const { rows } = await pool.query(
      `SELECT verifikasi_data_status, verifikasi_berkas_status FROM data_individu WHERE instansi = ANY($1)`,
      [scope]
    );
    const data = { Menunggu: 0, Disetujui: 0, Ditolak: 0 };
    const berkas = { Menunggu: 0, Disetujui: 0, Ditolak: 0 };
    for (const row of rows) {
      data[row.verifikasi_data_status] = (data[row.verifikasi_data_status] || 0) + 1;
      berkas[row.verifikasi_berkas_status] = (berkas[row.verifikasi_berkas_status] || 0) + 1;
    }
    return { data, berkas };
  },

  // Keputusan Admin "mengunci" field verifikasi ini dari Verifikator (lihat
  // pengecekan di verifikator.controller.js) -- Admin sendiri tidak pernah
  // dikunci, selalu bisa override siapapun.
  async isSetByAdmin(idUser) {
    if (!idUser) return false;
    const { rows } = await pool.query('SELECT level FROM mst_user WHERE id_user = $1', [idUser]);
    return rows[0]?.level === 'Admin';
  },

  async setVerifikasiData(id, { status, oleh, catatan }) {
    const { rows } = await pool.query(
      `UPDATE data_individu
       SET verifikasi_data_status = $1, verifikasi_data_oleh = $2, verifikasi_data_at = NOW(), verifikasi_data_catatan = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, oleh, catatan || null, id]
    );
    return rows[0] || null;
  },

  async setVerifikasiBerkas(id, { status, oleh, catatan }) {
    const { rows } = await pool.query(
      `UPDATE data_individu
       SET verifikasi_berkas_status = $1, verifikasi_berkas_oleh = $2, verifikasi_berkas_at = NOW(), verifikasi_berkas_catatan = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, oleh, catatan || null, id]
    );
    return rows[0] || null;
  },
};

module.exports = VerifikatorModel;
