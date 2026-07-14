// Generates realistic-looking dummy data for Adhira and writes it as a
// single SQL script (scripts/dummy-data.sql) that truncates the data tables
// and re-seeds them. Run with: node scripts/generate-dummy-data.js
//
// This never touches the database directly — review the generated SQL, then
// apply it yourself (see README note printed at the end).
const fs = require('fs');
const path = require('path');
const bcrypt = require(path.join(__dirname, '..', 'backend', 'node_modules', 'bcryptjs'));

const ROWS_PER_TABLE = 100;
const DUMMY_LOGIN_COUNT = 20;
const DUMMY_PASSWORD = 'Dummy1234';

const FIRST_NAMES = [
  'Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gunawan', 'Hendra', 'Indah', 'Joko',
  'Kartika', 'Lestari', 'Muhammad', 'Nur', 'Oktavia', 'Putra', 'Ratna', 'Sri', 'Taufik', 'Umar',
  'Vina', 'Wahyu', 'Yanti', 'Zainal', 'Agus', 'Bambang', 'Chandra', 'Dian', 'Eka', 'Faisal',
  'Gita', 'Hari', 'Irfan', 'Julia', 'Kurnia', 'Lina', 'Maya', 'Nanda', 'Oscar', 'Prita',
];
const LAST_NAMES = [
  'Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Setiawan', 'Hidayat', 'Rahman', 'Susanto', 'Wibowo', 'Saputra',
  'Handayani', 'Puspita', 'Firmansyah', 'Gunadi', 'Hakim', 'Iskandar', 'Junaedi', 'Kurniawan', 'Lubis', 'Mahendra',
  'Nugroho', 'Octavianus', 'Prasetyo', 'Ramadhan', 'Siregar', 'Tanjung', 'Utomo', 'Wardani', 'Yulianto', 'Zulkarnain',
];

const INSTANSI = [
  'BSSN', 'KEMENLU', 'BKN', 'BPOM', 'KEMDAGRI', 'LKPP', 'KEJAGUNG',
  'KEJATI LAMPUNG', 'KEJATI KALSEL', 'KEJATI SULTRA', 'KEJATI SUMSEL', 'KEJATI BANTEN',
  'DPP', 'PEMPROV JATIM', 'PEMPROV DKI JAKARTA', 'PEMPROV BANTEN',
  'PEMKAB GUNUNG KIDUL', 'PEMKAB MUARO JAMBI', 'PEMKAB SAROLANGUN', 'PEMKAB SUKABUMI', 'PEMKAB TRENGGALEK',
  'BAIS TNI', 'TNI AD', 'TNI AU', 'TNI AL', 'POLRI',
];

const JABATAN = [
  'Sandiman Ahli Madya', 'Sandiman Ahli Muda', 'Analis Persandian', 'Kepala Sub Bagian Persandian',
  'Kepala Bidang Keamanan Informasi', 'Staf Persandian', 'Kepala Seksi Sandi dan Telekomunikasi',
  'Pranata Persandian', 'Pengawas Sandi Negara', 'Kepala Bagian Tata Usaha', 'Fungsional Sandiman',
  'Kepala Dinas Komunikasi dan Informatika', 'Kepala Sub Bidang Operasional Sandi', 'Analis Kebijakan',
  'Kepala Biro Umum',
];

const PANGKAT_PNS = [
  'Penata Muda (III/a)', 'Penata Muda Tk.I (III/b)', 'Penata (III/c)', 'Penata Tk.I (III/d)',
  'Pembina (IV/a)', 'Pembina Tk.I (IV/b)', 'Pembina Utama Muda (IV/c)',
];
const PANGKAT_TNI = ['Kolonel', 'Letnan Kolonel', 'Mayor', 'Kapten', 'Lettu', 'Letda'];
const PANGKAT_POLRI = ['Komisaris Besar Polisi', 'AKBP', 'Kompol', 'AKP', 'Iptu', 'Ipda', 'Aiptu', 'Aipda', 'Bripka'];

function pangkatFor(instansi) {
  if (['TNI AD', 'TNI AU', 'TNI AL', 'BAIS TNI'].includes(instansi)) return pick(PANGKAT_TNI);
  if (instansi === 'POLRI') return pick(PANGKAT_POLRI);
  return pick(PANGKAT_PNS);
}

const JENIS_PENGHARGAAN = [
  'Dharma Persandian X Tahun', 'Dharma Persandian X Tahun', 'Dharma Persandian X Tahun',
  'Dharma Persandian XX Tahun', 'Dharma Persandian XX Tahun',
  'Dharma Persandian XXX Tahun',
  'Adibhakti Persandian',
  'Tokoh Persandian',
  'Sedang Diajukan',
];

const JENIS_PEMBERITAHUAN = [
  'Pemberitahuan Awal', 'Pemberitahuan Lanjutan', 'Undangan Verifikasi',
  'Konfirmasi Data Calon Penerima', 'Pemberitahuan Perubahan Jadwal',
];
const JENIS_LAPORAN = [
  'Laporan Triwulanan', 'Laporan Semesteran', 'Laporan Tahunan',
  'Laporan Evaluasi Kegiatan', 'Laporan Monitoring Penghargaan',
];
const JENIS_USULAN = [
  'Dharma Persandian X Tahun', 'Dharma Persandian XX Tahun', 'Dharma Persandian XXX Tahun',
  'Adibhakti Persandian', 'Tokoh Persandian',
];
const JENIS_DISTRIBUSI = [
  'Distribusi Piagam', 'Distribusi Piagam dan Lencana', 'Distribusi Ulang', 'Serah Terima Piagam',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function esc(s) {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function randomDate(startYear, endYear) {
  const year = randInt(startYear, endYear);
  const month = String(randInt(1, 12)).padStart(2, '0');
  const day = String(randInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function uniqueName(used) {
  let name;
  do {
    name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  } while (used.has(name));
  used.add(name);
  return name;
}

function buildIndividu() {
  const used = new Set();
  const rows = [];
  for (let i = 0; i < ROWS_PER_TABLE; i++) {
    const nama = uniqueName(used);
    const instansi = pick(INSTANSI);
    const isMiliter = ['TNI AD', 'TNI AU', 'TNI AL', 'BAIS TNI', 'POLRI'].includes(instansi);
    const nipnrp = isMiliter
      ? String(randInt(10000000, 99999999))
      : String(randInt(196000000000000000, 199999999999999999)).slice(0, 18);
    rows.push({
      nama, instansi, nipnrp,
      jabatan: pick(JABATAN),
      pangkat: pangkatFor(instansi),
      jenis_penghargaan: pick(JENIS_PENGHARGAAN),
      tgl_penghargaan: randomDate(2018, 2025),
      tgl_upload: randomDate(2018, 2025),
    });
  }
  return rows;
}

function buildDocRows(nameField, jenisField, tahunField, instansiField, count, namePrefix, jenisPool) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const jenis = pick(jenisPool);
    const tahun = randInt(2018, 2025);
    const instansi = instansiField ? pick(INSTANSI) : null;
    const namaVal = instansi
      ? `${namePrefix} ${jenis} - ${instansi} ${tahun}`
      : `${namePrefix} ${jenis} Tahun ${tahun}`;
    rows.push({ [nameField]: namaVal, [jenisField]: jenis, [tahunField]: tahun, ...(instansiField ? { [instansiField]: instansi } : {}) });
  }
  return rows;
}

function sqlInsert(table, columns, rows) {
  if (rows.length === 0) return '';
  const values = rows.map((r) => '(' + columns.map((c) => {
    const v = r[c];
    if (v === undefined || v === null) return 'NULL';
    if (typeof v === 'number') return v;
    return esc(v);
  }).join(', ') + ')').join(',\n  ');
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n  ${values};\n`;
}

async function main() {
  const individu = buildIndividu();
  const pemberitahuan = buildDocRows('nama_pemberitahuan', 'jenis_pemberitahuan', 'tahun_pemberitahuan', null, ROWS_PER_TABLE, 'Surat Pemberitahuan', JENIS_PEMBERITAHUAN);
  const laporan = buildDocRows('nama_laporan', 'jenis_laporan', 'tahun_laporan', null, ROWS_PER_TABLE, 'Laporan Kegiatan', JENIS_LAPORAN);
  const usulan = buildDocRows('nama_usulan', 'jenis_usulan', 'tahun_usulan', 'instansi_usulan', ROWS_PER_TABLE, 'Usulan Penghargaan', JENIS_USULAN);
  const distribusi = buildDocRows('nama_distribusi', 'jenis_distribusi', 'tahun_distribusi', 'instansi_distribusi', ROWS_PER_TABLE, 'Kegiatan', JENIS_DISTRIBUSI);

  // A subset of individu rows get a matching login account, mirroring the
  // real registration flow where mst_user.nama joins to data_individu.nama.
  const loginCandidates = individu.slice(0, DUMMY_LOGIN_COUNT);
  const passwordHash = bcrypt.hashSync(DUMMY_PASSWORD, 10);
  const usedUsernames = new Set(['admin']);
  const users = loginCandidates.map((ind, i) => {
    let username = ind.nama.toLowerCase().replace(/[^a-z]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
    if (usedUsernames.has(username)) username = `${username}${i}`;
    usedUsernames.add(username);
    return {
      nama: ind.nama,
      email: `${username}@dummy.local`,
      hp: `08${randInt(1000000000, 9999999999)}`.slice(0, 12),
      username,
      password: passwordHash,
      level: 'User',
      is_active: Math.random() < 0.1 ? 0 : 1,
      date_created: randomDate(2022, 2025),
      last_login_at: Math.random() < 0.6 ? `${randomDate(2025, 2025)} 09:00:00+00` : null,
    };
  });

  const parts = [];
  parts.push('-- Generated dummy data for Adhira. Wraps in a transaction; safe to re-run.');
  parts.push('BEGIN;');
  parts.push('');
  parts.push('-- Wipe existing document/individu data and any non-admin users.');
  parts.push("DELETE FROM mst_user WHERE username <> 'admin';");
  parts.push('TRUNCATE TABLE data_individu, tb_surat_pemberitahuan, tb_laporan_kegiatan, tb_usulan, tb_distribusi RESTART IDENTITY;');
  parts.push('');

  parts.push('-- data_individu');
  parts.push(sqlInsert(
    'data_individu',
    ['nama', 'instansi', 'nipnrp', 'jabatan', 'pangkat', 'jenis_penghargaan', 'tgl_penghargaan', 'tgl_upload'],
    individu
  ));

  parts.push('-- tb_surat_pemberitahuan');
  parts.push(sqlInsert('tb_surat_pemberitahuan', ['nama_pemberitahuan', 'jenis_pemberitahuan', 'tahun_pemberitahuan'], pemberitahuan));

  parts.push('-- tb_laporan_kegiatan');
  parts.push(sqlInsert('tb_laporan_kegiatan', ['nama_laporan', 'jenis_laporan', 'tahun_laporan'], laporan));

  parts.push('-- tb_usulan');
  parts.push(sqlInsert('tb_usulan', ['nama_usulan', 'jenis_usulan', 'tahun_usulan', 'instansi_usulan'], usulan));

  parts.push('-- tb_distribusi');
  parts.push(sqlInsert('tb_distribusi', ['nama_distribusi', 'jenis_distribusi', 'tahun_distribusi', 'instansi_distribusi'], distribusi));

  parts.push(`-- dummy login users (password for all: ${DUMMY_PASSWORD})`);
  parts.push(sqlInsert('mst_user', ['nama', 'email', 'hp', 'username', 'password', 'level', 'is_active', 'date_created', 'last_login_at'], users));

  parts.push('COMMIT;');

  const outPath = path.join(__dirname, 'dummy-data.sql');
  fs.writeFileSync(outPath, parts.join('\n'));
  console.log(`Written ${outPath}`);
  console.log(`Individu: ${individu.length}, users: ${users.length} (password: ${DUMMY_PASSWORD})`);
  console.log('Apply with: docker exec -i adhira_db psql -U euser -d adhira < scripts/dummy-data.sql');
}

main();
