const {STAGES,progress,validateStage}=require('../src/utils/period-progress');
test('optional corrections are excluded; mandatory stages determine progress',()=>{
  const stages=STAGES.map(s=>({...s,status:s.optional?'Tidak diperlukan':'Belum dimulai'}));
  expect(progress(stages,'2026-10-14')).toMatchObject({total:7,selesai:0,persen:0});
  stages[0].status='Selesai';expect(progress(stages,'2026-10-14').persen).toBe(14);
  stages[4].status='Berjalan';expect(progress(stages,'2026-10-14').total).toBe(8);
  stages.forEach(s=>s.status='Selesai');expect(progress(stages,'2026-10-14').persen).toBe(100);
});
test('late stages exclude skipped/completed stages and include only elapsed deadlines',()=>{
  expect(progress([{status:'Berjalan',end_date:'2026-10-13'},{status:'Belum dimulai',end_date:'2026-10-14'},{status:'Selesai',end_date:'2026-10-01'},{status:'Tidak diperlukan',end_date:'2026-10-01'}],'2026-10-14').terlambat).toBe(1);
});
test('stage completion requires a note and validates schedule and optional rules',()=>{
  const p={start_date:'2026-01-01',end_date:'2026-12-31'};
  expect(validateStage({status:'Selesai',catatan:'  '},p)).toBeTruthy();
  expect(validateStage({status:'Tidak diperlukan',optional:false},p)).toBeTruthy();
  expect(validateStage({status:'Berjalan',start_date:'2025-12-01'},p)).toBeTruthy();
  expect(validateStage({status:'Berjalan',start_date:'2026-02-01',end_date:'2026-01-01'},p)).toBeTruthy();
  expect(validateStage({status:'Selesai',catatan:'Surat telah disampaikan',start_date:'2026-01-01',end_date:'2026-01-02'},p)).toBeNull();
});
