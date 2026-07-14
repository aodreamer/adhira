-- Pisah "Jabatan" dari satuan/unit kerjanya, supaya baris sertifikat bisa
-- disusun konsisten sebagai "{jabatan} pada {unit_kerja}".

ALTER TABLE data_individu ADD COLUMN IF NOT EXISTS unit_kerja VARCHAR(255);
