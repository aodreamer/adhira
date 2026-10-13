-- Data instansi tambahan untuk registrasi mandiri perwakilan instansi
-- (mst_user, bukan data_individu -- lihat catatan di migrasi 008): nama
-- instansi spesifik untuk Pemerintah Pusat, dan detail pemda untuk
-- Pemerintah Daerah, keduanya dipilih saat registrasi di RegisterVerifikatorView.

ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_nama_instansi VARCHAR(255);
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_pemda_tipe VARCHAR(50);
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_pemda_provinsi VARCHAR(255);
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_pemda_kabkota VARCHAR(255);
