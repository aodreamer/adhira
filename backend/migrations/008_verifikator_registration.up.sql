-- Bagian A: registrasi mandiri Verifikator + gate approval Admin.
-- reg_status NULL berarti akun ini tidak lewat jalur registrasi mandiri
-- (Admin-created lewat ManUserView, atau bukan Verifikator) -- gate hanya
-- aktif kalau reg_status IS NOT NULL.
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_status VARCHAR(20);
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_catatan TEXT;
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_reviewed_by INTEGER REFERENCES mst_user(id_user);
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_reviewed_at TIMESTAMPTZ;
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_file_surat_usulan VARCHAR(255);
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_file_excel_usulan VARCHAR(255);

-- Bagian B: riwayat kepegawaian & berkas baru milik calon penerima.
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS tgl_tmt_cpns_pns DATE;
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS masa_kerja_kumulatif_tahun SMALLINT;
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS masa_kerja_kumulatif_bulan SMALLINT;
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS masa_kerja_pengurangan_tahun SMALLINT;
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS masa_kerja_pengurangan_bulan SMALLINT;

ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS file_surat_usulan VARCHAR(255);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS judul_surat_usulan VARCHAR(500);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS file_sk_cpns_pns VARCHAR(255);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS judul_sk_cpns_pns VARCHAR(500);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS file_piagam_penghargaan VARCHAR(255);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS judul_piagam_penghargaan VARCHAR(500);

-- Judul untuk 2 berkas lama yang "digantikan" secara konsep (kolom file-nya
-- direuse, hanya menambah judul).
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS judul_pengangkatan VARCHAR(500);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS judul_keputusan_jabatan VARCHAR(500);

-- Riwayat kepegawaian opsional di template bulk-import (Bagian B) -- Dewan
-- mungkin tidak punya datanya saat nominasi massal; calon melengkapi sendiri
-- lewat profil kalau kosong di sini.
ALTER TABLE import_batch_row ADD COLUMN IF NOT EXISTS tgl_tmt_cpns_pns DATE;
ALTER TABLE import_batch_row ADD COLUMN IF NOT EXISTS masa_kerja_kumulatif_tahun SMALLINT;
ALTER TABLE import_batch_row ADD COLUMN IF NOT EXISTS masa_kerja_kumulatif_bulan SMALLINT;
ALTER TABLE import_batch_row ADD COLUMN IF NOT EXISTS masa_kerja_pengurangan_tahun SMALLINT;
ALTER TABLE import_batch_row ADD COLUMN IF NOT EXISTS masa_kerja_pengurangan_bulan SMALLINT;

-- Identitas pribadi perwakilan instansi yang mendaftar (bukan calon
-- penerima, jadi disimpan di mst_user bukan data_individu) -- dipakai Admin
-- untuk konteks review, bukan disyaratkan sebagai kolom instansi kandidat.
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_nipnrp VARCHAR(255);
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_pangkat VARCHAR(255);

-- Jabatan & unit kerja perwakilan instansi yang mendaftar.
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_jabatan VARCHAR(255);
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_unit_kerja VARCHAR(255);

-- Judul berkas berlaku untuk semua jenis dokumen, termasuk KTP & DRH (tidak
-- wajib diisi, tapi field-nya harus selalu tersedia di form upload).
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS judul_ktp VARCHAR(500);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS judul_drh VARCHAR(500);
