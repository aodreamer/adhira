const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/verifikator-import.controller');
const { createSpreadsheetUploader } = require('../middleware/upload');

const uploadSpreadsheet = createSpreadsheetUploader();

// Each confirm can mint many accounts at once, so the real throttle here is
// "batches per hour", not a per-row request count.
const confirmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Terlalu banyak percobaan konfirmasi impor. Silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/template', controller.template);
router.post('/upload', uploadSpreadsheet.single('file'), controller.upload);
router.get('/batches', controller.listBatches);
router.get('/batches/:id', controller.getBatch);
router.put('/batches/:id/rows/:rowId', controller.updateRow);
router.post('/batches/:id/confirm', confirmLimiter, controller.confirm);
router.delete('/batches/:id', controller.discardBatch);

module.exports = router;
