export const INSTANSI_OPTIONS = [
  'BSSN', 'Pemerintah Pusat', 'Pemerintah Daerah', 'Polri',
  'TNI AD', 'TNI AU', 'TNI AL', 'BAIS TNI', 'Kejaksaan Agung',
];

export const PANGKAT_TNI_AD = [
  'Jenderal TNI', 'Letnan Jenderal (Letjen) TNI', 'Mayor Jenderal (Mayjen) TNI', 'Brigadir Jenderal (Brigjen) TNI',
  'Kolonel', 'Letnan Kolonel (Letkol)', 'Mayor', 'Kapten', 'Letnan Satu (Lettu)', 'Letnan Dua (Letda)',
  'Pembantu Letnan Satu (Peltu)', 'Pembantu Letnan Dua (Pelda)', 'Sersan Mayor (Serma)', 'Sersan Kepala (Serka)', 'Sersan Satu (Sertu)', 'Sersan Dua (Serda)',
  'Kopral Kepala (Kopka)', 'Kopral Satu (Koptu)', 'Kopral Dua (Kopda)', 'Prajurit Kepala (Praka)', 'Prajurit Satu (Pratu)', 'Prajurit Dua (Prada)',
];

export const PANGKAT_TNI_AU = [
  'Marsekal TNI', 'Marsekal Madya (Marsdya) TNI', 'Marsekal Muda (Marsda) TNI', 'Marsekal Pertama (Marsma) TNI',
  'Kolonel', 'Letnan Kolonel', 'Mayor', 'Kapten', 'Letnan Satu', 'Letnan Dua',
  'Pembantu Letnan Satu', 'Pembantu Letnan Dua', 'Sersan Mayor', 'Sersan Kepala', 'Sersan Satu', 'Sersan Dua',
  'Kopral Kepala', 'Kopral Satu', 'Kopral Dua', 'Prajurit Kepala', 'Prajurit Satu', 'Prajurit Dua',
];

export const PANGKAT_TNI_AL = [
  'Laksamana TNI', 'Laksamana Madya (Laksdya) TNI', 'Laksamana Muda (Laksda) TNI', 'Laksamana Pertama (Laksma) TNI',
  'Kolonel', 'Letnan Kolonel', 'Mayor', 'Kapten', 'Letnan Satu', 'Letnan Dua',
  'Pembantu Letnan Satu', 'Pembantu Letnan Dua', 'Sersan Mayor', 'Sersan Kepala', 'Sersan Satu', 'Sersan Dua',
  'Kopral Kepala', 'Kopral Satu', 'Kopral Dua', 'Kelasi Kepala', 'Kelasi Satu', 'Kelasi Dua',
];

export const PANGKAT_POLRI = [
  'Bhayangkara Kepala (Bharaka)', 'Ajun Brigadir Polisi Dua (Abripda)', 'Ajun Brigadir Polisi Satu (Abriptu)', 'Ajun Brigadir Polisi (Abrip)',
  'Brigadir Polisi Dua (Bripda)', 'Brigadir Polisi Satu (Briptu)', 'Brigadir Polisi (Brigpol)', 'Brigadir Polisi Kepala (Bripka)',
  'Ajun Inspektur Polisi Dua (Aipda)', 'Ajun Inspektur Polisi Satu (Aiptu)', 'Inspektur Polisi Dua (Ipda)', 'Inspektur Polisi Satu (Iptu)',
  'Ajun Komisaris Polisi (AKP)', 'Komisaris Polisi (Kompol)', 'Ajun Komisaris Besar Polisi (AKBP)', 'Komisaris Besar Polisi (Kombes Pol)',
  'Brigadir Jenderal Polisi (Brigjen Pol)', 'Inspektur Jenderal Polisi (Irjen Pol)', 'Komisaris Jenderal Polisi (Komjen Pol)', 'Jenderal Polisi',
];

export const PANGKAT_PNS = [
  'Juru Muda (I/a)', 'Juru Muda Tingkat I (I/b)', 'Juru (I/c)', 'Juru Tingkat I (I/d)',
  'Pengatur Muda (II/a)', 'Pengatur Muda Tingkat I (II/b)', 'Pengatur (II/c)', 'Pengatur Tingkat I (II/d)',
  'Penata Muda (III/a)', 'Penata Muda Tingkat I (III/b)', 'Penata (III/c)', 'Penata Tingkat I (III/d)',
  'Pembina (IV/a)', 'Pembina Tingkat I (IV/b)', 'Pembina Utama Muda (IV/c)', 'Pembina Utama Madya (IV/d)', 'Pembina Utama (IV/e)',
];

// Instansi dengan jenjang karier Polri/TNI (bukan PNS) tidak melalui proses
// CPNS/PNS, jadi berkas SK CPNS/PNS tidak relevan untuk mereka.
export const ASN_TRACK_EXCLUDED = ['Polri', 'TNI AD', 'TNI AU', 'TNI AL', 'BAIS TNI'];
export function isAsnTrackInstansi(instansi) {
  return !!instansi && !ASN_TRACK_EXCLUDED.includes(instansi);
}

