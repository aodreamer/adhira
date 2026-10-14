BEGIN;
CREATE TABLE award_periods (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  tahun INTEGER NOT NULL CHECK (tahun BETWEEN 1900 AND 9999),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  status VARCHAR(20) NOT NULL DEFAULT 'Persiapan' CHECK (status IN ('Persiapan','Aktif','Selesai')),
  catatan TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES mst_user(id_user) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX award_periods_unique_name ON award_periods (LOWER(nama));
CREATE TABLE award_period_stages (
  period_id INTEGER NOT NULL REFERENCES award_periods(id) ON DELETE CASCADE,
  kode VARCHAR(30) NOT NULL,
  label VARCHAR(100) NOT NULL,
  urutan INTEGER NOT NULL,
  optional BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(25) NOT NULL DEFAULT 'Belum dimulai' CHECK (status IN ('Belum dimulai','Berjalan','Selesai','Tidak diperlukan')),
  start_date DATE,
  end_date DATE,
  catatan TEXT NOT NULL DEFAULT '',
  completed_at TIMESTAMPTZ,
  updated_by INTEGER REFERENCES mst_user(id_user) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (period_id,kode),
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date),
  CHECK (optional OR status <> 'Tidak diperlukan')
);
ALTER TABLE data_individu ADD COLUMN periode_id INTEGER REFERENCES award_periods(id) ON DELETE RESTRICT;
ALTER TABLE tb_surat_pemberitahuan ADD COLUMN periode_id INTEGER REFERENCES award_periods(id) ON DELETE RESTRICT;
ALTER TABLE tb_usulan ADD COLUMN periode_id INTEGER REFERENCES award_periods(id) ON DELETE RESTRICT;
ALTER TABLE tb_distribusi ADD COLUMN periode_id INTEGER REFERENCES award_periods(id) ON DELETE RESTRICT;
ALTER TABLE tb_laporan_kegiatan ADD COLUMN periode_id INTEGER REFERENCES award_periods(id) ON DELETE RESTRICT;
CREATE INDEX ON data_individu (periode_id);
CREATE INDEX ON tb_surat_pemberitahuan (periode_id);
CREATE INDEX ON tb_usulan (periode_id);
CREATE INDEX ON tb_distribusi (periode_id);
CREATE INDEX ON tb_laporan_kegiatan (periode_id);
COMMIT;
