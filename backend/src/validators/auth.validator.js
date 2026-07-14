const Joi = require('joi');
const { password, username } = require('./common');
const { INSTANSI_OPTIONS, PANGKAT_OPTIONS } = require('./rank-data');

const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    'string.empty': 'Username wajib diisi',
    'any.required': 'Username wajib diisi',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password wajib diisi',
    'any.required': 'Password wajib diisi',
  }),
});

const registerSchema = Joi.object({
  nama: Joi.string().trim().min(3).max(255).required().messages({
    'string.min': 'Nama minimal 3 karakter',
    'any.required': 'Nama wajib diisi',
  }),
  email: Joi.string().trim().email({ tlds: false }).required().messages({
    'string.empty': 'Email wajib diisi',
    'string.email': 'Format email tidak valid',
    'any.required': 'Email wajib diisi',
  }),
  hp: Joi.string().trim().min(8).max(20).pattern(/^[0-9+\-\s]+$/).required().messages({
    'string.empty': 'No HP wajib diisi',
    'any.required': 'No HP wajib diisi',
    'string.pattern.base': 'No HP hanya boleh berisi angka, spasi, + dan -',
  }),
  username: username.required(),
  password: password.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Konfirmasi password tidak sama',
    'any.required': 'Konfirmasi password wajib diisi',
  }),
  nipnrp: Joi.string().trim().min(3).max(255).required().messages({
    'any.required': 'NIP/NRP wajib diisi',
  }),
  instansi: Joi.string().valid(...INSTANSI_OPTIONS).required().messages({
    'any.only': 'Instansi tidak valid',
    'any.required': 'Instansi wajib dipilih',
  }),
  jabatan: Joi.string().trim().min(2).max(255).required().messages({
    'string.min': 'Jabatan minimal 2 karakter',
    'any.required': 'Jabatan wajib diisi',
  }),
  pangkat: Joi.string().valid(...PANGKAT_OPTIONS).required().messages({
    'any.only': 'Pangkat/golongan tidak valid',
    'any.required': 'Pangkat/golongan wajib dipilih',
  }),
});

module.exports = { loginSchema, registerSchema };
