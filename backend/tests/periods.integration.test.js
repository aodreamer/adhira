// All fixtures and migration objects are session-local TEMP tables.
const {Pool}=require('pg');
const fs=require('fs');
const path=require('path');
const express=require('express');
const request=require('supertest');
const jwt=require('jsonwebtoken');
jest.mock('../src/config/database',()=>({query:jest.fn(),connect:jest.fn()}));
const database=require('../src/config/database');
const app=express();app.use(express.json());app.use('/api/periods',require('../src/routes/period.routes'));
app.get('/api/executive-dashboard',require('../src/middleware/auth'),require('../src/middleware/rbac')('Admin','Pimpinan'),require('../src/controllers/executive-dashboard.controller').index);
const suite=process.env.EXECUTIVE_TEST_DATABASE_URL?describe:describe.skip;
suite('award periods API and PostgreSQL',()=>{
  let pool,revision,id,other;
  const token=(role='Admin')=>jwt.sign({id_user:role==='Admin'?1:role==='Pimpinan'?2:3,level:role},process.env.JWT_SECRET);
  const call=(method,url,body,role='Admin')=>request(app)[method]('/api'+url).set('Authorization','Bearer '+token(role)).send(body);
  const form=()=>({nama:'Penghargaan 2026 gelombang I',tahun:2026,start_date:'2026-01-01',end_date:'2026-12-31',status:'Persiapan',catatan:''});
  beforeAll(async()=>{
    process.env.JWT_SECRET='period-integration-only';pool=new Pool({connectionString:process.env.EXECUTIVE_TEST_DATABASE_URL,max:1});
    database.query.mockImplementation((...args)=>pool.query(...args));database.connect.mockImplementation(()=>pool.connect());
    await pool.query(`CREATE TEMP TABLE mst_user(id_user INT PRIMARY KEY,level TEXT,is_active SMALLINT);INSERT INTO mst_user VALUES(1,'Admin',1),(2,'Pimpinan',1),(3,'User',1);
      CREATE TEMP TABLE data_individu(id SERIAL PRIMARY KEY,nama TEXT,instansi TEXT,nama_instansi TEXT,pemda_tipe TEXT,pemda_provinsi TEXT,pemda_kabkota TEXT,jenis_penghargaan TEXT,tgl_penghargaan DATE,tgl_upload DATE,created_at TIMESTAMPTZ,verifikasi_data_status TEXT,verifikasi_berkas_status TEXT,file_kepka TEXT);
      CREATE TEMP TABLE tb_surat_pemberitahuan(id SERIAL PRIMARY KEY,nama_pemberitahuan TEXT,jenis_pemberitahuan TEXT,tahun_pemberitahuan INT);
      CREATE TEMP TABLE tb_usulan(id SERIAL PRIMARY KEY,nama_usulan TEXT,instansi_usulan TEXT,tahun_usulan INT);
      CREATE TEMP TABLE tb_distribusi(id SERIAL PRIMARY KEY,nama_distribusi TEXT,instansi_distribusi TEXT,tahun_distribusi INT);
      CREATE TEMP TABLE tb_laporan_kegiatan(id SERIAL PRIMARY KEY,nama_laporan TEXT,jenis_laporan TEXT,tahun_laporan INT);`);
    const sql=fs.readFileSync(path.join(__dirname,'../migrations/013_award_periods.up.sql'),'utf8').replaceAll('CREATE TABLE award_','CREATE TEMP TABLE award_');await pool.query(sql);
    await pool.query(`INSERT INTO data_individu(nama,instansi,jenis_penghargaan,tgl_penghargaan,tgl_upload,verifikasi_data_status,verifikasi_berkas_status) VALUES('Uji A','BSSN','10 Tahun','2026-01-01','2026-01-01','Disetujui','Disetujui'),('Uji B','TNI','20 Tahun','2026-02-01','2026-02-01','Menunggu','Menunggu'),('Uji C','BSSN','10 Tahun','2026-03-01','2026-03-01','Ditolak','Menunggu');
      INSERT INTO tb_surat_pemberitahuan VALUES(DEFAULT,'Surat uji','Awal',2026,NULL);`);
  });
  afterAll(async()=>pool?.end());
  test('role restrictions protect period writes and personal item lists',async()=>{
    expect((await request(app).get('/api/periods')).status).toBe(401);
    expect((await call('get','/periods',undefined,'User')).status).toBe(403);
    expect((await call('post','/periods',form(),'Pimpinan')).status).toBe(403);
    expect((await call('get','/periods/1/items/individu',undefined,'Pimpinan')).status).toBe(403);
  });
  test('create period with seven required stages and optional correction; reject invalid dates and duplicate names',async()=>{
    expect((await call('post','/periods',{...form(),end_date:'2025-12-31'})).status).toBe(400);
    expect((await call('post','/periods',{...form(),start_date:'2026-02-31'})).status).toBe(400);
    const r=await call('post','/periods',form());expect(r.status).toBe(201);id=r.body.id;revision=r.body.revision;
    expect(r.body.stages).toHaveLength(8);expect(r.body.progress).toMatchObject({total:7,selesai:0,persen:0});expect(r.body.documents.individu).toBe(0);
    expect((await call('post','/periods',form())).status).toBe(409);
    const second=await call('post','/periods',{...form(),nama:'Penghargaan 2026 gelombang II'});expect(second.status).toBe(201);other=second.body.id;
  });
  test('explicit association validates every ID, prevents silent reassignment, and filters executive panels',async()=>{
    const r=await call('put',`/periods/${id}/items/individu`,{ids:[1,2],action:'assign',revision});expect(r.status).toBe(200);revision=r.body.revision;expect(r.body.applicants).toMatchObject({total:2,lolos:1});
    expect((await call('put',`/periods/${other}/items/individu`,{ids:[1],action:'assign',revision:0})).status).toBe(409);
    expect((await call('put',`/periods/${id}/items/individu`,{ids:[9999],action:'assign',revision})).status).toBe(400);
    const p=await call('get',`/periods/${id}/items/individu?scope=assigned`);expect(p.body.total).toBe(2);
    const a=await call('get',`/periods/${id}/items/individu?scope=available`);expect(a.body.total).toBe(1);expect(a.body.rows[0].nama).toBe('Uji C');
    const dashboard=await call('get',`/executive-dashboard?periode_id=${id}`,undefined,'Pimpinan');expect(dashboard.status).toBe(200);expect(dashboard.body.summary).toMatchObject({total:2,sesuai:1,menunggu:1});expect(dashboard.body.provinces.reduce((n,x)=>n+x.total,0)).toBe(2);
    expect((await call('get',`/executive-dashboard?periode_id=${other}`)).body.summary.total).toBe(0);
    expect((await call('get',`/executive-dashboard?periode_id=${id}&instansi=BSSN`)).body.summary.total).toBe(1);
    expect((await call('get','/executive-dashboard?periode_id=-1')).status).toBe(400);
    const document=await call('put',`/periods/${id}/items/pemberitahuan`,{ids:[1],action:'assign',revision});expect(document.status).toBe(200);revision=document.body.revision;expect(document.body.documents.pemberitahuan).toBe(1);
  });
  test('stage edits enforce date range, completion evidence, skipped rules, and optimistic concurrency',async()=>{
    expect((await call('put',`/periods/${id}/stages/pemberitahuan`,{status:'Selesai',revision,catatan:''})).status).toBe(400);
    expect((await call('put',`/periods/${id}/stages/pemberitahuan`,{status:'Tidak diperlukan',revision})).status).toBe(400);
    expect((await call('put',`/periods/${id}/stages/pemberitahuan`,{status:'Berjalan',start_date:'2025-12-01',revision})).status).toBe(400);
    const old=revision;const r=await call('put',`/periods/${id}/stages/pemberitahuan`,{status:'Selesai',start_date:'2026-01-01',end_date:'2026-01-10',catatan:'Pemberitahuan telah disampaikan',revision});expect(r.status).toBe(200);revision=r.body.revision;expect(r.body.progress.persen).toBe(14);
    expect((await call('put',`/periods/${id}/stages/pengusulan`,{status:'Berjalan',revision:old})).status).toBe(409);
    expect((await call('put',`/periods/${id}`,{...form(),end_date:'2026-01-05',revision})).status).toBe(400);
  });
  test('close only after all required stages, lock changes, and allow deliberate reopening',async()=>{
    expect((await call('put',`/periods/${id}`,{...form(),status:'Selesai',revision})).status).toBe(400);
    const p=(await call('get',`/periods/${id}`)).body;
    for(const s of p.stages.filter(s=>!s.optional&&s.kode!=='pemberitahuan')){const r=await call('put',`/periods/${id}/stages/${s.kode}`,{status:'Selesai',catatan:'Hasil pelaksanaan dicatat',revision});expect(r.status).toBe(200);revision=r.body.revision;}
    const closed=await call('put',`/periods/${id}`,{...form(),status:'Selesai',revision});expect(closed.status).toBe(200);revision=closed.body.revision;expect(closed.body.progress.persen).toBe(100);
    expect((await call('put',`/periods/${id}/items/individu`,{ids:[1],action:'remove',revision})).status).toBe(409);
    expect((await call('put',`/periods/${id}/stages/pengusulan`,{status:'Berjalan',revision})).status).toBe(409);
    const reopened=await call('put',`/periods/${id}`,{...form(),status:'Aktif',revision});expect(reopened.status).toBe(200);revision=reopened.body.revision;
    const removed=await call('put',`/periods/${id}/items/individu`,{ids:[2],action:'remove',revision});expect(removed.status).toBe(200);revision=removed.body.revision;expect(removed.body.applicants.total).toBe(1);
  });
  test('leaders read aggregate periods without applicant identities; only empty preparatory periods can be deleted',async()=>{
    const list=await call('get','/periods',undefined,'Pimpinan');expect(list.status).toBe(200);expect(JSON.stringify(list.body)).not.toMatch(/Uji A|Uji B|Uji C/);
    expect((await call('delete',`/periods/${id}`,{revision})).status).toBe(400);
    expect((await call('delete',`/periods/${other}`,{revision:0})).status).toBe(200);
    expect((await call('get',`/periods/${other}`)).status).toBe(404);
    expect((await call('get',`/periods/${other}/items/individu?scope=available`)).status).toBe(404);
  });
});
