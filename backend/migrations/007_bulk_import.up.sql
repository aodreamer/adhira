-- Usulan Massal: Dewan Penghargaan (Verifikator) upload daftar calon dalam
-- format template, di-parse ke staging table dulu (tidak menyentuh
-- mst_user/data_individu) sampai Dewan eksplisit konfirmasi.

CREATE TABLE IF NOT EXISTS import_batch (
    id SERIAL PRIMARY KEY,
    id_user_verifikator INTEGER NOT NULL REFERENCES mst_user(id_user) ON DELETE CASCADE,
    instansi VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Preview', -- Preview | Confirmed | Discarded
    total_rows INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    confirmed_by INTEGER REFERENCES mst_user(id_user)
);
CREATE INDEX IF NOT EXISTS idx_import_batch_verifikator ON import_batch (id_user_verifikator);

CREATE TABLE IF NOT EXISTS import_batch_row (
    id SERIAL PRIMARY KEY,
    id_batch INTEGER NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    nama VARCHAR(255),
    nipnrp VARCHAR(255),
    email VARCHAR(255),
    hp VARCHAR(20),
    jabatan VARCHAR(255),
    unit_kerja VARCHAR(255),
    pangkat VARCHAR(255),
    jenis_penghargaan VARCHAR(255),
    tgl_penghargaan DATE,
    pemda_tipe VARCHAR(50),
    pemda_provinsi VARCHAR(255),
    pemda_kabkota VARCHAR(255),
    row_status VARCHAR(20) NOT NULL DEFAULT 'Valid', -- Valid | Error | DuplicateUpdate
    errors JSONB,
    match_id_individu INTEGER REFERENCES data_individu(id),
    match_id_user INTEGER REFERENCES mst_user(id_user),
    result_status VARCHAR(20), -- NULL sampai confirm, lalu Created | Updated | Skipped | Failed
    result_id_individu INTEGER REFERENCES data_individu(id),
    result_id_user INTEGER REFERENCES mst_user(id_user),
    generated_username VARCHAR(50),
    generated_password_plain VARCHAR(72),
    email_status VARCHAR(20) DEFAULT 'NotSent' -- NotSent | Queued | Sent | Failed
);
CREATE INDEX IF NOT EXISTS idx_import_batch_row_batch ON import_batch_row (id_batch);
CREATE INDEX IF NOT EXISTS idx_import_batch_row_nipnrp ON import_batch_row (nipnrp);

-- Kredensial hasil generate wajib diganti saat login pertama, karena akan
-- disebarkan manual oleh Dewan Penghargaan (belum ada pengiriman email
-- otomatis) sebelum kandidat login sendiri.
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS must_change_password SMALLINT NOT NULL DEFAULT 0;
