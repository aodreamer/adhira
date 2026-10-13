const { registerSchema, registerVerifikatorSchema } = require('../src/validators/auth.validator');

function validate(schema, payload) {
  return schema.validate(payload, { abortEarly: false });
}

const basePayload = {
  nama: 'Reza Aulia',
  email: 'reza04280@gmail.com',
  hp: '081234567890',
  username: 'reza.aulia',
  password: 'Password123',
  confirmPassword: 'Password123',
  nipnrp: '198501012010011001',
  jabatan: 'Analis Persandian',
  unit_kerja: 'Direktorat Keamanan Siber',
  pangkat: 'Penata Muda (III/a)',
};

describe('registerSchema — instansi Pemerintah Pusat', () => {
  test('requires nama_instansi', () => {
    const { error } = validate(registerSchema, { ...basePayload, instansi: 'Pemerintah Pusat' });
    expect(error).toBeTruthy();
    expect(error.details.some((d) => d.path[0] === 'nama_instansi')).toBe(true);
  });

  test('passes when nama_instansi is provided', () => {
    const { error } = validate(registerSchema, {
      ...basePayload, instansi: 'Pemerintah Pusat', nama_instansi: 'Kementerian Komunikasi dan Digital',
    });
    expect(error).toBeUndefined();
  });
});

describe('registerSchema — instansi Pemerintah Daerah', () => {
  test('requires pemda_tipe and pemda_provinsi', () => {
    const { error } = validate(registerSchema, { ...basePayload, instansi: 'Pemerintah Daerah' });
    expect(error).toBeTruthy();
    const fields = error.details.map((d) => d.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['pemda_tipe', 'pemda_provinsi']));
  });

  test('requires pemda_kabkota only for Kabupaten/Kota, not Provinsi', () => {
    const provinsiResult = validate(registerSchema, {
      ...basePayload, instansi: 'Pemerintah Daerah', pemda_tipe: 'Pemerintah Provinsi', pemda_provinsi: 'DKI JAKARTA',
    });
    expect(provinsiResult.error).toBeUndefined();

    const kabupatenResult = validate(registerSchema, {
      ...basePayload, instansi: 'Pemerintah Daerah', pemda_tipe: 'Pemerintah Kabupaten', pemda_provinsi: 'DKI JAKARTA',
    });
    expect(kabupatenResult.error).toBeTruthy();
    expect(kabupatenResult.error.details.some((d) => d.path[0] === 'pemda_kabkota')).toBe(true);
  });
});

describe('registerSchema — other instansi', () => {
  test('does not require nama_instansi or pemda fields for BSSN', () => {
    const { error } = validate(registerSchema, { ...basePayload, instansi: 'BSSN' });
    expect(error).toBeUndefined();
  });
});

describe('registerVerifikatorSchema — same conditional rules', () => {
  const verifikatorBase = { ...basePayload, kode_pendaftaran: 'KODE-2026-001' };

  test('requires nama_instansi for Pemerintah Pusat', () => {
    const { error } = validate(registerVerifikatorSchema, { ...verifikatorBase, instansi: 'Pemerintah Pusat' });
    expect(error).toBeTruthy();
    expect(error.details.some((d) => d.path[0] === 'nama_instansi')).toBe(true);
  });

  test('requires pemda_tipe/pemda_provinsi for Pemerintah Daerah', () => {
    const { error } = validate(registerVerifikatorSchema, { ...verifikatorBase, instansi: 'Pemerintah Daerah' });
    expect(error).toBeTruthy();
    const fields = error.details.map((d) => d.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['pemda_tipe', 'pemda_provinsi']));
  });

  test('passes for BSSN with no extra fields', () => {
    const { error } = validate(registerVerifikatorSchema, { ...verifikatorBase, instansi: 'BSSN' });
    expect(error).toBeUndefined();
  });
});
