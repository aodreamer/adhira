const { PROVINCES, REGENCIES } = require('../validators/wilayah-data');

const aliases = {
  JATIM: 'JAWA TIMUR', JATENG: 'JAWA TENGAH', JABAR: 'JAWA BARAT',
  DIY: 'DI YOGYAKARTA', 'DAERAH ISTIMEWA YOGYAKARTA': 'DI YOGYAKARTA',
  'D.I. YOGYAKARTA': 'DI YOGYAKARTA', 'D.I YOGYAKARTA': 'DI YOGYAKARTA',
  'DAERAH KHUSUS IBUKOTA JAKARTA': 'DKI JAKARTA',
  'D.K.I. JAKARTA': 'DKI JAKARTA', 'D.K.I JAKARTA': 'DKI JAKARTA',
  SUMUT: 'SUMATERA UTARA', SUMBAR: 'SUMATERA BARAT', SUMSEL: 'SUMATERA SELATAN',
  KALBAR: 'KALIMANTAN BARAT', KALTENG: 'KALIMANTAN TENGAH',
  KALSEL: 'KALIMANTAN SELATAN', KALTIM: 'KALIMANTAN TIMUR', KALTARA: 'KALIMANTAN UTARA',
  SULUT: 'SULAWESI UTARA', SULTENG: 'SULAWESI TENGAH',
  SULSEL: 'SULAWESI SELATAN', SULTRA: 'SULAWESI TENGGARA', SULBAR: 'SULAWESI BARAT',
  NTB: 'NUSA TENGGARA BARAT', NTT: 'NUSA TENGGARA TIMUR',
  'BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG', 'KEP. RIAU': 'KEPULAUAN RIAU',
};
const normalize = value => String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
const normalizeProvince = value => {
  const name = normalize(value).replace(/^PROVINSI\s+/, '');
  return aliases[name] || name;
};
const provinceNames = new Set(PROVINCES.map(p => p.name));
const compact = value => normalize(value).replace(/\s+/g, '');

function provinceFromRegency(value, type) {
  const name = normalize(value).replace(/^(KABUPATEN|KOTA)\s+/, '');
  const matches = REGENCIES.filter(r => (!type || r.type === type)
    && compact(r.name.replace(/^(KABUPATEN|KOTA)\s+/, '')) === compact(name));
  const provinces = [...new Set(matches.map(r => r.provinceName))];
  return provinces.length === 1 ? provinces[0] : null;
}

function resolveProvince({ instansi, provinsi, kabkota }) {
  const institution = normalize(instansi);
  if (institution === 'PEMERINTAH DAERAH') {
    // Keep unknown explicit names visible in the map's unmatched-name notice.
    return normalizeProvince(provinsi) || provinceFromRegency(kabkota) || null;
  }
  // Legacy imports store regional names in instansi instead of pemda_* fields.
  // Only regional institutions identify a location; never assign BSSN/TNI or
  // national ministries to their headquarters' province.
  const match = institution.match(/^(PEMPROV|PEMKAB|PEMKOT|KEJATI|PEMERINTAH PROVINSI|PEMERINTAH KABUPATEN|PEMERINTAH KOTA|KEJAKSAAN TINGGI)\s+(.+)$/);
  if (!match) return null;
  if (normalizeProvince(provinsi)) return normalizeProvince(provinsi);
  const [, kind, name] = match;
  if (kind === 'PEMKAB' || kind === 'PEMERINTAH KABUPATEN') return provinceFromRegency(name, 'Kabupaten');
  if (kind === 'PEMKOT' || kind === 'PEMERINTAH KOTA') return provinceFromRegency(name, 'Kota');
  const province = normalizeProvince(name);
  return provinceNames.has(province) ? province : null;
}

const metrics = ['total', 'sesuai', 'menunggu', 'perbaikan', 'draft', 'sk_tersedia'];
function aggregateProvinces(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const provinsi = resolveProvince(row);
    if (!grouped.has(provinsi)) grouped.set(provinsi, { provinsi, ...Object.fromEntries(metrics.map(key => [key, 0])) });
    const target = grouped.get(provinsi);
    for (const key of metrics) target[key] += Number(row[key]) || 0;
  }
  return [...grouped.values()].sort((a, b) => b.total - a.total
    || (a.provinsi === null ? 1 : b.provinsi === null ? -1 : a.provinsi.localeCompare(b.provinsi)));
}

module.exports = { resolveProvince, aggregateProvinces };
