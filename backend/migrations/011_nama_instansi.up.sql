-- Nama instansi spesifik untuk instansi "Pemerintah Pusat"
-- (mis. Kementerian/LPNK tempat pengusul bertugas), diisi manual oleh user.

ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS nama_instansi VARCHAR(255);
