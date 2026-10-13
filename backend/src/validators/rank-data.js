const INSTANSI_OPTIONS = [
  'BSSN', 'Pemerintah Pusat', 'Pemerintah Daerah', 'Polri',
  'TNI AD', 'TNI AU', 'TNI AL', 'BAIS TNI', 'Kejaksaan Agung',
];

const PANGKAT_TNI_AD = [
  'Jenderal TNI', 'Letnan Jenderal (Letjen) TNI', 'Mayor Jenderal (Mayjen) TNI', 'Brigadir Jenderal (Brigjen) TNI',
  'Kolonel', 'Letnan Kolonel (Letkol)', 'Mayor', 'Kapten', 'Letnan Satu (Lettu)', 'Letnan Dua (Letda)',
  'Pembantu Letnan Satu (Peltu)', 'Pembantu Letnan Dua (Pelda)', 'Sersan Mayor (Serma)', 'Sersan Kepala (Serka)', 'Sersan Satu (Sertu)', 'Sersan Dua (Serda)',
  'Kopral Kepala (Kopka)', 'Kopral Satu (Koptu)', 'Kopral Dua (Kopda)', 'Prajurit Kepala (Praka)', 'Prajurit Satu (Pratu)', 'Prajurit Dua (Prada)',
];

const PANGKAT_TNI_AU = [
  'Marsekal TNI', 'Marsekal Madya (Marsdya) TNI', 'Marsekal Muda (Marsda) TNI', 'Marsekal Pertama (Marsma) TNI',
  'Kolonel', 'Letnan Kolonel', 'Mayor', 'Kapten', 'Letnan Satu', 'Letnan Dua',
  'Pembantu Letnan Satu', 'Pembantu Letnan Dua', 'Sersan Mayor', 'Sersan Kepala', 'Sersan Satu', 'Sersan Dua',
  'Kopral Kepala', 'Kopral Satu', 'Kopral Dua', 'Prajurit Kepala', 'Prajurit Satu', 'Prajurit Dua',
];

const PANGKAT_TNI_AL = [
  'Laksamana TNI', 'Laksamana Madya (Laksdya) TNI', 'Laksamana Muda (Laksda) TNI', 'Laksamana Pertama (Laksma) TNI',
  'Kolonel', 'Letnan Kolonel', 'Mayor', 'Kapten', 'Letnan Satu', 'Letnan Dua',
  'Pembantu Letnan Satu', 'Pembantu Letnan Dua', 'Sersan Mayor', 'Sersan Kepala', 'Sersan Satu', 'Sersan Dua',
  'Kopral Kepala', 'Kopral Satu', 'Kopral Dua', 'Kelasi Kepala', 'Kelasi Satu', 'Kelasi Dua',
];

const PANGKAT_POLRI = [
  'Jenderal Polisi', 'Komisaris Jenderal Polisi (Komjen Pol)', 'Inspektur Jenderal Polisi (Irjen Pol)', 'Brigadir Jenderal Polisi (Brigjen Pol)',
  'Komisaris Besar Polisi (Kombes Pol)', 'Ajun Komisaris Besar Polisi (AKBP)', 'Komisaris Polisi (Kompol)', 'Ajun Komisaris Polisi (AKP)',
  'Inspektur Polisi Satu (Iptu)', 'Inspektur Polisi Dua (Ipda)', 'Ajun Inspektur Polisi Satu (Aiptu)', 'Ajun Inspektur Polisi Dua (Aipda)',
  'Brigadir Polisi Kepala (Bripka)', 'Brigadir Polisi (Brigpol)', 'Brigadir Polisi Satu (Briptu)', 'Brigadir Polisi Dua (Bripda)',
  'Ajun Brigadir Polisi (Abrip)', 'Ajun Brigadir Polisi Satu (Abriptu)', 'Ajun Brigadir Polisi Dua (Abripda)', 'Bhayangkara Kepala (Bharaka)',
];

const PANGKAT_PNS = [
  'Pembina Utama (IV/e)', 'Pembina Utama Madya (IV/d)', 'Pembina Utama Muda (IV/c)', 'Pembina Tingkat I (IV/b)', 'Pembina (IV/a)',
  'Penata Tingkat I (III/d)', 'Penata (III/c)', 'Penata Muda Tingkat I (III/b)', 'Penata Muda (III/a)',
  'Pengatur Tingkat I (II/d)', 'Pengatur (II/c)', 'Pengatur Muda Tingkat I (II/b)', 'Pengatur Muda (II/a)',
  'Juru Tingkat I (I/d)', 'Juru (I/c)', 'Juru Muda Tingkat I (I/b)', 'Juru Muda (I/a)',
];

const PANGKAT_OPTIONS = [...new Set([
  ...PANGKAT_TNI_AD, ...PANGKAT_TNI_AU, ...PANGKAT_TNI_AL, ...PANGKAT_POLRI, ...PANGKAT_PNS,
])];

// Instansi dengan jenjang karier Polri/TNI (bukan PNS) tidak melalui proses
// CPNS/PNS, jadi berkas SK CPNS/PNS tidak relevan untuk mereka.
const ASN_TRACK_EXCLUDED = ['Polri', 'TNI AD', 'TNI AU', 'TNI AL', 'BAIS TNI'];
function isAsnTrackInstansi(instansi) {
  return !!instansi && !ASN_TRACK_EXCLUDED.includes(instansi);
}

module.exports = {
  INSTANSI_OPTIONS, PANGKAT_TNI_AD, PANGKAT_TNI_AU, PANGKAT_TNI_AL, PANGKAT_POLRI, PANGKAT_PNS, PANGKAT_OPTIONS,
  ASN_TRACK_EXCLUDED, isAsnTrackInstansi,
};
