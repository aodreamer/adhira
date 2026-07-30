const multer = require('multer');
const path = require('path');
const fs = require('fs');

const DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
const DOC_SIZE_LIMIT = 2 * 1024 * 1024;

function createUploader(dir) {
  const uploadPath = path.join(process.env.UPLOAD_PATH || 'uploads', dir);
  fs.mkdirSync(uploadPath, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, dir + '-' + suffix + path.extname(file.originalname));
    },
  });

  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (DOC_EXTENSIONS.includes(ext)) cb(null, true);
      else cb(new Error('Format file tidak diizinkan'));
    },
    limits: { fileSize: DOC_SIZE_LIMIT },
  });
}

// Like createUploader, but for a single multer instance backing several
// named file fields (e.g. individu's file_kepka, file_ktp, ...) that must
// each land in their own subdirectory — fieldDirMap maps fieldname -> subdir.
// A single shared destination would put every field's file in the same
// folder, which download/delete logic (keyed by the field's own subdir)
// would then never find.
function createFieldMappedUploader(fieldDirMap) {
  const base = process.env.UPLOAD_PATH || 'uploads';
  for (const dir of new Set(Object.values(fieldDirMap))) {
    fs.mkdirSync(path.join(base, dir), { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = fieldDirMap[file.fieldname];
      if (!dir) return cb(new Error('Field upload tidak dikenali'));
      cb(null, path.join(base, dir));
    },
    filename: (req, file, cb) => {
      const dir = fieldDirMap[file.fieldname];
      const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, dir + '-' + suffix + path.extname(file.originalname));
    },
  });

  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (DOC_EXTENSIONS.includes(ext)) cb(null, true);
      else cb(new Error('Format file tidak diizinkan'));
    },
    limits: { fileSize: DOC_SIZE_LIMIT },
  }).fields(Object.keys(fieldDirMap).map((name) => ({ name, maxCount: 1 })));
}

// For parsing an uploaded spreadsheet (template) in-memory — the file itself
// is transient input (never stored on disk or referenced later), only the
// rows parsed out of it matter, so memoryStorage avoids needing any cleanup.
const SPREADSHEET_EXTENSIONS = ['.xlsx'];
const SPREADSHEET_SIZE_LIMIT = 5 * 1024 * 1024;

function createSpreadsheetUploader() {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (SPREADSHEET_EXTENSIONS.includes(ext)) cb(null, true);
      else cb(new Error('Format file harus .xlsx'));
    },
    limits: { fileSize: SPREADSHEET_SIZE_LIMIT },
  });
}

// Registrasi mandiri Verifikator: dua field dengan aturan ekstensi berbeda
// (surat usulan wajib PDF, excel usulan wajib .xlsx) dalam satu multipart
// request -- createFieldMappedUploader tidak bisa dipakai karena fileFilter
// di sana seragam untuk semua field.
const REGISTRATION_FIELD_RULES = {
  file_surat_usulan: { dir: 'registrasi-surat', extensions: ['.pdf'] },
  file_excel_usulan: { dir: 'registrasi-excel', extensions: ['.xlsx'] },
};
const REGISTRATION_SIZE_LIMIT = 5 * 1024 * 1024;

function createRegistrationUploader() {
  const base = process.env.UPLOAD_PATH || 'uploads';
  for (const { dir } of Object.values(REGISTRATION_FIELD_RULES)) {
    fs.mkdirSync(path.join(base, dir), { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const rule = REGISTRATION_FIELD_RULES[file.fieldname];
      if (!rule) return cb(new Error('Field upload tidak dikenali'));
      cb(null, path.join(base, rule.dir));
    },
    filename: (req, file, cb) => {
      const rule = REGISTRATION_FIELD_RULES[file.fieldname];
      const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, rule.dir + '-' + suffix + path.extname(file.originalname));
    },
  });

  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      const rule = REGISTRATION_FIELD_RULES[file.fieldname];
      const ext = path.extname(file.originalname).toLowerCase();
      if (rule && rule.extensions.includes(ext)) cb(null, true);
      else cb(new Error(file.fieldname === 'file_excel_usulan' ? 'Excel usulan harus berformat .xlsx' : 'Surat usulan harus berformat .pdf'));
    },
    limits: { fileSize: REGISTRATION_SIZE_LIMIT },
  }).fields(Object.keys(REGISTRATION_FIELD_RULES).map((name) => ({ name, maxCount: 1 })));
}

// Resolves a stored filename against its upload directory and guarantees the
// result can't escape that directory via `..` or an absolute path segment —
// defense in depth in case a `..`-laden value ever ends up in a file column
// (e.g. from a legacy import), so download endpoints can't be used to read
// arbitrary files off disk.
function safeUploadPath(subDir, filename) {
  const base = path.resolve(process.env.UPLOAD_PATH || 'uploads', subDir);
  const resolved = path.resolve(base, filename);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) return null;
  return resolved;
}

module.exports = { createUploader, createFieldMappedUploader, createSpreadsheetUploader, createRegistrationUploader, safeUploadPath };
