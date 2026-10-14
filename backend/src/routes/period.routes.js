const express=require('express');
const Joi=require('joi');
const pool=require('../config/database');
const authenticate=require('../middleware/auth');
const authorize=require('../middleware/rbac');
const {STAGES,progress,validateStage}=require('../utils/period-progress');
const router=express.Router();
router.use(authenticate,authorize('Admin','Pimpinan'));
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
const date=Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((v,h)=>Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v?h.error('any.invalid'):v);
const periodSchema=Joi.object({nama:Joi.string().trim().min(3).max(150).required(),tahun:Joi.number().integer().min(1900).max(9999).required(),start_date:date.required(),end_date:date.required(),catatan:Joi.string().trim().allow('').max(5000).default(''),status:Joi.string().valid('Persiapan','Aktif','Selesai').default('Persiapan'),revision:Joi.number().integer().min(0)});
const stageSchema=Joi.object({status:Joi.string().valid('Belum dimulai','Berjalan','Selesai','Tidak diperlukan').required(),start_date:date.allow(null).default(null),end_date:date.allow(null).default(null),catatan:Joi.string().trim().allow('').max(5000).default(''),revision:Joi.number().integer().min(0).required()});
const MODULES={
  individu:{table:'data_individu',name:'nama',extra:'instansi',date:'tgl_penghargaan'},
  pemberitahuan:{table:'tb_surat_pemberitahuan',name:'nama_pemberitahuan',extra:'jenis_pemberitahuan',date:'tahun_pemberitahuan'},
  usulan:{table:'tb_usulan',name:'nama_usulan',extra:'instansi_usulan',date:'tahun_usulan'},
  distribusi:{table:'tb_distribusi',name:'nama_distribusi',extra:'instansi_distribusi',date:'tahun_distribusi'},
  laporan:{table:'tb_laporan_kegiatan',name:'nama_laporan',extra:'jenis_laporan',date:'tahun_laporan'},
};
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
async function detail(db,id){
  const {rows}=await db.query('SELECT *,start_date::text,end_date::text,CURRENT_DATE::text AS as_of_date FROM award_periods WHERE id=$1',[id]);
  if(!rows.length)throw fail('Periode tidak ditemukan',404);
  const period=rows[0];
  const s=await db.query('SELECT *,start_date::text,end_date::text FROM award_period_stages WHERE period_id=$1 ORDER BY urutan',[id]);
  period.stages=s.rows;period.progress=progress(s.rows,period.as_of_date);
  period.documents={};
  for(const [key,m] of Object.entries(MODULES)){const r=await db.query('SELECT COUNT(*)::int AS jumlah FROM '+m.table+' WHERE periode_id=$1',[id]);period.documents[key]=r.rows[0].jumlah;}
  const r=await db.query(`SELECT COUNT(*)::int AS total,
    COUNT(*) FILTER(WHERE verifikasi_data_status='Disetujui')::int AS data_disetujui,
    COUNT(*) FILTER(WHERE verifikasi_berkas_status='Disetujui')::int AS berkas_disetujui,
    COUNT(*) FILTER(WHERE verifikasi_data_status='Disetujui' AND verifikasi_berkas_status='Disetujui')::int AS lolos,
    COUNT(*) FILTER(WHERE verifikasi_data_status='Ditolak' OR verifikasi_berkas_status='Ditolak')::int AS perbaikan,
    COUNT(*) FILTER(WHERE NULLIF(BTRIM(file_kepka),'') IS NOT NULL)::int AS sk_tersedia
    FROM data_individu WHERE periode_id=$1`,[id]);
  period.applicants=r.rows[0];return period;
}
async function transaction(action){const db=await pool.connect();try{await db.query('BEGIN');const result=await action(db);await db.query('COMMIT');return result;}catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}}
async function lock(db,id,revision,allowClosed=false){const r=await db.query('SELECT *,start_date::text,end_date::text FROM award_periods WHERE id=$1 FOR UPDATE',[id]);if(!r.rows.length)throw fail('Periode tidak ditemukan',404);const p=r.rows[0];if(p.revision!==revision)throw fail('Data periode telah berubah. Muat ulang sebelum menyimpan.',409);if(p.status==='Selesai'&&!allowClosed)throw fail('Periode selesai dikunci. Buka kembali melalui pengaturan periode untuk melakukan perubahan.',409);return p;}
const bump=(db,id)=>db.query('UPDATE award_periods SET revision=revision+1,updated_at=NOW() WHERE id=$1',[id]);
function handle(fn){return async(req,res)=>{try{if(req.params.id&&!/^\d+$/.test(req.params.id))throw fail('ID periode tidak valid');await fn(req,res);}catch(e){if(e.code==='23505')return res.status(409).json({error:'Nama periode sudah digunakan'});if(!e.status)console.error('Period:',e.message);res.status(e.status||500).json({error:e.status?e.message:'Gagal memproses periode penghargaan'});}};}
router.get('/',handle(async(req,res)=>{
  const periods=await transaction(async db=>{await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');const r=await db.query('SELECT id FROM award_periods ORDER BY tahun DESC,start_date DESC,id DESC');const results=[];for(const p of r.rows)results.push(await detail(db,p.id));return results;});res.json(periods);
}));
router.post('/',authorize('Admin'),handle(async(req,res)=>{
  const {error,value:v}=periodSchema.validate(req.body);if(error)throw fail('Data periode tidak valid: '+error.details[0].message);
  if(v.start_date>v.end_date)throw fail('Rentang tanggal periode tidak valid');if(v.status==='Selesai')throw fail('Periode baru harus berstatus Persiapan atau Aktif');
  const result=await transaction(async db=>{const r=await db.query('INSERT INTO award_periods(nama,tahun,start_date,end_date,catatan,status,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[v.nama,v.tahun,v.start_date,v.end_date,v.catatan,v.status,req.user.id_user]);const id=r.rows[0].id;for(const s of STAGES)await db.query('INSERT INTO award_period_stages(period_id,kode,label,urutan,optional,status) VALUES($1,$2,$3,$4,$5,$6)',[id,s.kode,s.label,s.urutan,s.optional,s.optional?'Tidak diperlukan':'Belum dimulai']);return detail(db,id);});res.status(201).json(result);
}));
router.get('/:id',handle(async(req,res)=>res.json(await transaction(async db=>{await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');return detail(db,req.params.id);} ))));
router.put('/:id',authorize('Admin'),handle(async(req,res)=>{
  const {error,value:v}=periodSchema.validate(req.body);if(error||v.revision===undefined)throw fail('Data periode atau revision tidak valid');if(v.start_date>v.end_date)throw fail('Rentang tanggal periode tidak valid');
  res.json(await transaction(async db=>{await lock(db,req.params.id,v.revision,true);const p=await detail(db,req.params.id);for(const s of p.stages){const err=validateStage(s,v);if(err)throw fail(err);}if(v.status==='Selesai'&&p.progress.selesai!==p.progress.total)throw fail('Selesaikan seluruh tahap yang diperlukan sebelum menutup periode');
    await db.query('UPDATE award_periods SET nama=$1,tahun=$2,start_date=$3,end_date=$4,status=$5,catatan=$6,revision=revision+1,updated_at=NOW() WHERE id=$7',[v.nama,v.tahun,v.start_date,v.end_date,v.status,v.catatan,req.params.id]);return detail(db,req.params.id);}));
}));
router.put('/:id/stages/:kode',authorize('Admin'),handle(async(req,res)=>{
  const {error,value:v}=stageSchema.validate(req.body);if(error)throw fail('Data tahap tidak valid: '+error.details[0].message);
  res.json(await transaction(async db=>{const p=await lock(db,req.params.id,v.revision);const r=await db.query('SELECT * FROM award_period_stages WHERE period_id=$1 AND kode=$2',[req.params.id,req.params.kode]);if(!r.rows.length)throw fail('Tahap tidak ditemukan',404);const err=validateStage({...r.rows[0],...v},p);if(err)throw fail(err);
    await db.query(`UPDATE award_period_stages SET status=$1::varchar,start_date=$2,end_date=$3,catatan=$4,completed_at=CASE WHEN $1::varchar='Selesai' THEN COALESCE(completed_at,NOW()) ELSE NULL END,updated_by=$5,updated_at=NOW() WHERE period_id=$6 AND kode=$7`,[v.status,v.start_date,v.end_date,v.catatan,req.user.id_user,req.params.id,req.params.kode]);await bump(db,req.params.id);return detail(db,req.params.id);}));
}));
router.get('/:id/items/:module',authorize('Admin'),handle(async(req,res)=>{
  const m=MODULES[req.params.module];if(!m)throw fail('Modul tidak valid');
  const schema=Joi.object({search:Joi.string().trim().allow('').max(150).default(''),page:Joi.number().integer().min(1).max(100000).default(1),scope:Joi.string().valid('assigned','available').default('assigned')});
  const {error,value:v}=schema.validate(req.query);if(error)throw fail('Filter daftar tidak valid');
  const period=await pool.query('SELECT id FROM award_periods WHERE id=$1',[req.params.id]);if(!period.rows.length)throw fail('Periode tidak ditemukan',404);
  const condition=v.scope==='assigned'?'periode_id=$1':'periode_id IS NULL';const where=' WHERE '+condition+' AND (COALESCE('+m.name+",'') ILIKE $2 OR COALESCE("+m.extra+",'') ILIKE $2)";
  const params=[req.params.id,'%'+v.search+'%'];
  // Keep both bind parameters present for the available scope as well.
  const clause=v.scope==='available'?where.replace('periode_id IS NULL','periode_id IS NULL AND $1::int IS NOT NULL'):where;
  const r=await pool.query('SELECT id,'+m.name+' AS nama,'+m.extra+' AS keterangan,'+m.date+'::text AS tanggal FROM '+m.table+clause+' ORDER BY id DESC LIMIT 25 OFFSET $3',[...params,(v.page-1)*25]);
  const count=await pool.query('SELECT COUNT(*)::int AS total FROM '+m.table+clause,params);res.json({rows:r.rows,total:count.rows[0].total,page:v.page});
}));
router.put('/:id/items/:module',authorize('Admin'),handle(async(req,res)=>{
  const m=MODULES[req.params.module];if(!m)throw fail('Modul tidak valid');const schema=Joi.object({ids:Joi.array().items(Joi.number().integer().positive()).min(1).max(500).unique().required(),action:Joi.string().valid('assign','remove').required(),revision:Joi.number().integer().min(0).required()});const {error,value:v}=schema.validate(req.body);if(error)throw fail('Pilihan data tidak valid');
  res.json(await transaction(async db=>{await lock(db,req.params.id,v.revision);const rows=await db.query('SELECT id,periode_id FROM '+m.table+' WHERE id=ANY($1::int[]) ORDER BY id FOR UPDATE',[v.ids]);if(rows.rows.length!==v.ids.length)throw fail('Sebagian data tidak ditemukan');if(rows.rows.some(r=>v.action==='assign'?r.periode_id!==null&&r.periode_id!==Number(req.params.id):r.periode_id!==Number(req.params.id)))throw fail('Sebagian data sudah terkait periode lain atau bukan anggota periode ini',409);
    await db.query('UPDATE '+m.table+' SET periode_id=$1 WHERE id=ANY($2::int[])',[v.action==='assign'?Number(req.params.id):null,v.ids]);await bump(db,req.params.id);return detail(db,req.params.id);}));
}));
router.delete('/:id',authorize('Admin'),handle(async(req,res)=>{
  const {error,value:v}=Joi.object({revision:Joi.number().integer().min(0).required()}).validate(req.body);if(error)throw fail('Revision wajib diisi');
  await transaction(async db=>{const p=await lock(db,req.params.id,v.revision);if(p.status!=='Persiapan')throw fail('Hanya periode Persiapan yang dapat dihapus');const d=await detail(db,req.params.id);if(Object.values(d.documents).some(Boolean))throw fail('Lepaskan seluruh data terkait sebelum menghapus periode');await db.query('DELETE FROM award_periods WHERE id=$1',[req.params.id]);});res.json({message:'Periode berhasil dihapus'});
}));
module.exports=router;
