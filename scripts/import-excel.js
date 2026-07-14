const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const pool = new Pool({
  host: 'localhost', port: 5432, database: 'adhira',
  user: 'euser', password: 'epass',
});

function norm(s) {
  if (!s) return '';
  return String(s).trim().replace(/\s+/g, ' ').replace(/['’]/g, "'");
}

function splitJabInst(s) {
  if (!s) return ['', ''];
  s = norm(s);
  const m = s.match(/\s+(?:pada|di)\s+/i);
  if (m) return [norm(s.slice(0, m.index)), norm(s.slice(m.index + m[0].length))];
  const lastComma = s.lastIndexOf(',');
  if (lastComma > 0 && s.slice(lastComma + 1).trim().length > 10) {
    return [norm(s.slice(0, lastComma)), norm(s.slice(lastComma + 1))];
  }
  return [s, ''];
}

async function run() {
  const wb = XLSX.readFile(path.join(ROOT, 'data', 'Database Fix.xlsx'));
  const all = {};
  for (const sn of ['Kepka', 'PETIKAN', 'Sheet2']) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1 });
    console.log('Sheet', sn + ':', rows.length - 1, 'rows');
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[2]) continue;
      const nip = norm(r[2]), nama = norm(r[1]);
      if (!nama || nip === 'NIP/NRP') continue;
      if (!all[nip]) {
        const [jabatan, instansi] = splitJabInst(r[4]);
        all[nip] = { nama, nipnrp: nip, pangkat: norm(r[3] || ''), jabatan, instansi, jenis_penghargaan: norm(r[5] || '') };
      }
    }
  }
  const rows = Object.values(all);
  console.log('\nUnique NIP:', rows.length);
  rows.slice(0, 3).forEach((r, i) => {
    console.log((i + 1) + '. ' + r.nama);
    console.log('   Jabatan: ' + r.jabatan);
    console.log('   Instansi: ' + r.instansi);
  });

  const cl = await pool.connect();
  let ok = 0;
  try {
    await cl.query('BEGIN');
    for (const r of rows) {
      await cl.query(
        'INSERT INTO data_individu (nama, nipnrp, pangkat, jabatan, instansi, jenis_penghargaan, tgl_upload) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE)',
        [r.nama, r.nipnrp, r.pangkat, r.jabatan, r.instansi, r.jenis_penghargaan]
      );
      ok++;
      if (ok % 100 === 0) console.log('  Inserted', ok + '/' + rows.length + '...');
    }
    await cl.query('COMMIT');
    const { rows: cnt } = await cl.query('SELECT COUNT(*) as c FROM data_individu');
    console.log('\nDone! DB now has', cnt[0].c, 'rows in data_individu');
  } catch (e) {
    await cl.query('ROLLBACK');
    console.error('Transaction failed:', e.message);
  } finally { cl.release(); await pool.end(); }

  // Copy PDFs
  const pdfSrc = path.join(ROOT, 'data', 'Salinan Final');
  const pdfDest = path.join(ROOT, 'uploads', 'kepka');
  if (fs.existsSync(pdfSrc)) {
    fs.mkdirSync(pdfDest, { recursive: true });
    const files = fs.readdirSync(pdfSrc).filter(f => f.endsWith('.pdf'));
    let c = 0;
    for (const f of files) {
      const d = path.join(pdfDest, f);
      if (!fs.existsSync(d)) { fs.copyFileSync(path.join(pdfSrc, f), d); c++; }
    }
    console.log('Copied', c, 'PDF files');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
