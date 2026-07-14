const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const self = require('../controllers/user-self.controller');
const { selfProfileSchema, changePasswordSchema } = require('../validators/user.validator');

router.get('/profile', authenticate, self.profile);
router.put('/profile', authenticate, validate(selfProfileSchema), self.updateProfile);
router.put('/password', authenticate, validate(changePasswordSchema), self.changePassword);
router.put('/usulan', authenticate, self.uploadBerkas);
router.get('/usulan/download/:fileColumn', authenticate, self.downloadBerkas);

module.exports = router;
