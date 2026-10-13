const { parseTemplateBuffer, generateTemplateWorkbook } = require('../src/services/import-parser');
const ExcelJS = require('exceljs');

async function bufferFromRows(rows) {
  const templateBuffer = await generateTemplateWorkbook();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.worksheets[0];
  rows.forEach((row, i) => {
    const r = sheet.getRow(3 + i);
    r.getCell(1).value = row.nama;
    r.getCell(2).value = row.nipnrp;
    r.getCell(3).value = row.email;
    r.getCell(4).value = row.hp || '';
    r.getCell(5).value = row.jabatan;
    r.getCell(6).value = row.unit_kerja || '';
    r.getCell(7).value = row.pangkat;
    r.getCell(8).value = row.jenis_penghargaan;
    r.getCell(9).value = row.tgl_tmt_cpns_pns || '';
    r.getCell(10).value = row.masa_kerja_kumulatif_tahun ?? '';
    r.getCell(11).value = row.masa_kerja_kumulatif_bulan ?? '';
    r.getCell(12).value = row.masa_kerja_pengurangan_tahun ?? '';
    r.getCell(13).value = row.masa_kerja_pengurangan_bulan ?? '';
    r.getCell(14).value = row.pemda_tipe || '';
    r.getCell(15).value = row.pemda_provinsi || '';
    r.getCell(16).value = row.pemda_kabkota || '';
  });
  return workbook.xlsx.writeBuffer();
}

describe('import-parser dummy usulan (Reza Aulia)', () => {
  const rezaRow = {
    nama: 'Reza Aulia',
    nipnrp: '198501012010011001',
    email: 'reza04280@gmail.com',
    hp: '081234567890',
    jabatan: 'Analis Persandian',
    unit_kerja: 'Direktorat Keamanan Siber',
    pangkat: 'Penata Muda (III/a)',
    jenis_penghargaan: 'Dharma Persandian',
  };

  test('parses a valid non-pemda dummy row', async () => {
    const buffer = await bufferFromRows([rezaRow]);
    const { headerErrors, rows } = await parseTemplateBuffer(buffer, 'BSSN');
    expect(headerErrors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].row_status).toBe('Valid');
    expect(rows[0].nama).toBe('Reza Aulia');
    expect(rows[0].email).toBe('reza04280@gmail.com');
  });

  test('requires pemda fields when instansi is Pemerintah Daerah', async () => {
    const buffer = await bufferFromRows([rezaRow]);
    const { rows } = await parseTemplateBuffer(buffer, 'Pemerintah Daerah');
    expect(rows[0].row_status).toBe('Error');
    const fields = rows[0].errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['pemda_tipe', 'pemda_provinsi']));
  });

  test('accepts a valid pemda row with matching province/regency/type', async () => {
    const buffer = await bufferFromRows([{
      ...rezaRow,
      pemda_tipe: 'Pemerintah Provinsi',
      pemda_provinsi: 'DKI JAKARTA',
    }]);
    const { rows } = await parseTemplateBuffer(buffer, 'Pemerintah Daerah');
    expect(rows[0].row_status).toBe('Valid');
    expect(rows[0].pemda_provinsi).toBe('DKI JAKARTA');
  });

  test('rejects an invalid pangkat value', async () => {
    const buffer = await bufferFromRows([{ ...rezaRow, pangkat: 'Pangkat Tidak Dikenal' }]);
    const { rows } = await parseTemplateBuffer(buffer, 'BSSN');
    expect(rows[0].row_status).toBe('Error');
    expect(rows[0].errors.some((e) => e.field === 'pangkat')).toBe(true);
  });

  test('rejects a malformed email', async () => {
    const buffer = await bufferFromRows([{ ...rezaRow, email: 'not-an-email' }]);
    const { rows } = await parseTemplateBuffer(buffer, 'BSSN');
    expect(rows[0].row_status).toBe('Error');
    expect(rows[0].errors.some((e) => e.field === 'email')).toBe(true);
  });

  test('never yields NaN for non-numeric masa kerja cells', async () => {
    const buffer = await bufferFromRows([{
      ...rezaRow,
      masa_kerja_kumulatif_tahun: 'abc',
      masa_kerja_kumulatif_bulan: 'xyz',
      masa_kerja_pengurangan_tahun: '1,5',
      masa_kerja_pengurangan_bulan: 'k', 
    }]);
    const { rows } = await parseTemplateBuffer(buffer, 'BSSN');
    expect(rows[0].row_status).toBe('Error');
    const m = rows[0];
    expect(m.masa_kerja_kumulatif_tahun).toBeNull();
    expect(m.masa_kerja_kumulatif_bulan).toBeNull();
    expect(m.masa_kerja_pengurangan_tahun).toBeNull();
    expect(m.masa_kerja_pengurangan_bulan).toBeNull();
    expect(Number.isNaN(m.masa_kerja_kumulatif_tahun)).toBe(false);
  });

  test('accepts pemda province/regency typed in mixed case without prefix', async () => {
    const buffer = await bufferFromRows([{
      ...rezaRow,
      pemda_tipe: 'Pemerintah Kabupaten',
      pemda_provinsi: 'Jawa Tengah',
      pemda_kabkota: 'Blora',
    }]);
    const { rows } = await parseTemplateBuffer(buffer, 'Pemerintah Daerah');
    expect(rows[0].row_status).toBe('Valid');
    expect(rows[0].pemda_provinsi).toBe('JAWA TENGAH');
    expect(rows[0].pemda_kabkota).toBe('KABUPATEN BLORA');
  });
});
