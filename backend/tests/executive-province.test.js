const { resolveProvince, aggregateProvinces } = require('../src/utils/executive-province');

test.each([
  ['PEMPROV JATIM', 'JAWA TIMUR'], ['PEMPROV DKI JAKARTA', 'DKI JAKARTA'],
  ['PEMKAB GUNUNG KIDUL', 'DI YOGYAKARTA'], ['PEMKAB MUARO JAMBI', 'JAMBI'],
  ['PEMKAB SAROLANGUN', 'JAMBI'], ['PEMKAB SUKABUMI', 'JAWA BARAT'],
  ['PEMKAB TRENGGALEK', 'JAWA TIMUR'], ['PEMKOT SUKABUMI', 'JAWA BARAT'],
  ['KEJATI SULTRA', 'SULAWESI TENGGARA'], ['KEJATI KALSEL', 'KALIMANTAN SELATAN'],
  ['KEJATI SUMSEL', 'SUMATERA SELATAN'], ['KEJATI LAMPUNG', 'LAMPUNG'],
  ['PEMERINTAH PROVINSI BANTEN', 'BANTEN'], [' pemprov   jatim ', 'JAWA TIMUR'],
  ['BSSN', null], ['KEMENLU', null], ['TNI AD', null], ['PEMPROV TIDAK DIKENAL', null],
  ['PEMKAB TIDAK DIKENAL', null],
])('%s resolves to %s', (instansi, expected) => {
  expect(resolveProvince({ instansi })).toBe(expected);
});

test('explicit Pemda province takes precedence and national institutions stay unmapped', () => {
  expect(resolveProvince({instansi:'Pemerintah Daerah',provinsi:' Jawa Barat ',kabkota:'KABUPATEN TRENGGALEK'})).toBe('JAWA BARAT');
  expect(resolveProvince({instansi:'Pemerintah Daerah',kabkota:'KABUPATEN TRENGGALEK'})).toBe('JAWA TIMUR');
  expect(resolveProvince({instansi:'BSSN',provinsi:'DKI JAKARTA'})).toBeNull();
  expect(resolveProvince({instansi:'Pemerintah Daerah',provinsi:'Wilayah tidak dikenal'})).toBe('WILAYAH TIDAK DIKENAL');
});

test('legacy and structured data merge without losing counts or exposing institution labels', () => {
  const rows = [
    {instansi:'PEMPROV JATIM',total:4,menunggu:4},
    {instansi:'PEMKAB TRENGGALEK',total:6,perbaikan:2,menunggu:4},
    {instansi:'Pemerintah Daerah',provinsi:'JAWA TIMUR',total:1,sesuai:1,sk_tersedia:1},
    {instansi:'BSSN',total:5,draft:5},
  ];
  const result = aggregateProvinces(rows);
  expect(result).toEqual([
    {provinsi:'JAWA TIMUR',total:11,sesuai:1,menunggu:8,perbaikan:2,draft:0,sk_tersedia:1},
    {provinsi:null,total:5,sesuai:0,menunggu:0,perbaikan:0,draft:5,sk_tersedia:0},
  ]);
  expect(rows[0].total).toBe(4);
  expect(aggregateProvinces([])).toEqual([]);
});
