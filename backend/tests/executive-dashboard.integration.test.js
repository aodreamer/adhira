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
    expect(r.provinces.reduce((sum,s)=>sum+s.total,0)).toBe(7);
    expect(r.verification_matrix.reduce((sum,s)=>sum+s.jumlah,0)).toBe(7);
    expect(r.waiting_age.reduce((sum,s)=>sum+s.jumlah,0)).toBe(r.summary.menunggu);
    expect(r.summary.sesuai_tanpa_sk).toBe(1);
    expect(r.institutions.reduce((sum,s)=>sum+s.menunggu_30_hari,0)).toBe(r.summary.menunggu_30_hari);
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
  test('province aggregates follow filters without inferring location from non-Pemda institutions', async () => {
    await pool.query(`INSERT INTO data_individu (tgl_upload,instansi,pemda_provinsi,jenis_penghargaan,verifikasi_data_status,verifikasi_berkas_status)
      VALUES ('2026-01-01','Pemerintah Daerah',' Jawa Barat ','Uji peta','Disetujui','Disetujui'),
        ('2026-02-01','Pemerintah Daerah','JAWA BARAT','Uji peta','Ditolak','Menunggu'),
        ('2025-01-01','Pemerintah Daerah','BALI','Uji peta','Menunggu','Menunggu'),
        ('2026-01-01','BSSN','DKI JAKARTA','Uji peta','Menunggu','Menunggu')`);
    const r=await loadExecutiveDashboard(pool,{tahun:2026,instansi:null,jenis:'Uji peta'});
    expect(r.summary.total).toBe(3);
    expect(r.provinces.find(row=>row.provinsi==='JAWA BARAT')).toMatchObject({total:2,sesuai:1,perbaikan:1});
    expect(r.provinces.find(row=>row.provinsi===null)).toMatchObject({total:1,menunggu:1});
    expect(r.provinces.reduce((sum,row)=>sum+row.total,0)).toBe(3);
    expect(r.provinces.some(row=>row.provinsi==='BALI')).toBe(false);
  });
  test('legacy institution geography merges with structured provinces and follows global filters', async () => {
    await pool.query(`INSERT INTO data_individu (tgl_upload,instansi,pemda_provinsi,jenis_penghargaan,verifikasi_data_status,verifikasi_berkas_status)
      VALUES ('2026-01-01','PEMPROV JATIM',NULL,'Uji peta lama','Menunggu','Menunggu'),
        ('2026-02-01','PEMKAB TRENGGALEK',NULL,'Uji peta lama','Ditolak','Menunggu'),
        ('2026-03-01','Pemerintah Daerah','JAWA TIMUR','Uji peta lama','Disetujui','Disetujui'),
        ('2025-01-01','PEMPROV BANTEN',NULL,'Uji peta lama','Menunggu','Menunggu'),
        ('2026-01-01','BSSN',NULL,'Uji peta lama','Menunggu','Menunggu')`);
    const r=await loadExecutiveDashboard(pool,{tahun:2026,instansi:null,jenis:'Uji peta lama'});
    expect(r.summary.total).toBe(4);
    expect(r.provinces.find(row=>row.provinsi==='JAWA TIMUR')).toMatchObject({total:3,sesuai:1,menunggu:1,perbaikan:1});
    expect(r.provinces.find(row=>row.provinsi===null)).toMatchObject({total:1});
    expect(r.provinces.some(row=>row.provinsi==='BANTEN')).toBe(false);
    const filtered=await loadExecutiveDashboard(pool,{tahun:2026,instansi:'PEMKAB TRENGGALEK',jenis:'Uji peta lama'});
    expect(filtered.provinces).toEqual([{provinsi:'JAWA TIMUR',total:1,sesuai:0,menunggu:0,perbaikan:1,draft:0,sk_tersedia:0}]);
  });
  test('waiting age bins include exact boundaries and preserve unknown and future dates',async()=>{
    await pool.query(`INSERT INTO data_individu (tgl_upload,instansi,jenis_penghargaan,verifikasi_data_status,verifikasi_berkas_status)
      SELECT CURRENT_DATE - n,'BSSN','Uji kelompok usia','Menunggu','Menunggu' FROM unnest(ARRAY[0,7,8,14,15,29,30,59,60,-1]) AS n`);
    await pool.query(`INSERT INTO data_individu (instansi,jenis_penghargaan,verifikasi_data_status,verifikasi_berkas_status) VALUES ('BSSN','Uji kelompok usia','Menunggu','Menunggu')`);
    const r=await loadExecutiveDashboard(pool,{tahun:null,instansi:'BSSN',jenis:'Uji kelompok usia'});
    const counts=Object.fromEntries(r.waiting_age.map(row=>[row.kelompok,row.jumlah]));
    expect(counts).toEqual({'0-7':2,'8-14':2,'15-29':2,'30-59':2,'60+':1,future:1,unknown:1});
    expect(r.summary.menunggu).toBe(11);expect(r.summary.menunggu_30_hari).toBe(3);
  });
  test('matrix and SK gap follow the same filters without assuming SK implies verification',async()=>{
    await pool.query(`INSERT INTO data_individu (tgl_upload,instansi,jenis_penghargaan,verifikasi_data_status,verifikasi_berkas_status,file_kepka)
      VALUES ('2026-01-01','TNI','Uji matriks','Disetujui','Disetujui',NULL),
        ('2026-01-01','TNI','Uji matriks','Disetujui','Disetujui','sk.pdf'),
        ('2026-01-01','TNI','Uji matriks','Ditolak','Disetujui','sk.pdf'),
        ('2026-01-01','TNI','Uji matriks','Status lama','Menunggu',NULL),
        ('2025-01-01','TNI','Uji matriks','Disetujui','Disetujui',NULL)`);
    const r=await loadExecutiveDashboard(pool,{tahun:2026,instansi:'TNI',jenis:'Uji matriks'});
    expect(r.summary).toMatchObject({total:4,sesuai:2,sk_tersedia:2,sesuai_tanpa_sk:1});
    expect(r.verification_matrix.reduce((sum,c)=>sum+c.jumlah,0)).toBe(4);
    expect(r.verification_matrix.find(c=>c.status_data==='Lainnya')).toMatchObject({status_berkas:'Menunggu',jumlah:1});
  });
});
