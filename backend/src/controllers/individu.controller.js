const fs = require('fs');
const { createFieldMappedUploader, safeUploadPath } = require('../middleware/upload');
const IndividuModel = require('../models/individu.model');
const VerifikatorModel = require('../models/verifikator.model');

const uploadDirs = {
  file_kepka: 'kepka',
  file_ktp: 'ktp',
  file_drh: 'drh',
  file_pengangkatan: 'pengangkatan',
  file_keputusan_jabatan: 'keputusan',
  file_piagam_x: 'piagamx',
  file_piagam_xx: 'piagamxx',
  file_piagam_xxx: 'piagamxxx',
  file_surat_usulan: 'surat_usulan',
  file_sk_cpns_pns: 'sk_cpns_pns',
  file_piagam_penghargaan: 'piagam_penghargaan',
};

const multiUpload = createFieldMappedUploader(uploadDirs);

async function list(req, res) {
  try {
    const data = await IndividuModel.findAll(req.query);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
}

async function getById(req, res) {
  try {
    const data = await IndividuModel.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
}

async function create(req, res) {
  multiUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const fileData = {};
      for (const fc of IndividuModel.FILE_COLUMNS) {
        if (req.files && req.files[fc] && req.files[fc][0]) {
          fileData[fc] = req.files[fc][0].filename;
        }
      }
      // File columns must only ever come from a real upload (fileData), never
      // from the raw request body — otherwise a client could set e.g.
      // file_ktp to an arbitrary path string and read it back via the
      // download endpoint (path traversal).
      const { ...body } = req.body;
      for (const fc of IndividuModel.FILE_COLUMNS) delete body[fc];
      const data = await IndividuModel.create({ ...body, ...fileData });
      res.status(201).json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Gagal menyimpan data' });
    }
  });
}

async function update(req, res) {
  multiUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const existing = await IndividuModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Data tidak ditemukan' });

      const fileData = {};
      for (const [fc, dir] of Object.entries(uploadDirs)) {
        if (req.files && req.files[fc] && req.files[fc][0]) {
          if (existing[fc]) {
            const oldPath = safeUploadPath(dir, existing[fc]);
            if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          fileData[fc] = req.files[fc][0].filename;
        }
      }

      const { ...body } = req.body;
      for (const fc of IndividuModel.FILE_COLUMNS) delete body[fc];

      const updates = { ...body, ...fileData };
      if (IndividuModel.personalDataChanged(existing, body)) Object.assign(updates, IndividuModel.VERIFIKASI_RESET_DATA);
      if (Object.keys(fileData).length > 0) Object.assign(updates, IndividuModel.VERIFIKASI_RESET_BERKAS);

      const data = await IndividuModel.update(req.params.id, updates);
      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Gagal update data' });
    }
  });
}

async function remove(req, res) {
  try {
    const row = await IndividuModel.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Data tidak ditemukan' });

    for (const [fc, dir] of Object.entries(uploadDirs)) {
      if (row[fc]) {
        const filePath = safeUploadPath(dir, row[fc]);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    await IndividuModel.remove(req.params.id);
    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
}

async function download(req, res) {
  try {
    const { id, fileColumn } = req.params;
    if (!IndividuModel.FILE_COLUMNS.includes(fileColumn)) {
      return res.status(400).json({ error: 'Kolom file tidak valid' });
    }

    const row = await IndividuModel.findById(id);
    if (!row || !row[fileColumn]) {
      return res.status(404).json({ error: 'File tidak ditemukan' });
    }

    const dir = uploadDirs[fileColumn];
    const filePath = safeUploadPath(dir, row[fileColumn]);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File tidak ditemukan di server' });
    }

    res.download(filePath, row[fileColumn]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal download file' });
  }
}

async function filters(req, res) {
  try {
    const data = await IndividuModel.filters();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil filter' });
  }
}

// PUT /individu/:id/verifikasi-data & /verifikasi-berkas -- Admin bisa
// memverifikasi paralel dengan Verifikator, tanpa batasan cakupan instansi.
// Admin selalu bisa override (tidak pernah dikunci), berbeda dari
// verifikator.controller.js yang menolak override keputusan Admin.
async function verifikasiData(req, res) {
  try {
    const { status, catatan } = req.body;
    if (!['Disetujui', 'Ditolak'].includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
    if (status === 'Ditolak' && !catatan) return res.status(400).json({ error: 'Catatan wajib diisi saat menolak' });

    const existing = await IndividuModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Data tidak ditemukan' });

    const updated = await VerifikatorModel.setVerifikasiData(req.params.id, { status, oleh: req.user.id_user, catatan });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memverifikasi data pribadi' });
  }
}

async function verifikasiBerkas(req, res) {
  try {
    const { status, catatan } = req.body;
    if (!['Disetujui', 'Ditolak'].includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
    if (status === 'Ditolak' && !catatan) return res.status(400).json({ error: 'Catatan wajib diisi saat menolak' });

    const existing = await IndividuModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Data tidak ditemukan' });

    const updated = await VerifikatorModel.setVerifikasiBerkas(req.params.id, { status, oleh: req.user.id_user, catatan });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memverifikasi berkas' });
  }
}

module.exports = { list, getById, create, update, remove, download, filters, verifikasiData, verifikasiBerkas };
