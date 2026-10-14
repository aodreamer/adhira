jest.mock('../src/config/database', () => ({ query: jest.fn() }));
const IndividuModel = require('../src/models/individu.model');

test('new imported applicants retain their structured Pemda location', async () => {
  const db = {query:jest.fn().mockResolvedValue({rows:[{id:42}]})};
  await IndividuModel.create({nama:'Uji wilayah',nipnrp:'123456',tgl_penghargaan:'2026-01-01',instansi:'Pemerintah Daerah',
    pemda_tipe:'Pemerintah Kabupaten',pemda_provinsi:'JAWA TIMUR',pemda_kabkota:'KABUPATEN TRENGGALEK'},db);
  const [sql,values] = db.query.mock.calls[0];
  const columns = sql.match(/\(([^)]+)\) VALUES/)[1].split(',').map(s=>s.trim());
  const inserted = Object.fromEntries(columns.map((column,index)=>[column,values[index]]));
  expect(inserted).toMatchObject({pemda_tipe:'Pemerintah Kabupaten',pemda_provinsi:'JAWA TIMUR',pemda_kabkota:'KABUPATEN TRENGGALEK'});
});
