import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildProvinceMap, normalizeProvinceName } from '../src/utils/province-map.js';
const geometry=JSON.parse(fs.readFileSync(new URL('../src/assets/maps/indonesia-provinces.json',import.meta.url),'utf8'));

test('map contains distinct valid geometry for all 38 provinces, including the four new Papua provinces',()=>{
  assert.equal(geometry.provinces.length,38);
  assert.equal(new Set(geometry.provinces.map(r=>r.code)).size,38);
  for(const name of ['Papua Selatan','Papua Tengah','Papua Pegunungan','Papua Barat Daya']) assert(geometry.provinces.some(p=>p.name===name));
  for(const p of geometry.provinces){ assert(p.d.startsWith('M'));assert(p.d.endsWith('Z'));assert(!p.d.includes('NaN'));assert.equal(p.bounds.length,4); }
});
test('stored uppercase names and older Yogyakarta spelling map to the same province',()=>{
  assert.equal(normalizeProvinceName(' Provinsi Jawa  Barat '),'JAWA BARAT');
  const result=buildProvinceMap(geometry.provinces,[{provinsi:'DI YOGYAKARTA',total:2,sesuai:1},{provinsi:'Daerah Istimewa Yogyakarta',total:3,menunggu:3}]);
  const region=result.regions.find(r=>r.name==='Daerah Istimewa Yogyakarta');
  assert.equal(region.total,5);assert.equal(region.sesuai,1);assert.equal(region.menunggu,3);assert.equal(result.unmapped.total,0);
});
test('unknown and absent province values remain unmapped; totals reconcile',()=>{
  const result=buildProvinceMap(geometry.provinces,[{provinsi:'JAWA BARAT',total:7},{provinsi:null,total:10},{provinsi:'Provinsi tidak dikenal',total:4}]);
  assert.equal(result.unmapped.total,14);
  assert.equal(result.regions.reduce((sum,r)=>sum+r.total,0)+result.unmapped.total,21);
  assert.deepEqual(result.unmatchedNames,['Provinsi tidak dikenal']);
});
test('empty data keeps all provinces available with zero counts',()=>{
  const result=buildProvinceMap(geometry.provinces,[]);
  assert.equal(result.regions.length,38);assert.equal(result.unmapped.total,0);assert(result.regions.every(p=>p.total===0));
});
