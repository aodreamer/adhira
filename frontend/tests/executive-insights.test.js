import test from 'node:test';
import assert from 'node:assert/strict';
import { waitingAge,rankInstitutions,verificationMatrix } from '../src/utils/executive-insights.js';

test('age bins retain zero intervals and separate missing/future dates',()=>{
  const age=waitingAge([{kelompok:'30-59',jumlah:3},{kelompok:'unknown',jumlah:2},{kelompok:'future',jumlah:1}]);
  assert.deepEqual(age.bins.map(b=>b.jumlah),[0,0,0,3,0]);assert.equal(age.unknown,2);assert.equal(age.future,1);
});
test('coordination priority ranks actual correction and older waiting counts',()=>{
  const rows=rankInstitutions([
    {instansi:'Instansi A',perbaikan:2,menunggu_30_hari:1},
    {instansi:'Instansi B',perbaikan:1,menunggu_30_hari:5},
    {instansi:'Instansi C',perbaikan:0,menunggu_30_hari:0},
  ]);
  assert.deepEqual(rows.map(r=>[r.instansi,r.attention]),[['Instansi B',6],['Instansi A',3]]);
});
test('matrix includes every combination and does not lose unknown status totals',()=>{
  const matrix=verificationMatrix([{status_data:'Disetujui',status_berkas:'Ditolak',jumlah:3},{status_data:'Lainnya',status_berkas:'Menunggu',jumlah:2}]);
  assert.equal(matrix.cells.length,16);assert.equal(matrix.cells.reduce((sum,c)=>sum+c.jumlah,0),5);
  assert.equal(matrix.cells.find(c=>c.data==='Disetujui'&&c.berkas==='Ditolak').jumlah,3);
});
test('empty aggregates yield empty priority, zero age and a zero matrix',()=>{
  assert.deepEqual(rankInstitutions(),[]);assert(waitingAge().bins.every(b=>b.jumlah===0));
  assert.equal(verificationMatrix().cells.reduce((sum,c)=>sum+c.jumlah,0),0);
});
