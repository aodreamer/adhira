const fs = require('fs');
const VerifikatorModel = require('../models/verifikator.model');
const IndividuModel = require('../models/individu.model');
const { safeUploadPath } = require('../middleware/upload');

const uploadDirs = {
  file_kepka: 'kepka', file_ktp: 'ktp', file_drh: 'drh', file_pengangkatan: 'pengangkatan',
  file_keputusan_jabatan: 'keputusan', file_piagam_x: 'piagamx', file_piagam_xx: 'piagamxx',
  file_piagam_xxx: 'piagamxxx',
  file_surat_usulan: 'surat_usulan', file_sk_cpns_pns: 'sk_cpns_pns', file_piagam_penghargaan: 'piagam_penghargaan',
};

// GET /verifikator/scope
async function scope(req, res) {
  try {
    const instansi = await VerifikatorModel.getScope(req.user.id_user);
    res.json({ instansi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil cakupan instansi' });
  }
}

// GET /verifikator/stats
async function stats(req, res) {
  try {
    const userScope = await VerifikatorModel.getScope(req.user.id_user);
    const data = await VerifikatorModel.stats(userScope);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil statistik' });
  }
}

// GET /verifikator/queue
async function queue(req, res) {
  try {
    const userScope = await VerifikatorModel.getScope(req.user.id_user);
    const { tahun, jenis, instansi, statusData, statusBerkas } = req.query;
    if (instansi && !userScope.includes(instansi)) {
      return res.status(403).json({ error: 'Instansi di luar cakupan Anda' });
    }
    const rows = await VerifikatorModel.findQueue(userScope, { tahun, jenis, instansi, statusData, statusBerkas });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil antrian verifikasi' });
  }
}

// GET /verifikator/:id
async function getById(req, res) {
  try {
    const userScope = await VerifikatorModel.getScope(req.user.id_user);
    const row = await VerifikatorModel.findByIdInScope(req.params.id, userScope);
    if (!row) return res.status(404).json({ error: 'Data tidak ditemukan atau di luar cakupan Anda' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
}

// PUT /verifikator/:id/data
async function verifikasiData(req, res) {
  try {
    const { status, catatan } = req.body;
    if (!['Disetujui', 'Ditolak'].includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
    if (status === 'Ditolak' && !catatan) return res.status(400).json({ error: 'Catatan wajib diisi saat menolak' });

    const userScope = await VerifikatorModel.getScope(req.user.id_user);
    const existing = await VerifikatorModel.findByIdInScope(req.params.id, userScope);
    if (!existing) return res.status(404).json({ error: 'Data tidak ditemukan atau di luar cakupan Anda' });
    if (await VerifikatorModel.isSetByAdmin(existing.verifikasi_data_oleh)) {
      return res.status(403).json({ error: 'Keputusan sudah dikunci oleh Admin' });
    }

    const updated = await VerifikatorModel.setVerifikasiData(req.params.id, { status, oleh: req.user.id_user, catatan });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memverifikasi data pribadi' });
  }
}

// PUT /verifikator/:id/berkas
async function verifikasiBerkas(req, res) {
  try {
    const { status, catatan } = req.body;
    if (!['Disetujui', 'Ditolak'].includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
    if (status === 'Ditolak' && !catatan) return res.status(400).json({ error: 'Catatan wajib diisi saat menolak' });

    const userScope = await VerifikatorModel.getScope(req.user.id_user);
    const existing = await VerifikatorModel.findByIdInScope(req.params.id, userScope);
    if (!existing) return res.status(404).json({ error: 'Data tidak ditemukan atau di luar cakupan Anda' });
    if (await VerifikatorModel.isSetByAdmin(existing.verifikasi_berkas_oleh)) {
      return res.status(403).json({ error: 'Keputusan sudah dikunci oleh Admin' });
    }

    const updated = await VerifikatorModel.setVerifikasiBerkas(req.params.id, { status, oleh: req.user.id_user, catatan });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memverifikasi berkas' });
  }
}

// GET /verifikator/:id/download/:fileColumn
async function download(req, res) {
  try {
    const { id, fileColumn } = req.params;
    if (!IndividuModel.FILE_COLUMNS.includes(fileColumn)) {
      return res.status(400).json({ error: 'Kolom file tidak valid' });
    }

    const userScope = await VerifikatorModel.getScope(req.user.id_user);
    const row = await VerifikatorModel.findByIdInScope(id, userScope);
    if (!row || !row[fileColumn]) return res.status(404).json({ error: 'File tidak ditemukan' });

    const dir = uploadDirs[fileColumn];
    const filePath = safeUploadPath(dir, row[fileColumn]);
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'File tidak ditemukan di server' });

    res.download(filePath, row[fileColumn]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal download file' });
  }
}

module.exports = { scope, stats, queue, getById, verifikasiData, verifikasiBerkas, download };
