const express = require('express');
const fs = require('fs');
const pool = require('../config/database');
const { createUploader, safeUploadPath } = require('../middleware/upload');

function makeDocumentRouter(tableName, fileField, uploadDir, allowedFields) {
  const router = express.Router();
  const upload = createUploader(uploadDir).single(fileField);

  // Column names below are concatenated directly into SQL as raw identifiers,
  // so request-body keys must be filtered through this whitelist before ever
  // reaching a query — never spread req.body straight into the column list.
  function pickAllowedFields(body) {
    const data = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return data;
  }

  // GET / — list with optional filters
  router.get('/', async (req, res) => {
    try {
      let query = 'SELECT * FROM ' + tableName + ' WHERE 1=1';
      const params = [];
      let idx = 1;

      const filters = { tahun: null, jenis: null, instansi: null };
      if (tableName === 'tb_surat_pemberitahuan') {
        filters.tahun = 'tahun_pemberitahuan';
        filters.jenis = 'jenis_pemberitahuan';
      } else if (tableName === 'tb_laporan_kegiatan') {
        filters.tahun = 'tahun_laporan';
        filters.jenis = 'jenis_laporan';
      } else if (tableName === 'tb_usulan') {
        filters.tahun = 'tahun_usulan';
        filters.jenis = 'jenis_usulan';
        filters.instansi = 'instansi_usulan';
      } else if (tableName === 'tb_distribusi') {
        filters.tahun = 'tahun_distribusi';
        filters.jenis = 'jenis_distribusi';
        filters.instansi = 'instansi_distribusi';
      }

      if (req.query.tahun) {
        query += ' AND ' + filters.tahun + ' = $' + idx;
        params.push(parseInt(req.query.tahun));
        idx++;
      }
      if (req.query.jenis) {
        query += ' AND ' + filters.jenis + ' = $' + idx;
        params.push(req.query.jenis);
        idx++;
      }
      if (filters.instansi && req.query.instansi) {
        query += ' AND ' + filters.instansi + ' = $' + idx;
        params.push(req.query.instansi);
        idx++;
      }

      query += ' ORDER BY id DESC';
      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal mengambil data' });
    }
  });

  // GET /filters — distinct dropdown values
  router.get('/filters', async (req, res) => {
    try {
      const filters = {};
      if (tableName === 'tb_surat_pemberitahuan') {
        filters.tahun = 'tahun_pemberitahuan';
        filters.jenis = 'jenis_pemberitahuan';
      } else if (tableName === 'tb_laporan_kegiatan') {
        filters.tahun = 'tahun_laporan';
        filters.jenis = 'jenis_laporan';
      } else if (tableName === 'tb_usulan') {
        filters.tahun = 'tahun_usulan';
        filters.jenis = 'jenis_usulan';
        filters.instansi = 'instansi_usulan';
      } else if (tableName === 'tb_distribusi') {
        filters.tahun = 'tahun_distribusi';
        filters.jenis = 'jenis_distribusi';
        filters.instansi = 'instansi_distribusi';
      }

      const result = {};
      if (filters.tahun) {
        const r = await pool.query(
          'SELECT DISTINCT ' + filters.tahun + ' as value FROM ' + tableName + ' ORDER BY value DESC'
        );
        result.tahun = r.rows.map(x => x.value);
      }
      if (filters.jenis) {
        const r = await pool.query(
          'SELECT DISTINCT ' + filters.jenis + ' as value FROM ' + tableName + ' ORDER BY value ASC'
        );
        result.jenis = r.rows.map(x => x.value);
      }
      if (filters.instansi) {
        const r = await pool.query(
          'SELECT DISTINCT ' + filters.instansi + ' as value FROM ' + tableName + ' ORDER BY value ASC'
        );
        result.instansi = r.rows.map(x => x.value);
      }
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal mengambil filter' });
    }
  });

  // GET /:id
  router.get('/:id', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM ' + tableName + ' WHERE id = $1', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal mengambil data' });
    }
  });

  // POST /
  router.post('/', (req, res) => {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      try {
        const data = pickAllowedFields(req.body);
        if (req.file) data[fileField] = req.file.filename;

        const columns = Object.keys(data);
        const values = columns.map(k => data[k]);
        const placeholders = values.map((_, i) => '$' + (i + 1));

        const { rows } = await pool.query(
          'INSERT INTO ' + tableName + ' (' + columns.join(', ') + ') VALUES (' + placeholders.join(', ') + ') RETURNING *',
          values
        );
        res.status(201).json(rows[0]);
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal menyimpan data' });
      }
    });
  });

  // PUT /:id
  router.put('/:id', (req, res) => {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      try {
        const existing = await pool.query('SELECT * FROM ' + tableName + ' WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
          return res.status(404).json({ error: 'Data tidak ditemukan' });
        }

        const data = pickAllowedFields(req.body);
        if (req.file) {
          const oldFile = existing.rows[0][fileField];
          if (oldFile) {
            const oldPath = safeUploadPath(uploadDir, oldFile);
            if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          data[fileField] = req.file.filename;
        }

        const columns = Object.keys(data);
        if (columns.length === 0) {
          return res.status(400).json({ error: 'Tidak ada data yang diupdate' });
        }

        const sets = columns.map((k, i) => k + ' = $' + (i + 1));
        const values = columns.map(k => data[k]);
        values.push(req.params.id);

        const { rows } = await pool.query(
          'UPDATE ' + tableName + ' SET ' + sets.join(', ') + ', updated_at = NOW() WHERE id = $' + values.length + ' RETURNING *',
          values
        );
        res.json(rows[0]);
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Gagal update data' });
      }
    });
  });

  // DELETE /:id
  router.delete('/:id', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM ' + tableName + ' WHERE id = $1', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });

      const oldFile = rows[0][fileField];
      if (oldFile) {
        const oldPath = safeUploadPath(uploadDir, oldFile);
        if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await pool.query('DELETE FROM ' + tableName + ' WHERE id = $1', [req.params.id]);
      res.json({ message: 'Data berhasil dihapus' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal menghapus data' });
    }
  });

  // GET /:id/download
  router.get('/:id/download', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM ' + tableName + ' WHERE id = $1', [req.params.id]);
      if (rows.length === 0 || !rows[0][fileField]) {
        return res.status(404).json({ error: 'File tidak ditemukan' });
      }

      const filePath = safeUploadPath(uploadDir, rows[0][fileField]);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File tidak ditemukan di server' });
      }

      res.download(filePath, rows[0][fileField]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal download file' });
    }
  });

  return router;
}

const pemberitahuanRouter = makeDocumentRouter(
  'tb_surat_pemberitahuan', 'file_pemberitahuan', 'pemberitahuan',
  ['nama_pemberitahuan', 'tahun_pemberitahuan', 'jenis_pemberitahuan']
);
const laporanRouter = makeDocumentRouter(
  'tb_laporan_kegiatan', 'file_laporan', 'laporan',
  ['nama_laporan', 'tahun_laporan', 'jenis_laporan']
);
const usulanRouter = makeDocumentRouter(
  'tb_usulan', 'file_usulan', 'usulan',
  ['nama_usulan', 'jenis_usulan', 'tahun_usulan', 'instansi_usulan']
);
const distribusiRouter = makeDocumentRouter(
  'tb_distribusi', 'file_distribusi', 'distribusi',
  ['nama_distribusi', 'jenis_distribusi', 'tahun_distribusi', 'instansi_distribusi']
);

module.exports = { pemberitahuanRouter, laporanRouter, usulanRouter, distribusiRouter };
