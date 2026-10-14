const STAGES = [
  ['pemberitahuan','Pemberitahuan'],['pengusulan','Pengusulan'],
  ['verifikasi_data','Verifikasi data'],['verifikasi_berkas','Verifikasi berkas'],
  ['perbaikan','Perbaikan dan verifikasi ulang',true],['penetapan','Penetapan penghargaan'],
  ['distribusi','Distribusi dan serah terima'],['pelaporan','Pelaporan dan evaluasi'],
].map(([kode,label,optional=false],i)=>({kode,label,optional,urutan:i+1}));

function progress(stages, asOf) {
  const required=stages.filter(s=>s.status!=='Tidak diperlukan');
  const selesai=required.filter(s=>s.status==='Selesai').length;
  return {selesai,total:required.length,persen:required.length?Math.round(selesai/required.length*100):0,
    terlambat:required.filter(s=>s.status!=='Selesai'&&s.end_date&&s.end_date<asOf).length,
    berjalan:required.filter(s=>s.status==='Berjalan').length};
}
function validateStage(stage, period) {
  if(stage.status==='Tidak diperlukan'&&!stage.optional)return 'Tahap wajib tidak dapat dilewati';
  if(stage.start_date&&stage.end_date&&stage.start_date>stage.end_date)return 'Tanggal selesai tahap harus setelah atau sama dengan tanggal mulai';
  if([stage.start_date,stage.end_date].some(d=>d&&(d<period.start_date||d>period.end_date)))return 'Jadwal tahap harus berada dalam rentang periode';
  if(stage.status==='Selesai'&&!stage.catatan?.trim())return 'Isi catatan hasil pelaksanaan sebelum menyelesaikan tahap';
  return null;
}
module.exports={STAGES,progress,validateStage};
