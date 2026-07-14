const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
      const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
      if (allowed.includes(ext)) cb(null, true);
      else cb(new Error('Format file tidak diizinkan'));
    },
    limits: { fileSize: 2 * 1024 * 1024 },
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
      const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
      if (allowed.includes(ext)) cb(null, true);
      else cb(new Error('Format file tidak diizinkan'));
    },
    limits: { fileSize: 2 * 1024 * 1024 },
  }).fields(Object.keys(fieldDirMap).map((name) => ({ name, maxCount: 1 })));
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

module.exports = { createUploader, createFieldMappedUploader, safeUploadPath };
