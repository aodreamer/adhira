const Joi = require('joi');
const pool = require('../config/database');
const { loadExecutiveDashboard } = require('../models/executive-dashboard.model');

const filterSchema = Joi.object({
  tahun: Joi.number().integer().min(1900).max(9999).allow(null).default(null),
  instansi: Joi.string().trim().max(255).allow(null).default(null),
  jenis: Joi.string().trim().max(255).allow(null).default(null),
});

async function index(req, res) {
  const { error, value } = filterSchema.validate(req.query);
  if (error) return res.status(400).json({ error: 'Filter dashboard tidak valid' });
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await loadExecutiveDashboard(pool, value));
  } catch (err) {
    console.error('Executive dashboard error:', err);
    res.status(500).json({ error: 'Gagal mengambil ringkasan dashboard pimpinan' });
  }
}

module.exports = { index };
