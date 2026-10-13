// A profile counts as complete once the fields needed to identify the
// applicant for an award proposal are filled in — checked both when serving
// the profile (so the frontend can gate the upload page) and again inside
// the upload endpoint itself (so the gate can't be bypassed by calling the
// API directly).
function isProfileComplete(user, individu) {
  if (!user?.email || !user?.hp) return false;
  if (!individu) return false;
  if (!individu.instansi || !individu.jabatan || !individu.unit_kerja || !individu.pangkat) return false;

  if (individu.instansi === 'Pemerintah Daerah') {
    if (!individu.pemda_tipe || !individu.pemda_provinsi) return false;
    if (individu.pemda_tipe !== 'Pemerintah Provinsi' && !individu.pemda_kabkota) return false;
  }

  if (individu.instansi === 'Pemerintah Pusat' && !individu.nama_instansi) return false;

  return true;
}

module.exports = { isProfileComplete };
