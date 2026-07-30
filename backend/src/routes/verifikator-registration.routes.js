const express = require('express');
const router = express.Router();
const controller = require('../controllers/verifikator-registration.controller');

router.get('/', controller.status);
router.put('/', controller.upload);
router.get('/download/:which', controller.download);

module.exports = router;
