-- Kode pendaftaran Verifikator: dibagikan lewat surat resmi, dipakai berulang
-- oleh siapapun yang memegangnya (tidak dikunci ke instansi tertentu), sampai
-- kadaluarsa atau dinonaktifkan manual oleh Admin.
CREATE TABLE verifikator_registration_code (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(50) NOT NULL UNIQUE,
    keterangan VARCHAR(255),
    expired_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER REFERENCES mst_user(id_user),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jejak kode mana yang dipakai tiap akun Verifikator saat mendaftar (audit trail).
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS reg_code_id INTEGER REFERENCES verifikator_registration_code(id);
