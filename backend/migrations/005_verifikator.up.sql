-- Peran Verifikator: memverifikasi data pribadi & berkas pengusul, dibatasi
-- per instansi lewat tabel verifikator_instansi.

ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS verifikasi_data_status VARCHAR(20) NOT NULL DEFAULT 'Menunggu';
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS verifikasi_data_oleh INTEGER REFERENCES mst_user(id_user);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS verifikasi_data_at TIMESTAMPTZ;
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS verifikasi_data_catatan TEXT;

ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS verifikasi_berkas_status VARCHAR(20) NOT NULL DEFAULT 'Menunggu';
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS verifikasi_berkas_oleh INTEGER REFERENCES mst_user(id_user);
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS verifikasi_berkas_at TIMESTAMPTZ;
ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS verifikasi_berkas_catatan TEXT;

CREATE TABLE IF NOT EXISTS verifikator_instansi (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL REFERENCES mst_user(id_user) ON DELETE CASCADE,
    instansi VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_user, instansi)
);

CREATE INDEX IF NOT EXISTS idx_verifikator_instansi_user ON verifikator_instansi (id_user);
