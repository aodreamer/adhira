const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { withTransaction } = pool;
const IndividuModel = require('./individu.model');
const { rowSchema } = require('../services/import-parser');

function normalizeUsernameBase(nipnrp) {
  const cleaned = (nipnrp || '').toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return cleaned.length >= 3 ? cleaned : 'user' + crypto.randomInt(1000, 9999);
}

// 10 chars from a confusable-character-free alphabet, with a letter and a
// digit forced in so it always satisfies the app's password Joi pattern.
function generatePassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = letters + digits;
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += all[crypto.randomInt(all.length)];
  pwd += letters[crypto.randomInt(letters.length)];
  pwd += digits[crypto.randomInt(digits.length)];
  return pwd;
}

async function generateUniqueUsername(base, client) {
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const { rows } = await client.query('SELECT 1 FROM mst_user WHERE username = $1', [candidate]);
    if (rows.length === 0) return candidate;
    suffix++;
    candidate = base + '-' + suffix;
  }
}

async function findMatchByNipnrp(nipnrp, db) {
  const { rows } = await db.query('SELECT * FROM data_individu WHERE nipnrp = $1 LIMIT 1', [nipnrp]);
  return rows[0] || null;
}

// Runs inside confirmBatch's outer transaction, on its own SAVEPOINT — a
// thrown error here rolls back only this row's writes, not the whole batch.
async function confirmRow(row, instansi, client) {
  const existing = await findMatchByNipnrp(row.nipnrp, client);
  const individuUpdates = {
    nama: row.nama, instansi, jabatan: row.jabatan, unit_kerja: row.unit_kerja, pangkat: row.pangkat,
    jenis_penghargaan: row.jenis_penghargaan,
    tgl_tmt_cpns_pns: row.tgl_tmt_cpns_pns || null,
    masa_kerja_kumulatif_tahun: row.masa_kerja_kumulatif_tahun ?? null,
    masa_kerja_kumulatif_bulan: row.masa_kerja_kumulatif_bulan ?? null,
    masa_kerja_pengurangan_tahun: row.masa_kerja_pengurangan_tahun ?? null,
    masa_kerja_pengurangan_bulan: row.masa_kerja_pengurangan_bulan ?? null,
    pemda_tipe: row.pemda_tipe || null, pemda_provinsi: row.pemda_provinsi || null, pemda_kabkota: row.pemda_kabkota || null,
  };

  if (existing && existing.id_user) {
    // Login account already exists — refresh archive data only, never touch
    // mst_user/password just because this candidate reappears in a batch.
    const updates = { ...individuUpdates };
    if (IndividuModel.personalDataChanged(existing, updates)) Object.assign(updates, IndividuModel.VERIFIKASI_RESET_DATA);
    const updated = await IndividuModel.update(existing.id, updates, client);
    const { rows: r } = await client.query(
      `UPDATE import_batch_row SET result_status = 'Updated', result_id_individu = $2, result_id_user = $3 WHERE id = $1 RETURNING *`,
      [row.id, updated.id, existing.id_user]
    );
    return r[0];
  }

  // Either a brand-new candidate, or an existing archive row with no login
  // account yet (legacy import) — either way, a new mst_user account is
  // created and linked via id_user.
  if (row.email) {
    const { rows: emailRows } = await client.query('SELECT 1 FROM mst_user WHERE LOWER(email) = LOWER($1)', [row.email]);
    if (emailRows.length > 0) throw new Error('Email sudah terdaftar untuk akun lain');
  }

  const username = await generateUniqueUsername(normalizeUsernameBase(row.nipnrp), client);
  const plainPassword = generatePassword();
  const hashed = await bcrypt.hash(plainPassword, 10);

  const { rows: userRows } = await client.query(
    `INSERT INTO mst_user (nama, email, hp, username, password, level, image, date_created, is_active, must_change_password)
     VALUES ($1,$2,$3,$4,$5,'User','default.jpg',CURRENT_DATE,1,1) RETURNING id_user`,
    [row.nama, row.email, row.hp || '', username, hashed]
  );
  const idUser = userRows[0].id_user;

  let individuId;
  if (existing) {
    const updates = { ...individuUpdates, id_user: idUser };
    if (IndividuModel.personalDataChanged(existing, updates)) Object.assign(updates, IndividuModel.VERIFIKASI_RESET_DATA);
    const updated = await IndividuModel.update(existing.id, updates, client);
    individuId = updated.id;
  } else {
    const created = await IndividuModel.create({
      tgl_penghargaan: new Date().toISOString().split('T')[0],
      nipnrp: row.nipnrp, jenis_penghargaan: row.jenis_penghargaan, id_user: idUser,
      ...individuUpdates,
    }, client);
    individuId = created.id;
  }

  const { rows: r } = await client.query(
    `UPDATE import_batch_row SET result_status = 'Created', result_id_individu = $2, result_id_user = $3,
       generated_username = $4, generated_password_plain = $5
     WHERE id = $1 RETURNING *`,
    [row.id, individuId, idUser, username, plainPassword]
  );
  return r[0];
}

const ImportBatchModel = {
  async createBatch({ idUserVerifikator, instansi, rows }) {
    return withTransaction(async (client) => {
      // Duplicate detection against the live table happens here (not in the
      // pure parser), right before persisting the preview, so the badge shown
      // to the Verifikator reflects current data at upload time.
      for (const r of rows) {
        if (r.row_status !== 'Error' && r.nipnrp) {
          const existing = await findMatchByNipnrp(r.nipnrp, client);
          if (existing) {
            r.row_status = 'DuplicateUpdate';
            r.match_id_individu = existing.id;
            r.match_id_user = existing.id_user || null;
          }
        }
      }

      const { rows: batchRows } = await client.query(
        `INSERT INTO import_batch (id_user_verifikator, instansi, total_rows) VALUES ($1, $2, $3) RETURNING *`,
        [idUserVerifikator, instansi, rows.length]
      );
      const batch = batchRows[0];

      const insertedRows = [];
      for (const r of rows) {
        const { rows: inserted } = await client.query(
          `INSERT INTO import_batch_row
             (id_batch, row_number, nama, nipnrp, email, hp, jabatan, unit_kerja, pangkat, jenis_penghargaan,
              tgl_tmt_cpns_pns, masa_kerja_kumulatif_tahun, masa_kerja_kumulatif_bulan,
              masa_kerja_pengurangan_tahun, masa_kerja_pengurangan_bulan,
              pemda_tipe, pemda_provinsi, pemda_kabkota, row_status, errors, match_id_individu, match_id_user)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
           RETURNING *`,
          [
            batch.id, r.row_number, r.nama, r.nipnrp, r.email, r.hp || null, r.jabatan, r.unit_kerja || null, r.pangkat, r.jenis_penghargaan || null,
            r.tgl_tmt_cpns_pns || null, r.masa_kerja_kumulatif_tahun ?? null, r.masa_kerja_kumulatif_bulan ?? null,
            r.masa_kerja_pengurangan_tahun ?? null, r.masa_kerja_pengurangan_bulan ?? null,
            r.pemda_tipe || null, r.pemda_provinsi || null, r.pemda_kabkota || null, r.row_status,
            r.errors && r.errors.length ? JSON.stringify(r.errors) : null, r.match_id_individu || null, r.match_id_user || null,
          ]
        );
        insertedRows.push(inserted[0]);
      }

      return { ...batch, rows: insertedRows };
    });
  },

  async listBatchesByVerifikator(idUserVerifikator) {
    const { rows } = await pool.query(
      'SELECT * FROM import_batch WHERE id_user_verifikator = $1 ORDER BY created_at DESC',
      [idUserVerifikator]
    );
    return rows;
  },

  async findBatchById(id, idUserVerifikator) {
    const { rows } = await pool.query(
      'SELECT * FROM import_batch WHERE id = $1 AND id_user_verifikator = $2',
      [id, idUserVerifikator]
    );
    if (rows.length === 0) return null;
    const { rows: rowRows } = await pool.query(
      'SELECT * FROM import_batch_row WHERE id_batch = $1 ORDER BY row_number',
      [id]
    );
    return { ...rows[0], rows: rowRows };
  },

  async updateRow(rowId, idUserVerifikator, data) {
    // Only rows belonging to a batch this Verifikator owns, still in Preview,
    // can be edited — confirmed/discarded batches are immutable history.
    const { rows: owned } = await pool.query(
      `SELECT r.*, b.instansi, b.status AS batch_status FROM import_batch_row r
       JOIN import_batch b ON b.id = r.id_batch
       WHERE r.id = $1 AND b.id_user_verifikator = $2`,
      [rowId, idUserVerifikator]
    );
    if (owned.length === 0) return null;
    const row = owned[0];
    if (row.batch_status !== 'Preview') throw new Error('Batch sudah tidak bisa diedit');

    const merged = {
      nama: data.nama ?? row.nama, nipnrp: data.nipnrp ?? row.nipnrp, email: data.email ?? row.email, hp: data.hp ?? row.hp,
      jabatan: data.jabatan ?? row.jabatan, unit_kerja: data.unit_kerja ?? row.unit_kerja, pangkat: data.pangkat ?? row.pangkat,
      jenis_penghargaan: data.jenis_penghargaan ?? row.jenis_penghargaan,
      pemda_tipe: data.pemda_tipe ?? row.pemda_tipe, pemda_provinsi: data.pemda_provinsi ?? row.pemda_provinsi,
      pemda_kabkota: data.pemda_kabkota ?? row.pemda_kabkota,
    };
    const schema = rowSchema(row.instansi);
    const { error, value } = schema.validate(merged, { abortEarly: false, stripUnknown: true });
    const errors = (error?.details || []).map((d) => ({ field: d.path[0], message: d.message }));

    let rowStatus = errors.length > 0 ? 'Error' : 'Valid';
    let matchIndividu = null;
    let matchUser = null;
    if (rowStatus === 'Valid' && value.nipnrp) {
      const existing = await findMatchByNipnrp(value.nipnrp, pool);
      if (existing) {
        rowStatus = 'DuplicateUpdate';
        matchIndividu = existing.id;
        matchUser = existing.id_user || null;
      }
    }

    const { rows: updated } = await pool.query(
      `UPDATE import_batch_row SET
         nama=$1, nipnrp=$2, email=$3, hp=$4, jabatan=$5, unit_kerja=$6, pangkat=$7, jenis_penghargaan=$8,
         pemda_tipe=$9, pemda_provinsi=$10, pemda_kabkota=$11, row_status=$12, errors=$13,
         match_id_individu=$14, match_id_user=$15
       WHERE id = $16 RETURNING *`,
      [
        value.nama, value.nipnrp, (value.email || '').toLowerCase(), value.hp || null, value.jabatan, value.unit_kerja || null, value.pangkat, value.jenis_penghargaan,
        value.pemda_tipe || null, value.pemda_provinsi || null, value.pemda_kabkota || null, rowStatus,
        errors.length ? JSON.stringify(errors) : null, matchIndividu, matchUser, rowId,
      ]
    );
    return updated[0];
  },

  async discardBatch(id, idUserVerifikator) {
    const { rows } = await pool.query(
      `UPDATE import_batch SET status = 'Discarded' WHERE id = $1 AND id_user_verifikator = $2 AND status = 'Preview' RETURNING *`,
      [id, idUserVerifikator]
    );
    return rows[0] || null;
  },

  async confirmBatch(id, idUserVerifikator) {
    const batch = await ImportBatchModel.findBatchById(id, idUserVerifikator);
    if (!batch) return null;
    if (batch.status !== 'Preview') throw new Error('Batch sudah dikonfirmasi atau dibatalkan');

    const rowResults = await withTransaction(async (client) => {
      const results = [];
      for (const row of batch.rows) {
        if (row.row_status === 'Error') {
          const { rows: r } = await client.query(
            `UPDATE import_batch_row SET result_status = 'Skipped' WHERE id = $1 RETURNING *`,
            [row.id]
          );
          results.push(r[0]);
          continue;
        }

        const savepoint = 'sp_row_' + row.id;
        await client.query('SAVEPOINT ' + savepoint);
        try {
          results.push(await confirmRow(row, batch.instansi, client));
          await client.query('RELEASE SAVEPOINT ' + savepoint);
        } catch (err) {
          await client.query('ROLLBACK TO SAVEPOINT ' + savepoint);
          const { rows: r } = await client.query(
            `UPDATE import_batch_row SET result_status = 'Failed', errors = $2 WHERE id = $1 RETURNING *`,
            [row.id, JSON.stringify([{ field: null, message: err.message }])]
          );
          results.push(r[0]);
        }
      }

      await client.query(
        `UPDATE import_batch SET status = 'Confirmed', confirmed_at = NOW(), confirmed_by = $2 WHERE id = $1`,
        [id, idUserVerifikator]
      );
      return results;
    });

    return { ...batch, status: 'Confirmed', rows: rowResults };
  },
};

module.exports = ImportBatchModel;
