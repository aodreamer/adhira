const pool = require('../config/database');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT c.id, c.kode, c.keterangan, c.expired_at, c.is_active, c.created_at,
            (SELECT COUNT(*) FROM mst_user u WHERE u.reg_code_id = c.id) AS usage_count
     FROM verifikator_registration_code c
     ORDER BY c.created_at DESC`
  );
  return rows;
}

async function findValidByKode(kode) {
  const { rows } = await pool.query(
    `SELECT id, kode FROM verifikator_registration_code
     WHERE kode = $1 AND is_active = TRUE AND expired_at > NOW()`,
    [kode]
  );
  return rows[0] || null;
}

async function create({ kode, keterangan, expired_at, created_by }) {
  const { rows } = await pool.query(
    `INSERT INTO verifikator_registration_code (kode, keterangan, expired_at, created_by)
     VALUES ($1, $2, $3, $4) RETURNING id, kode, keterangan, expired_at, is_active, created_at`,
    [kode, keterangan || null, expired_at, created_by]
  );
  return rows[0];
}

async function setActive(id, is_active) {
  const { rows } = await pool.query(
    `UPDATE verifikator_registration_code SET is_active = $1 WHERE id = $2
     RETURNING id, kode, keterangan, expired_at, is_active, created_at`,
    [is_active, id]
  );
  return rows[0] || null;
}

module.exports = { findAll, findValidByKode, create, setActive };
