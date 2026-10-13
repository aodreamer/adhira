export const STAGES = [
  {key:'draft',label:'Jenis belum ditetapkan',color:'#9aaabd'},
  {key:'verifikasi_data',label:'Menunggu data',color:'#c59b51'},
  {key:'verifikasi_berkas',label:'Menunggu berkas',color:'#608bae'},
  {key:'perbaikan',label:'Perlu perbaikan',color:'#c46d75'},
  {key:'sesuai',label:'Lolos verifikasi',color:'#248777'},
];
export function waitingAge(rows=[]){
  const definitions=[['0-7','0–7 hari'],['8-14','8–14 hari'],['15-29','15–29 hari'],['30-59','30–59 hari'],['60+','≥60 hari']];
  const counts=new Map(rows.map(row=>[row.kelompok,row.jumlah]));
  return {bins:definitions.map(([key,label])=>({key,label,jumlah:counts.get(key)||0})),unknown:counts.get('unknown')||0,future:counts.get('future')||0};
}
export function rankInstitutions(rows=[]){
  return rows.map(row=>({...row,attention:(row.perbaikan||0)+(row.menunggu_30_hari||0)}))
    .filter(row=>row.attention>0).sort((a,b)=>b.attention-a.attention||b.perbaikan-a.perbaikan||a.instansi.localeCompare(b.instansi,'id'));
}
export function verificationMatrix(rows=[]){
  const states=['Disetujui','Menunggu','Ditolak'];
  if(rows.some(row=>row.status_data==='Lainnya'||row.status_berkas==='Lainnya'))states.push('Lainnya');
  return {states,cells:states.flatMap(data=>states.map(berkas=>({data,berkas,jumlah:rows.filter(row=>row.status_data===data&&row.status_berkas===berkas).reduce((sum,row)=>sum+row.jumlah,0)})))};
}
