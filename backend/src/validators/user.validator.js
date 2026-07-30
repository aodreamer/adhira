const Joi = require('joi');
const { password, username, email, level } = require('./common');
const { INSTANSI_OPTIONS, PANGKAT_OPTIONS } = require('./rank-data');
const { PROVINCES, REGENCIES } = require('./wilayah-data');

const PEMDA_TIPE_OPTIONS = ['Pemerintah Provinsi', 'Pemerintah Kabupaten', 'Pemerintah Kota'];
const PROVINCE_NAMES = PROVINCES.map((p) => p.name);
const REGENCY_NAMES = REGENCIES.map((r) => r.name);

const createUserSchema = Joi.object({
  nama: Joi.string().trim().min(3).max(255).required().messages({
    'string.min': 'Nama minimal 3 karakter',
    'any.required': 'Nama wajib diisi',
  }),
  email: email.default(''),
  hp: Joi.string().trim().max(50).allow('').default(''),
  username: username.required(),
  password: password.required(),
  level: level.default('User'),
  is_active: Joi.number().valid(0, 1).default(1),
});

const updateUserSchema = Joi.object({
  nama: Joi.string().trim().min(3).max(255).messages({
    'string.min': 'Nama minimal 3 karakter',
  }),
  email,
  hp: Joi.string().trim().max(50).allow(''),
  level,
  is_active: Joi.number().valid(0, 1),
  password: password.allow(''),
  instansi_scope: Joi.array().items(Joi.string().valid(...INSTANSI_OPTIONS)).when('level', {
    is: Joi.string().valid('Verifikator').required(),
    then: Joi.array().min(1).required().messages({
      'array.min': 'Pilih minimal satu instansi untuk Verifikator',
      'any.required': 'Pilih minimal satu instansi untuk Verifikator',
    }),
    otherwise: Joi.array().optional(),
  }),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Password saat ini wajib diisi',
    'string.empty': 'Password saat ini wajib diisi',
  }),
  newPassword: password.required().invalid(Joi.ref('currentPassword')).messages({
    'any.invalid': 'Password baru tidak boleh sama dengan password saat ini',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Konfirmasi password tidak sama',
    'any.required': 'Konfirmasi password wajib diisi',
  }),
});

const selfProfileSchema = Joi.object({
  nama: Joi.string().trim().min(3).max(255).messages({
    'string.min': 'Nama minimal 3 karakter',
  }),
  email,
  hp: Joi.string().trim().max(50).allow(''),
  instansi: Joi.string().valid(...INSTANSI_OPTIONS).messages({
    'any.only': 'Instansi tidak valid',
  }),
  jabatan: Joi.string().trim().min(2).max(255).messages({
    'string.min': 'Jabatan minimal 2 karakter',
  }),
  unit_kerja: Joi.string().trim().min(2).max(255).messages({
    'string.min': 'Unit kerja minimal 2 karakter',
  }),
  pangkat: Joi.string().valid(...PANGKAT_OPTIONS).messages({
    'any.only': 'Pangkat/golongan tidak valid',
  }),
  pemda_tipe: Joi.string().valid(...PEMDA_TIPE_OPTIONS, '').messages({
    'any.only': 'Jenis pemerintah daerah tidak valid',
  }).when('instansi', {
    is: Joi.string().valid('Pemerintah Daerah').required(),
    then: Joi.invalid('').required().messages({
      'any.required': 'Jenis pemerintah daerah wajib dipilih',
      'any.invalid': 'Jenis pemerintah daerah wajib dipilih',
    }),
  }),
  pemda_provinsi: Joi.string().valid(...PROVINCE_NAMES, '').messages({
    'any.only': 'Provinsi tidak valid',
  }).when('instansi', {
    is: Joi.string().valid('Pemerintah Daerah').required(),
    then: Joi.invalid('').required().messages({
      'any.required': 'Provinsi wajib dipilih',
      'any.invalid': 'Provinsi wajib dipilih',
    }),
  }),
  pemda_kabkota: Joi.string().valid(...REGENCY_NAMES, '').messages({
    'any.only': 'Kabupaten/Kota tidak valid',
  }).when('pemda_tipe', {
    is: Joi.string().valid('Pemerintah Kabupaten', 'Pemerintah Kota').required(),
    then: Joi.invalid('').required().messages({
      'any.required': 'Kabupaten/Kota wajib dipilih',
      'any.invalid': 'Kabupaten/Kota wajib dipilih',
    }),
  }),
  tgl_tmt_cpns_pns: Joi.date().allow(null, ''),
  masa_kerja_kumulatif_tahun: Joi.number().integer().min(0).allow(null, ''),
  masa_kerja_kumulatif_bulan: Joi.number().integer().min(0).max(11).allow(null, ''),
  masa_kerja_pengurangan_tahun: Joi.number().integer().min(0).allow(null, ''),
  masa_kerja_pengurangan_bulan: Joi.number().integer().min(0).max(11).allow(null, ''),
})
  .min(1)
  .custom((value, helpers) => {
    if (value.pemda_kabkota) {
      const regency = REGENCIES.find((r) => r.name === value.pemda_kabkota);
      if (!regency) return helpers.message('Kabupaten/Kota tidak valid');
      if (value.pemda_provinsi && regency.provinceName !== value.pemda_provinsi) {
        return helpers.message('Kabupaten/Kota tidak sesuai dengan provinsi yang dipilih');
      }
      if (value.pemda_tipe && 'Pemerintah ' + regency.type !== value.pemda_tipe) {
        return helpers.message('Jenis pemerintah daerah tidak sesuai dengan kabupaten/kota yang dipilih');
      }
    }
    return value;
  });

module.exports = { createUserSchema, updateUserSchema, changePasswordSchema, selfProfileSchema };
