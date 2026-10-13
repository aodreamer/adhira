// Official long-form names used on the printed certificate, keyed by the
// short Instansi value stored on the profile.
const INSTANSI_FULL_NAME = {
  'BSSN': 'Badan Siber dan Sandi Negara',
  'Pemerintah Pusat': 'Pemerintah Pusat',
  'Polri': 'Kepolisian Negara Republik Indonesia',
  'TNI AD': 'Tentara Nasional Indonesia Angkatan Darat',
  'TNI AU': 'Tentara Nasional Indonesia Angkatan Udara',
  'TNI AL': 'Tentara Nasional Indonesia Angkatan Laut',
  'BAIS TNI': 'Badan Intelijen Strategis TNI',
  'Kejaksaan Agung': 'Kejaksaan Agung Republik Indonesia',
};

// Province/regency names are stored in ALL CAPS (official BPS style); title-case
// them for the certificate line while keeping known abbreviations intact.
function titleCaseWilayah(str) {
  if (!str) return '';
  return str.split(' ').map((w) => (w === 'DKI' || w === 'DI' ? w : w.charAt(0) + w.slice(1).toLowerCase())).join(' ');
}

function pemdaInstansiFull({ pemda_tipe, pemda_provinsi, pemda_kabkota }) {
  if (pemda_tipe === 'Pemerintah Provinsi' && pemda_provinsi) {
    return 'Pemerintah Provinsi ' + titleCaseWilayah(pemda_provinsi);
  }
  if (pemda_kabkota) {
    return 'Pemerintah ' + titleCaseWilayah(pemda_kabkota);
  }
  return 'Pemerintah Daerah';
}

function instansiFull(profile) {
  if (!profile.instansi) return '';
  if (profile.instansi === 'Pemerintah Daerah') return pemdaInstansiFull(profile);
  if (profile.instansi === 'Pemerintah Pusat' && (profile.nama_instansi || '').trim()) return profile.nama_instansi.trim();
  return INSTANSI_FULL_NAME[profile.instansi] || profile.instansi;
}

// Composes the certificate line: "{jabatan} pada {unit_kerja}, {instansi}".
export function buildCertificateLine(profile) {
  const jabatan = (profile.jabatan || '').trim();
  const unitKerja = (profile.unit_kerja || '').trim();
  const instansi = instansiFull(profile);

  const parts = [];
  if (jabatan && unitKerja) parts.push(jabatan + ' pada ' + unitKerja);
  else if (jabatan || unitKerja) parts.push(jabatan || unitKerja);
  if (instansi) parts.push(instansi);

  return parts.join(', ');
}
