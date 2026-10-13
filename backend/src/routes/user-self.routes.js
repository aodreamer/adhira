const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const self = require('../controllers/user-self.controller');
const { selfProfileSchema, changePasswordSchema } = require('../validators/user.validator');

function restrictLeaderProfile(req, res, next) {
  if (req.user.level === 'Pimpinan' && Object.keys(req.body).some(key => !['nama', 'email', 'hp'].includes(key))) {
    return res.status(403).json({ error: 'Pimpinan hanya dapat mengubah profil akun sendiri' });
  }
  next();
}

router.get('/profile', authenticate, self.profile);
router.put('/profile', authenticate, restrictLeaderProfile, validate(selfProfileSchema), self.updateProfile);
router.put('/password', authenticate, validate(changePasswordSchema), self.changePassword);
router.put('/usulan', authenticate, authorize('User'), self.uploadBerkas);
router.get('/usulan/download/:fileColumn', authenticate, authorize('User'), self.downloadBerkas);

module.exports = router;
