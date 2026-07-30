const pool = require('../config/database');
const VerifikatorModel = require('../models/verifikator.model');
const ImportBatchModel = require('../models/import-batch.model');
const { parseTemplateBuffer, generateTemplateWorkbook } = require('../services/import-parser');
const { sendCredentialsEmail } = require('../services/mailer');

// GET /verifikator/import/template
async function template(req, res) {
  try {
    const buffer = await generateTemplateWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template-usulan-dharma-persandian.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat template' });
  }
}

// POST /verifikator/import/upload — parse only, no writes to mst_user/data_individu.
async function upload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'File template wajib diunggah' });
    const { instansi } = req.body;
    if (!instansi) return res.status(400).json({ error: 'Instansi wajib dipilih' });

    const scope = await VerifikatorModel.getScope(req.user.id_user);
    if (!scope.includes(instansi)) return res.status(403).json({ error: 'Instansi di luar cakupan Anda' });

    const { headerErrors, rows } = await parseTemplateBuffer(req.file.buffer, instansi);
    if (headerErrors.length > 0) return res.status(400).json({ error: headerErrors[0], details: headerErrors });

    const batch = await ImportBatchModel.createBatch({ idUserVerifikator: req.user.id_user, instansi, rows });
    res.status(201).json(batch);
  } catch (err) {
    console.error(err);
    if (err.message === 'Format file harus .xlsx') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Gagal memproses file' });
  }
}

// GET /verifikator/import/batches
async function listBatches(req, res) {
  try {
    const batches = await ImportBatchModel.listBatchesByVerifikator(req.user.id_user);
    res.json(batches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil daftar batch' });
  }
}

// GET /verifikator/import/batches/:id
async function getBatch(req, res) {
  try {
    const batch = await ImportBatchModel.findBatchById(req.params.id, req.user.id_user);
    if (!batch) return res.status(404).json({ error: 'Batch tidak ditemukan' });
    res.json(batch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data batch' });
  }
}

// PUT /verifikator/import/batches/:id/rows/:rowId
async function updateRow(req, res) {
  try {
    const updated = await ImportBatchModel.updateRow(req.params.rowId, req.user.id_user, req.body);
    if (!updated) return res.status(404).json({ error: 'Baris tidak ditemukan' });
    res.json(updated);
  } catch (err) {
    if (err.message === 'Batch sudah tidak bisa diedit') return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Gagal mengubah baris' });
  }
}

// POST /verifikator/import/batches/:id/confirm
async function confirm(req, res) {
  try {
    const result = await ImportBatchModel.confirmBatch(req.params.id, req.user.id_user);
    if (!result) return res.status(404).json({ error: 'Batch tidak ditemukan' });

    // Emails go out only after the DB transaction has committed — a slow or
    // failed send must never roll back the accounts that were just created.
    for (const row of result.rows) {
      if (row.result_status === 'Created' && row.email) {
        const outcome = await sendCredentialsEmail({
          to: row.email, nama: row.nama, username: row.generated_username,
          password: row.generated_password_plain, instansi: result.instansi,
        });
        const emailStatus = outcome.status === 'sent' ? 'Sent' : outcome.status === 'failed' ? 'Failed' : 'Queued';
        await pool.query('UPDATE import_batch_row SET email_status = $1 WHERE id = $2', [emailStatus, row.id]);
        row.email_status = emailStatus;
      }
    }

    res.json(result);
  } catch (err) {
    if (err.message === 'Batch sudah dikonfirmasi atau dibatalkan') return res.status(400).json({ error: err.message });
    // Never log row data here — a failure could otherwise put a generated
    // plaintext password into server logs.
    console.error('Confirm batch error:', err.message);
    res.status(500).json({ error: 'Gagal mengonfirmasi batch' });
  }
}

// DELETE /verifikator/import/batches/:id
async function discardBatch(req, res) {
  try {
    const batch = await ImportBatchModel.discardBatch(req.params.id, req.user.id_user);
    if (!batch) return res.status(404).json({ error: 'Batch tidak ditemukan atau sudah tidak bisa dibatalkan' });
    res.json(batch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membatalkan batch' });
  }
}

module.exports = { template, upload, listBatches, getBatch, updateRow, confirm, discardBatch };
