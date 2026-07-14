-- Detail Pemerintah Daerah (Pemprov/Pemkab/Pemkot) untuk instansi "Pemerintah Daerah"

ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS pemda_tipe VARCHAR(50);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS pemda_provinsi VARCHAR(255);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS pemda_kabkota VARCHAR(255);
