const express = require('express');
const router = express.Router();
const controller = require('../controllers/verifikator.controller');

router.get('/scope', controller.scope);
router.get('/stats', controller.stats);
router.get('/queue', controller.queue);
router.get('/:id', controller.getById);
router.get('/:id/download/:fileColumn', controller.download);
router.put('/:id/data', controller.verifikasiData);
router.put('/:id/berkas', controller.verifikasiBerkas);

module.exports = router;
