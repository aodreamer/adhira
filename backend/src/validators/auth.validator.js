const Joi = require('joi');
const { password, username } = require('./common');
const { INSTANSI_OPTIONS, PANGKAT_OPTIONS } = require('./rank-data');
const { PROVINCES, REGENCIES } = require('./wilayah-data');

const PEMDA_TIPE_OPTIONS = ['Pemerintah Provinsi', 'Pemerintah Kabupaten', 'Pemerintah Kota'];
const PROVINCE_NAMES = PROVINCES.map((p) => p.name);
const REGENCY_NAMES = REGENCIES.map((r) => r.name);

// Shared pemda_tipe/pemda_provinsi/pemda_kabkota schema fragment: required
// only when instansi === 'Pemerintah Daerah', mirroring the frontend's
// conditional cascading selects (see AccountSettingsView.vue).
function pemdaFields() {
  return {
    pemda_tipe: Joi.string().valid(...PEMDA_TIPE_OPTIONS).messages({ 'any.only': 'Jenis pemerintah daerah tidak valid' })
      .when('instansi', {
        is: Joi.string().valid('Pemerintah Daerah').required(),
        then: Joi.required().messages({ 'any.required': 'Jenis pemerintah daerah wajib dipilih' }),
        otherwise: Joi.optional().allow('', null),
      }),
    pemda_provinsi: Joi.string().valid(...PROVINCE_NAMES).messages({ 'any.only': 'Provinsi tidak valid' })
      .when('instansi', {
        is: Joi.string().valid('Pemerintah Daerah').required(),
        then: Joi.required().messages({ 'any.required': 'Provinsi wajib dipilih' }),
        otherwise: Joi.optional().allow('', null),
      }),
    pemda_kabkota: Joi.string().valid(...REGENCY_NAMES).messages({ 'any.only': 'Kabupaten/Kota tidak valid' })
      .when('pemda_tipe', {
        is: Joi.string().valid('Pemerintah Kabupaten', 'Pemerintah Kota').required(),
        then: Joi.required().messages({ 'any.required': 'Kabupaten/Kota wajib dipilih' }),
        otherwise: Joi.optional().allow('', null),
      }),
  };
}

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
  nama_instansi: Joi.string().trim().min(2).max(255).messages({
    'string.min': 'Nama instansi minimal 2 karakter',
    'any.required': 'Nama instansi wajib diisi',
  }).when('instansi', {
    is: Joi.string().valid('Pemerintah Pusat').required(),
    then: Joi.invalid('').required().messages({
      'any.required': 'Nama instansi wajib diisi',
      'any.invalid': 'Nama instansi wajib diisi',
    }),
    otherwise: Joi.optional().allow('', null),
  }),
  jabatan: Joi.string().trim().min(2).max(255).required().messages({
    'string.min': 'Jabatan minimal 2 karakter',
    'any.required': 'Jabatan wajib diisi',
  }),
  unit_kerja: Joi.string().trim().min(2).max(255).required().messages({
    'string.min': 'Unit kerja minimal 2 karakter',
    'any.required': 'Unit kerja wajib diisi',
  }),
  pangkat: Joi.string().valid(...PANGKAT_OPTIONS).required().messages({
    'any.only': 'Pangkat/golongan tidak valid',
    'any.required': 'Pangkat/golongan wajib dipilih',
  }),
  ...pemdaFields(),
});

// Registrasi mandiri untuk perwakilan instansi (Dewan Penghargaan / Verifikator).
// NIP/NRP satu field saja (tidak dibedakan per instansi -- bisa saja ASN
// bertugas di lingkungan Polri/TNI atau sebaliknya).
const registerVerifikatorSchema = Joi.object({
  kode_pendaftaran: Joi.string().trim().min(4).max(50).required().messages({
    'string.empty': 'Kode pendaftaran wajib diisi',
    'any.required': 'Kode pendaftaran wajib diisi',
  }),
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
  instansi: Joi.string().valid(...INSTANSI_OPTIONS).required().messages({
    'any.only': 'Instansi tidak valid',
    'any.required': 'Instansi wajib dipilih',
  }),
  nama_instansi: Joi.string().trim().min(2).max(255).messages({
    'string.min': 'Nama instansi minimal 2 karakter',
    'any.required': 'Nama instansi wajib diisi',
  }).when('instansi', {
    is: Joi.string().valid('Pemerintah Pusat').required(),
    then: Joi.invalid('').required().messages({
      'any.required': 'Nama instansi wajib diisi',
      'any.invalid': 'Nama instansi wajib diisi',
    }),
    otherwise: Joi.optional().allow('', null),
  }),
  nipnrp: Joi.string().trim().min(3).max(255).required().messages({
    'any.required': 'NIP/NRP wajib diisi',
  }),
  jabatan: Joi.string().trim().min(2).max(255).required().messages({
    'string.min': 'Jabatan minimal 2 karakter',
    'any.required': 'Jabatan wajib diisi',
  }),
  unit_kerja: Joi.string().trim().min(2).max(255).required().messages({
    'string.min': 'Unit kerja minimal 2 karakter',
    'any.required': 'Unit kerja wajib diisi',
  }),
  pangkat: Joi.string().valid(...PANGKAT_OPTIONS).required().messages({
    'any.only': 'Pangkat/golongan tidak valid',
    'any.required': 'Pangkat/golongan wajib dipilih',
  }),
  ...pemdaFields(),
});

module.exports = { loginSchema, registerSchema, registerVerifikatorSchema };
