// Syarat berkas permohonan Dharma Persandian.
//
// file_pengangkatan & file_keputusan_jabatan reuse kolom lama (hanya
// menambah field judul) karena label barunya identik dengan yang lama.
// file_surat_usulan, file_sk_cpns_pns, dan file_piagam_penghargaan adalah
// kolom baru -- piagam_penghargaan menggantikan trio piagam_x/xx/xxx di UI
// (kolom lama tetap di DB untuk data historis, tidak lagi ditampilkan di
// sini). file_kepka BUKAN syarat permohonan -- itu salinan Keputusan Kepala
// BSSN, dokumen hasil yang diterbitkan setelah usulan disetujui, jadi hanya
// dikelola Admin.
//
// asnOnly: true berarti dokumen ini hanya relevan untuk instansi jalur ASN
// (lihat isAsnTrackInstansi di constants/rank-data.js).
// titleCol: nama field judul bebas yang menyertai berkas ini (mis. "Keputusan
// Bupati ... tentang ... tanggal ...").

export const REQUIRED_DOCS = [
  { col: 'file_ktp', label: 'Fotokopi KTP', titleCol: 'judul_ktp' },
  { col: 'file_drh', label: 'Daftar Riwayat Hidup & Jabatan', titleCol: 'judul_drh' },
  { col: 'file_surat_usulan', label: 'Surat Usulan', titleCol: 'judul_surat_usulan' },
  { col: 'file_sk_cpns_pns', label: 'SK CPNS/PNS (Khusus ASN)', titleCol: 'judul_sk_cpns_pns', asnOnly: true },
  { col: 'file_pengangkatan', label: 'SK Pengangkatan/Penugasan Pertama', titleCol: 'judul_pengangkatan' },
  { col: 'file_keputusan_jabatan', label: 'SK Pangkat/Jabatan Terakhir', titleCol: 'judul_keputusan_jabatan' },
];

export const OPTIONAL_DOCS = [
  { col: 'file_piagam_penghargaan', label: 'Piagam Penghargaan yang Pernah Didapat (Dharma Persandian)', titleCol: 'judul_piagam_penghargaan' },
];

// Syarat permohonan pemohon (wajib + opsional) — dipakai di halaman Upload
// Berkas (User) dan Detail Verifikasi (Verifikator). Tidak termasuk file_kepka.
export const APPLICANT_DOCS = [...REQUIRED_DOCS, ...OPTIONAL_DOCS];

// Dokumen hasil yang hanya dikelola Admin, terpisah dari syarat permohonan.
export const RESULT_DOC = { col: 'file_kepka', label: 'Salinan Keputusan Kepala BSSN (Dokumen Hasil)' };

// Semua kolom berkas (dipakai Admin, yang mengelola syarat + dokumen hasil).
export const ALL_DOCS = [...APPLICANT_DOCS, RESULT_DOC];
