const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
jest.mock('../src/config/database', () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock('../src/models/executive-dashboard.model', () => ({ loadExecutiveDashboard: jest.fn() }));
const pool = require('../src/config/database');
const { loadExecutiveDashboard } = require('../src/models/executive-dashboard.model');
const { createUserSchema } = require('../src/validators/user.validator');

const app = express(); app.use(express.json()); app.use('/api', require('../src/routes'));
const token = level => jwt.sign({ id_user: 7, level }, process.env.JWT_SECRET);
beforeAll(() => { process.env.JWT_SECRET = 'executive-test-only-secret'; });
beforeEach(() => { jest.clearAllMocks(); });

test('anonymous requests are rejected', async () => {
  expect((await request(app).get('/api/executive-dashboard')).status).toBe(401);
  expect(pool.query).not.toHaveBeenCalled();
});
test.each(['User', 'Verifikator'])('%s cannot read executive aggregates', async level => {
  pool.query.mockResolvedValue({rows:[{level,is_active:1}]});
  expect((await request(app).get('/api/executive-dashboard').set('Authorization','Bearer '+token(level))).status).toBe(403);
  expect(loadExecutiveDashboard).not.toHaveBeenCalled();
});
test.each([{level:'Pimpinan',is_active:0},{level:'User',is_active:1},null])('current database permissions override stale JWT claims: %j', async user => {
  pool.query.mockResolvedValue({rows:user ? [user] : []});
  expect((await request(app).get('/api/executive-dashboard').set('Authorization','Bearer '+token('Pimpinan'))).status).toBe(user?.is_active === 1 ? 403 : 401);
});
test.each(['Admin','Pimpinan'])('%s can request validated filters', async level => {
  pool.query.mockResolvedValue({rows:[{level,is_active:1}]});
  loadExecutiveDashboard.mockResolvedValue({summary:{total:3}});
  const res = await request(app).get('/api/executive-dashboard?tahun=2026&instansi=BSSN').set('Authorization','Bearer '+token(level));
  expect(res.status).toBe(200);
  expect(res.headers['cache-control']).toBe('no-store');
  expect(loadExecutiveDashboard).toHaveBeenCalledWith(pool,{tahun:2026,instansi:'BSSN',jenis:null});
});
test.each(['tahun=2026 OR 1=1','tahun=2026.5','tahun=1800','tahun[]=2026','unexpected=1'])('invalid filter %s is rejected before loading data', async query => {
  pool.query.mockResolvedValue({rows:[{level:'Pimpinan',is_active:1}]});
  const res = await request(app).get('/api/executive-dashboard?'+query).set('Authorization','Bearer '+token('Pimpinan'));
  expect(res.status).toBe(400); expect(loadExecutiveDashboard).not.toHaveBeenCalled();
});
test.each([['get','/api/users'],['get','/api/individu'],['put','/api/user/self/usulan'],['get','/api/user/self/usulan/download/file_ktp']])('leader cannot use operational endpoint %s %s', async (method,path) => {
  pool.query.mockResolvedValue({rows:[{level:'Pimpinan',is_active:1}]});
  expect((await request(app)[method](path).set('Authorization','Bearer '+token('Pimpinan'))).status).toBe(403);
});
test('leader cannot change applicant fields through profile API', async () => {
  pool.query.mockResolvedValue({rows:[{level:'Pimpinan',is_active:1}]});
  const res = await request(app).put('/api/user/self/profile').send({instansi:'BSSN'}).set('Authorization','Bearer '+token('Pimpinan'));
  expect(res.status).toBe(403); expect(pool.query).toHaveBeenCalledTimes(1);
});
test.each([['Admin','get','/api/users'],['User','put','/api/user/self/usulan']])('changing %s to Pimpinan revokes operational access for an existing session', async (oldRole,method,path) => {
  pool.query.mockResolvedValue({rows:[{level:'Pimpinan',is_active:1}]});
  const res=await request(app)[method](path).set('Authorization','Bearer '+token(oldRole));
  expect(res.status).toBe(403);
});
test('administrator can create a leader account using the existing schema', () => {
  const {error} = createUserSchema.validate({nama:'Pimpinan Demonstrasi',email:'pimpinan@example.test',username:'pimpinan.demo',password:'DemoAdhira2026',level:'Pimpinan'});
  expect(error).toBeUndefined();
});
