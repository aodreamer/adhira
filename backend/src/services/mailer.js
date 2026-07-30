// SMTP is not configured yet — this module must still let the bulk-import
// feature work end to end. With no SMTP_HOST, sendCredentialsEmail no-ops
// (logs, returns 'queued') instead of throwing, so batches can always be
// confirmed; once SMTP env vars are set, real sending starts automatically
// with no other code changes.
let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

async function sendCredentialsEmail({ to, nama, username, password, instansi }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] SMTP belum dikonfigurasi — kredensial untuk ${to} (username: ${username}) tidak dikirim otomatis, harus disampaikan manual oleh Dewan Penghargaan.`);
    return { status: 'queued' };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'Adhira <no-reply@adhira.local>',
      to,
      subject: 'Kredensial Akun Usulan Dharma Persandian - Adhira',
      html: `<p>Yth. ${nama},</p>
        <p>Anda diusulkan sebagai calon penerima Dharma Persandian oleh ${instansi}. Berikut kredensial akun Anda di sistem Adhira untuk melengkapi data dan mengunggah berkas:</p>
        <p>Username: <b>${username}</b><br/>Password sementara: <b>${password}</b></p>
        <p>Anda akan diminta mengganti password saat login pertama kali.</p>`,
    });
    return { status: 'sent' };
  } catch (err) {
    console.error('[mailer] Gagal mengirim email:', err.message);
    return { status: 'failed', detail: err.message };
  }
}

module.exports = { sendCredentialsEmail };
