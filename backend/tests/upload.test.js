const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

// createRegistrationUploader() writes to disk under process.env.UPLOAD_PATH,
// so point it at a throwaway temp dir for the duration of these tests.
const tmpUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adhira-upload-test-'));
process.env.UPLOAD_PATH = tmpUploadDir;

const { createRegistrationUploader } = require('../src/middleware/upload');

function buildApp() {
  const app = express();
  const uploader = createRegistrationUploader();
  app.post('/upload', uploader, (req, res) => {
    res.json({ files: Object.keys(req.files || {}) });
  });
  app.use((err, req, res, next) => {
    res.status(400).json({ error: err.message });
  });
  return app;
}

const PDF_BUFFER = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');
const XLSX_BUFFER = Buffer.from('PK\x03\x04fake-xlsx-content');

describe('surat usulan PDF upload (createRegistrationUploader)', () => {
  const app = buildApp();

  test('accepts a .pdf for file_surat_usulan and .xlsx for file_excel_usulan', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file_surat_usulan', PDF_BUFFER, { filename: 'surat-usulan.pdf', contentType: 'application/pdf' })
      .attach('file_excel_usulan', XLSX_BUFFER, { filename: 'usulan.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    expect(res.status).toBe(200);
    expect(res.body.files.sort()).toEqual(['file_excel_usulan', 'file_surat_usulan']);
  });

  test('rejects a non-PDF file for file_surat_usulan', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file_surat_usulan', Buffer.from('not a pdf'), { filename: 'surat-usulan.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/PDF/i);
  });

  test('rejects a non-xlsx file for file_excel_usulan', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file_excel_usulan', Buffer.from('not excel'), { filename: 'usulan.csv', contentType: 'text/csv' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/xlsx/i);
  });

  test('rejects a file larger than the 5MB registration limit', async () => {
    const bigBuffer = Buffer.concat([PDF_BUFFER, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await request(app)
      .post('/upload')
      .attach('file_surat_usulan', bigBuffer, { filename: 'surat-usulan.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });
});

afterAll(() => {
  fs.rmSync(tmpUploadDir, { recursive: true, force: true });
});
