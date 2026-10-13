const Joi = require('joi');

// bcrypt silently truncates/ignores input beyond 72 bytes, so cap there.
const password = Joi.string()
  .min(8)
  .max(72)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .messages({
    'string.min': 'Password minimal 8 karakter',
    'string.max': 'Password maksimal 72 karakter',
    'string.pattern.base': 'Password harus mengandung minimal satu huruf dan satu angka',
  });

const username = Joi.string()
  .trim()
  .min(3)
  .max(50)
  .pattern(/^[a-zA-Z0-9._-]+$/)
  .messages({
    'string.min': 'Username minimal 3 karakter',
    'string.max': 'Username maksimal 50 karakter',
    'string.pattern.base': 'Username hanya boleh berisi huruf, angka, titik, garis bawah, dan strip',
  });

const email = Joi.string().trim().email({ tlds: false }).allow('').messages({
  'string.email': 'Format email tidak valid',
});

const level = Joi.string().valid('Admin', 'User', 'Verifikator', 'Pimpinan').messages({
  'any.only': 'Level harus Admin, User, Verifikator, atau Pimpinan',
});

module.exports = { password, username, email, level };
