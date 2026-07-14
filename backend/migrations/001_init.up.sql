-- Adhira PostgreSQL Migration

CREATE TABLE mst_user (
    id_user SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL,
    hp VARCHAR(50) NOT NULL DEFAULT '',
    username VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL DEFAULT 'User',
    image VARCHAR(250) NOT NULL DEFAULT 'default.jpg',
    date_created DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE data_individu (
    id SERIAL PRIMARY KEY,
    tgl_upload DATE,
    tgl_penghargaan DATE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    instansi VARCHAR(255),
    jabatan VARCHAR(255),
    nipnrp VARCHAR(255) NOT NULL,
    pangkat VARCHAR(255),
    jenis_penghargaan VARCHAR(255),
    file_kepka VARCHAR(255),
    file_ktp VARCHAR(255),
    file_drh VARCHAR(255),
    file_pengangkatan VARCHAR(255),
    file_keputusan_jabatan VARCHAR(255),
    file_piagam_x VARCHAR(255),
    file_piagam_xx VARCHAR(255),
    file_piagam_xxx VARCHAR(255),
    file_piagam_adibhakti VARCHAR(255),
    file_piagam_tokoh VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tb_surat_pemberitahuan (
    id SERIAL PRIMARY KEY,
    nama_pemberitahuan VARCHAR(255),
    tahun_pemberitahuan INTEGER CHECK (tahun_pemberitahuan >= 1900),
    jenis_pemberitahuan VARCHAR(255),
    file_pemberitahuan VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tb_laporan_kegiatan (
    id SERIAL PRIMARY KEY,
    nama_laporan VARCHAR(255),
    tahun_laporan INTEGER CHECK (tahun_laporan >= 1900),
    jenis_laporan VARCHAR(255),
    file_laporan VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tb_usulan (
    id SERIAL PRIMARY KEY,
    nama_usulan VARCHAR(255),
    jenis_usulan VARCHAR(255),
    tahun_usulan INTEGER CHECK (tahun_usulan >= 1900),
    instansi_usulan VARCHAR(255),
    file_usulan VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tb_distribusi (
    id SERIAL PRIMARY KEY,
    nama_distribusi VARCHAR(255),
    jenis_distribusi VARCHAR(255),
    tahun_distribusi INTEGER CHECK (tahun_distribusi >= 1900),
    instansi_distribusi VARCHAR(255),
    file_distribusi VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_individu_tgl ON data_individu (tgl_penghargaan);
CREATE INDEX idx_individu_jenis ON data_individu (jenis_penghargaan);
CREATE INDEX idx_individu_instansi ON data_individu (instansi);

CREATE INDEX idx_pemberitahuan_tahun ON tb_surat_pemberitahuan (tahun_pemberitahuan);
CREATE INDEX idx_pemberitahuan_jenis ON tb_surat_pemberitahuan (jenis_pemberitahuan);

CREATE INDEX idx_laporan_tahun ON tb_laporan_kegiatan (tahun_laporan);
CREATE INDEX idx_laporan_jenis ON tb_laporan_kegiatan (jenis_laporan);

CREATE INDEX idx_usulan_tahun ON tb_usulan (tahun_usulan);
CREATE INDEX idx_usulan_jenis ON tb_usulan (jenis_usulan);
CREATE INDEX idx_usulan_instansi ON tb_usulan (instansi_usulan);

CREATE INDEX idx_distribusi_tahun ON tb_distribusi (tahun_distribusi);
CREATE INDEX idx_distribusi_jenis ON tb_distribusi (jenis_distribusi);
CREATE INDEX idx_distribusi_instansi ON tb_distribusi (instansi_distribusi);

INSERT INTO mst_user (nama, email, hp, username, password, level) VALUES
('Administrator', 'admin@adhira.local', '080000000000', 'admin', '$2a$10$tecZLhDbroBLuj65q3FYmu5SGGv5HmjTfSjSF0DV1Dgpmb7Y.YnDq', 'Admin');
