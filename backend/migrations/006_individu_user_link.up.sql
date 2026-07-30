-- Ganti relasi data_individu <-> mst_user dari string-match nama (rapuh —
-- putus begitu user ganti nama di Profil Saya) menjadi foreign key id_user
-- yang stabil.

-- ON DELETE SET NULL: menghapus akun login tidak boleh menghapus atau
-- diblokir oleh riwayat arsip penghargaannya — arsip harus tetap ada
-- (konsisten dengan 80 baris data impor lama yang id_user-nya sudah NULL).
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS id_user INTEGER REFERENCES mst_user(id_user) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_individu_id_user ON data_individu (id_user);

-- Backfill satu kali: link berdasarkan kecocokan nama yang berlaku saat ini.
UPDATE data_individu d
SET id_user = u.id_user
FROM mst_user u
WHERE d.nama = u.nama AND d.id_user IS NULL;
