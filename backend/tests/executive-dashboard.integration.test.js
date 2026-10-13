// Run against an isolated PostgreSQL instance. Tables are session-local and never alter production data.
const { Pool } = require('pg');
const { loadExecutiveDashboard } = require('../src/models/executive-dashboard.model');
const suite = process.env.EXECUTIVE_TEST_DATABASE_URL ? describe : describe.skip;
suite('executive PostgreSQL aggregates', () => {
  let pool;
  beforeAll(async () => {
    pool = new Pool({ connectionString:process.env.EXECUTIVE_TEST_DATABASE_URL,max:1 });
    await pool.query(`CREATE TEMP TABLE data_individu (
      tgl_upload DATE, created_at TIMESTAMPTZ, instansi TEXT, nama_instansi TEXT,
      pemda_tipe TEXT, pemda_provinsi TEXT, pemda_kabkota TEXT, jenis_penghargaan TEXT,
      verifikasi_data_status TEXT, verifikasi_berkas_status TEXT, file_kepka TEXT)`);
    const fixtures = [
      ['2026-01-01','BSSN','10 Tahun','Disetujui','Disetujui','sk.pdf'],
      ['2026-02-01','BSSN','10 Tahun','Disetujui','Menunggu',null],
      ['2026-03-01','BSSN','20 Tahun','Ditolak','Disetujui',null],
      ['2026-04-01','TNI','Sedang Diajukan','Menunggu','Menunggu',null],
      ['2026-05-01','TNI','30 Tahun','Menunggu','Menunggu',null],
      ['2025-01-01','BSSN','10 Tahun','Disetujui','Disetujui',null],
      [null,'',null,'Menunggu','Menunggu',null],
    ];
    for (const row of fixtures) await pool.query('INSERT INTO data_individu (tgl_upload,instansi,jenis_penghargaan,verifikasi_data_status,verifikasi_berkas_status,file_kepka) VALUES ($1,$2,$3,$4,$5,$6)',row);
  });
  afterAll(async () => { await pool?.end(); });
  test('exclusive statuses, independent SK count, and all-time grouping reconcile', async () => {
    const r=await loadExecutiveDashboard(pool,{tahun:null,instansi:null,jenis:null});
    expect(r.summary).toMatchObject({total:7,sesuai:2,menunggu:2,perbaikan:1,draft:2,sk_tersedia:1,tanggal_kosong:1,instansi_kosong:1});
    expect(r.stages.reduce((sum,s)=>sum+s.jumlah,0)).toBe(7);
    expect(r.institutions.reduce((sum,s)=>sum+s.total,0)).toBe(7);
    expect(r.trend.reduce((sum,s)=>sum+s.total,0)).toBe(6);
    expect(r.options.tahun).toEqual([2026,2025]);
    expect(JSON.stringify(r)).not.toMatch(/sk\.pdf|nipnrp|file_kepka/);
  });
  test('combined filters affect every panel, while filter options remain global', async () => {
    const r=await loadExecutiveDashboard(pool,{tahun:2026,instansi:'BSSN',jenis:'10 Tahun'});
    expect(r.summary).toMatchObject({total:2,sesuai:1,menunggu:1,perbaikan:0,draft:0,sk_tersedia:1});
    expect(r.trend.map(row=>row.periode)).toEqual(['2026-01','2026-02']);
    expect(r.institutions).toHaveLength(1);
    expect(r.options.instansi).toEqual(['BSSN','Belum diisi','TNI']);
  });
  test('zero matching data produces zero counts and empty arrays', async () => {
    const r=await loadExecutiveDashboard(pool,{tahun:2030,instansi:null,jenis:null});
    expect(r.summary.total).toBe(0); expect(r.stages).toEqual([]); expect(r.trend).toEqual([]); expect(r.institutions).toEqual([]);
  });
  test('filter strings are bound as values', async () => {
    const r=await loadExecutiveDashboard(pool,{tahun:null,instansi:"BSSN' OR TRUE --",jenis:null});
    expect(r.summary.total).toBe(0);
  });
  test('attention threshold includes day 30 and excludes day 29', async () => {
    await pool.query(`INSERT INTO data_individu (tgl_upload,instansi,jenis_penghargaan,verifikasi_data_status,verifikasi_berkas_status)
      VALUES (CURRENT_DATE - 29,'BSSN','Uji usia','Menunggu','Menunggu'),
        (CURRENT_DATE - 30,'BSSN','Uji usia','Menunggu','Menunggu')`);
    const r=await loadExecutiveDashboard(pool,{tahun:null,instansi:'BSSN',jenis:'Uji usia'});
    expect(r.summary.total).toBe(2); expect(r.summary.menunggu_30_hari).toBe(1);
  });
});
