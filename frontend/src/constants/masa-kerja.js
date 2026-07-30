// Mirror dari backend/src/utils/masa-kerja.js -- dipakai untuk pratinjau
// langsung di form sebelum disimpan.
export function computeMasaKerjaPersandian({
  masa_kerja_kumulatif_tahun, masa_kerja_kumulatif_bulan,
  masa_kerja_pengurangan_tahun, masa_kerja_pengurangan_bulan,
} = {}) {
  const kumulatifBulan = (Number(masa_kerja_kumulatif_tahun) || 0) * 12 + (Number(masa_kerja_kumulatif_bulan) || 0);
  const penguranganBulan = (Number(masa_kerja_pengurangan_tahun) || 0) * 12 + (Number(masa_kerja_pengurangan_bulan) || 0);
  const totalBulan = Math.max(0, kumulatifBulan - penguranganBulan);
  return { tahun: Math.floor(totalBulan / 12), bulan: totalBulan % 12 };
}
