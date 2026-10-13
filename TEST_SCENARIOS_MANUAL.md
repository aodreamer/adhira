# Skenario Test Manual — Adhira e-Arsip Penghargaan

Dokumen ini berisi brief aplikasi dan daftar skenario uji manual (manual QA) untuk sistem Adhira e-Arsip Penghargaan. Gunakan sebagai checklist saat melakukan pengujian.

---

## 1. Brief Aplikasi

Adhira adalah sistem e-arsip untuk pengelolaan **usulan penghargaan Dharma Persandian** (10/20/30 Tahun) dengan 3 peran pengguna:

| Peran | Deskripsi |
|---|---|
| **Admin** | Mengelola user, data individu, dokumen arsip (Pemberitahuan/Laporan/Usulan/Distribusi), kode registrasi Verifikator, dan persetujuan pendaftaran Verifikator. Bisa override semua keputusan verifikasi. |
| **Verifikator** | "Perwakilan Instansi" — meninjau & memverifikasi data individu di instansi cakupannya, serta melakukan impor massal data pengusul. Harus disetujui Admin dulu sebelum bisa mengakses fitur inti. |
| **User** | Individu pengusul penghargaan — mengisi profil, mengunggah berkas usulan (KTP, DRH, SK, dsb.), memantau status verifikasi. |

Entitas utama: **`data_individu`** (rekam data pengusul + berkas + status verifikasi ganda: *Verifikasi Data* dan *Verifikasi Berkas*, masing-masing `Menunggu/Disetujui/Ditolak`).

Fitur baru/berubah yang perlu perhatian ekstra (berdasarkan status git saat ini):
- Gate persetujuan Verifikator (`require-approved-verifikator`)
- Field `nama_instansi` (utk Pemerintah Pusat) & `reg_pemda_*`/`reg_nama_instansi` (saat registrasi Verifikator)
- Komponen tabel baru: pencarian, sort, pagination (`TableSearchBox`, `TablePagination`)
- Komponen `PasswordInput` (show/hide password) di semua form password

---

## 2. Persiapan Sebelum Testing

- [ ] Siapkan minimal 1 akun Admin, dan buat baru: 1 akun Verifikator (via alur register-verifikator) dan 1 akun User (via register biasa) selama testing.
- [ ] Siapkan file uji: PDF valid <2MB, PDF >2MB, file .exe/.txt (harus ditolak), file .xlsx valid untuk template import, file .xlsx >5MB / >500 baris.
- [ ] Cek `.env` backend — jika `SMTP_USER/PASS` kosong, pengiriman email kredensial hasil bulk-import akan gagal/queued secara wajar (bukan bug), UI harus menampilkan fallback (tampilkan username/password manual).
- [ ] Siapkan 3 browser session terpisah (atau mode incognito) untuk menguji 3 peran sekaligus bila perlu.

---

## 3. Skenario Autentikasi & Registrasi

### 3.1 Login
1. Login dengan username/password valid & akun aktif → berhasil, redirect sesuai role (Admin→`/admin`, Verifikator→`/verifikator`, User→`/user`).
2. Login dengan password salah 5x berturut-turut → akun terkunci (HTTP 423), pesan menyebutkan sisa menit lockout (~15 menit). Coba login lagi saat masih terkunci → tetap ditolak meski password benar.
3. Login dengan username tidak terdaftar → pesan error generik (jangan bocorkan "username tidak ada" vs "password salah" secara berbeda — cek apakah pesan seragam, dan waktu respons relatif konsisten).
4. Login 11x dalam 5 menit dari IP yang sama (percobaan gagal maupun benar) → rate limit terpicu (429/limiter).
5. Login dengan akun `is_active = 0` (nonaktifkan dulu via Admin) → ditolak, pesan "Akun tidak aktif".
6. Login dengan akun yang `must_change_password = 1` (hasil bulk import) → berhasil login tapi dipaksa redirect ke halaman Account Settings, dan tidak bisa navigasi ke halaman lain sebelum ganti password. Coba akses URL lain langsung → tetap ter-redirect.
7. Biarkan token JWT kedaluwarsa (default 2 jam, atau ubah `JWT_EXPIRES_IN` sementara ke nilai kecil di `.env` untuk uji cepat) → request API berikutnya harus mengembalikan 401 dan user diarahkan ke halaman login.

### 3.2 Registrasi User (Individu) — `/register`
1. Isi semua field wajib dengan benar, instansi = "BSSN" → submit berhasil, langsung bisa login, dan record `data_individu` awal otomatis dibuat dengan `jenis_penghargaan = "Sedang Diajukan"`.
2. Instansi = "Pemerintah Pusat" tanpa mengisi `nama_instansi` → ditolak (validasi client & server).
3. Instansi = "Pemerintah Daerah", `pemda_tipe = Provinsi` → field kab/kota tidak wajib. `pemda_tipe = Kabupaten` atau `Kota` → field kab/kota wajib diisi, jika kosong harus ditolak.
4. Coba daftar dengan NIP/NRP yang sudah dipakai individu lain → ditolak "NIP/NRP sudah terdaftar dalam sistem".
5. Coba daftar dengan username yang sudah ada → ditolak "Username sudah terdaftar".
6. `password` dan `confirmPassword` tidak sama → ditolak di client sebelum submit, dan pastikan validasi server juga menolak jika client-side dilewati (uji via devtools/API langsung).
7. Isi email dengan domain tidak valid/format salah → ditolak validasi.
8. Isi HP dengan karakter selain digit/+/-/spasi → ditolak.
9. Pilih pangkat dari luar daftar resmi (manipulasi payload API langsung, bukan lewat dropdown) → server harus menolak.
10. Daftar 11x dalam 1 jam dari IP yang sama → rate limit terpicu.
11. Registrasi sukses dengan email yang tidak valid/tidak bisa dihubungi tetap harus berhasil (tidak ada verifikasi email) — konfirmasi ini bukan bug.

### 3.3 Registrasi Verifikator ("Perwakilan Instansi") — `/register-verifikator`
1. Tanpa `kode_pendaftaran` atau dengan kode salah/kadaluarsa → ditolak "Kode pendaftaran tidak valid atau sudah kadaluarsa".
2. Dengan kode valid dan aktif → berhasil, tapi `reg_status = Pending`. Setelah login, harus otomatis diarahkan ke halaman upload Surat Usulan (`/verifikator/registrasi`) dan tidak bisa mengakses fitur lain.
3. Field kondisional instansi (nama_instansi utk Pemerintah Pusat; pemda cascade utk Pemerintah Daerah) — ulangi semua kasus dari 3.2 poin 2–3 di form ini juga (cek konsistensi antar form).
4. Gunakan 1 kode registrasi untuk 2 pendaftaran berbeda → cek apakah kode boleh dipakai berkali-kali (usage_count bertambah) sesuai desain (kode tidak otomatis nonaktif setelah 1x pakai kecuali Admin menonaktifkan manual atau kadaluarsa).
5. Setelah register-verifikator, cek tabel `AdminVerifikatorRegistrationView` di sisi Admin — entri baru harus muncul dengan status Pending.

---

## 4. Skenario Persetujuan Verifikator (Alur Baru — Prioritas Tinggi)

1. **Sebelum disetujui**: Login sebagai Verifikator baru (reg_status=Pending). Coba akses langsung via URL: `/verifikator/antrian`, `/verifikator/import`, dashboard verifikator → harus tetap diarahkan ke halaman registrasi/upload surat usulan.
2. Upload Surat Usulan (PDF) yang valid → status tetap "Pending" menunggu review Admin, tapi file tersimpan (cek preview/download berhasil).
3. Upload file bukan PDF (misal .docx) ke field Surat Usulan → ditolak.
4. Upload PDF > 5MB → ditolak.
5. **Admin approve**: Sebagai Admin, buka `AdminVerifikatorRegistrationView`, preview/download Surat Usulan, klik Setujui (tanpa perlu catatan) → status berubah "Disetujui". Login ulang sebagai Verifikator tsb → sekarang bisa akses `/verifikator/antrian` dan `/verifikator/import`.
6. **Admin reject tanpa catatan**: Coba tolak pendaftaran tanpa mengisi catatan → harus ditolak sistem (400, "Catatan wajib diisi saat menolak").
7. **Admin reject dengan catatan**: Tolak dengan catatan → Verifikator login, halaman registrasi menampilkan status "Ditolak" + catatan, dan tetap terkunci dari fitur inti.
8. **Resubmit setelah ditolak**: Verifikator upload ulang Surat Usulan baru → status otomatis kembali ke "Pending" dan catatan/reviewer lama ter-reset (verifikasi via tampilan Admin: catatan kosong, reviewer kosong).
9. **Verifikator legacy** (dibuat manual oleh Admin lewat ManUserView, `reg_status` NULL): pastikan TIDAK terkena gate ini — bisa langsung akses fitur inti tanpa upload surat usulan, dan tidak muncul di daftar `AdminVerifikatorRegistrationView`.
10. Cek endpoint `/verifikator/registration` sendiri harus tetap bisa diakses meski status Pending/Ditolak (supaya user bisa re-upload).

---

## 5. Skenario Manajemen User (Admin — `ManUserView`)

1. Tambah user baru dengan level Admin/User → berhasil. Cek dropdown "Tambah User" — pastikan **tidak** menawarkan level Verifikator (sesuai temuan; jika ternyata sekarang tersedia, verifikasi field scope wajib diisi).
2. Edit user existing, ubah level menjadi Verifikator → field "instansi_scope" (checkbox) harus muncul dan wajib pilih minimal 1 instansi.
3. Edit user, kosongkan instansi_scope untuk level Verifikator → harus ditolak (jika validasi minimal 1 scope diterapkan) — uji dan catat perilaku aktual.
4. Coba nonaktifkan/hapus/demosikan **Admin terakhir yang aktif** → harus ditolak ("Tidak dapat mengubah/menghapus admin terakhir yang tersisa").
5. Pastikan ada ≥2 admin, lalu ulangi aksi di atas pada salah satu → harus berhasil.
6. Reset password user lain lewat form edit (isi field password baru) → user tsb bisa login dengan password baru.
7. Cari user via search box (nama/username/email) → hasil terfilter benar, termasuk saat query tidak match apa pun (empty state tampil wajar).
8. Sort kolom (nama, level, status, login terakhir) → urutan berubah sesuai, termasuk kolom status yang kemungkinan punya urutan semantik khusus.
9. Ganti page size (10/25/50/100) → tabel reload dan halaman ter-reset ke 1.
10. Hapus user → konfirmasi modal muncul, setelah konfirmasi user hilang dari list dan tidak bisa login lagi.

---

## 6. Skenario Data Individu (Admin — `IndividuView`)

1. Tambah individu baru manual lewat Admin (tanpa akun login/`id_user`) → berhasil tersimpan, muncul di tabel.
2. Isi Riwayat Kepegawaian (TMT CPNS/PNS, masa kerja kumulatif & pengurangan) → cek "masa kerja di persandian" yang otomatis terhitung di preview sudah benar (kumulatif dikurangi pengurangan).
3. Upload seluruh 8 slot dokumen dengan tipe file diizinkan (.pdf/.doc/.docx/.png/.jpg/.jpeg) masing-masing <2MB → semua berhasil, link "Lihat" aktif untuk tiap file.
4. Upload file >2MB atau tipe tidak diizinkan (.zip, .exe) ke salah satu slot → ditolak dengan pesan jelas.
5. Verifikasi Data: klik "Verifikasi" → panel Data Pribadi, klik Setujui → status "Disetujui", `oleh` tercatat sebagai Admin.
6. Verifikasi Berkas: tolak dengan catatan kosong → ditolak sistem (catatan wajib saat reject).
7. Tolak dengan catatan terisi → status "Ditolak" tersimpan beserta catatan.
8. **Reset otomatis saat edit**: Setelah Verifikasi Data berstatus "Disetujui", edit field personal (misal jabatan/unit_kerja/pangkat/instansi) → status Verifikasi Data harus otomatis kembali ke "Menunggu" dan catatan/reviewer lama hilang.
9. **Reset otomatis saat upload ulang berkas**: Setelah Verifikasi Berkas "Disetujui", upload ulang salah satu file → status Verifikasi Berkas kembali ke "Menunggu".
10. Filter tabel by Tahun / Jenis Penghargaan / Instansi (kombinasi) → hasil sesuai, tombol Reset mengembalikan ke semua data.
11. Hapus individu → konfirmasi modal, setelah hapus, file-file terkait juga idealnya terhapus dari storage (cek folder uploads bila punya akses server) dan tidak bisa diakses lagi via URL download lama.
12. Uji preview "cert-line" (baris sertifikat) dengan kombinasi: jabatan/unit_kerja kosong; instansi Pemerintah Pusat tanpa nama_instansi; Pemerintah Daerah dengan pemda_tipe=Provinsi vs Kabupaten/Kota — pastikan format teks masuk akal di semua kombinasi (tidak ada "undefined"/koma ganda/dsb).

---

## 7. Skenario Kunci Verifikasi Admin vs Verifikator (Prioritas Tinggi)

1. Sebagai Verifikator, setujui Verifikasi Data seorang individu di cakupannya → berhasil, `oleh` = Verifikator.
2. Sebagai Admin, ubah keputusan tsb (misal jadi Ditolak) → **harus tetap berhasil** (Admin selalu bisa override).
3. Sebagai Admin, setujui Verifikasi Data individu lain → `oleh` = Admin.
4. Sebagai Verifikator (dengan individu tsb di cakupannya), coba ubah keputusan yang sudah dikunci Admin → **harus ditolak (403)** dengan pesan "Keputusan sudah dikunci oleh Admin".
5. Ulangi skenario 1–4 untuk Verifikasi Berkas secara terpisah (independen dari Verifikasi Data).
6. Verifikator mencoba verifikasi individu **di luar cakupan instansinya** (akses langsung via URL/ID) → ditolak "Data tidak ditemukan atau di luar cakupan Anda".

---

## 8. Skenario User — Profil & Upload Berkas Usulan (`UserUsulan`, `AccountSettings`)

1. Login sebagai User baru dengan profil belum lengkap (email/hp/instansi/jabatan/unit_kerja/pangkat ada yang kosong) → halaman Usulan menampilkan blok kuning "Profil Anda Belum Lengkap" dengan daftar field yang kurang, form upload **tidak ditampilkan sama sekali**.
2. Lengkapi profil via Account Settings → kembali ke halaman Usulan, form upload berkas kini muncul.
3. Untuk instansi Pemerintah Daerah, lengkapi jabatan/unit_kerja/pangkat tapi biarkan pemda_tipe/provinsi kosong → tetap dianggap belum lengkap (field pemda ikut disyaratkan).
4. **Bypass client-side**: dengan profil sengaja belum lengkap, coba panggil API upload berkas langsung (Postman/devtools) → server harus tetap menolak dengan 403 (jangan hanya mengandalkan blokir UI).
5. Instansi non-ASN (Polri/TNI AD/AU/AL/BAIS TNI) → kartu dokumen "SK CPNS/PNS" **tidak** ditampilkan/diwajibkan. Instansi lain (BSSN, Pemerintah Pusat/Daerah, Kejaksaan Agung) → kartu tsb wajib muncul.
6. Upload salah satu berkas wajib → status kartu berubah "terunggah", dan Verifikasi Berkas berubah/ter-reset ke "Menunggu" (jika sebelumnya sudah ada status lain).
7. Upload berkas opsional (Piagam Penghargaan) → tersimpan meski tidak wajib untuk melengkapi status "semua wajib terunggah".
8. Upload file melebihi 2MB atau tipe tidak diizinkan → ditolak dengan pesan jelas di form.
9. Lihat banner status: jika Verifikasi Data/Berkas berstatus "Ditolak", banner penolakan tampil dengan catatan dan link ke tempat perbaikan (profil / upload ulang).
10. Ganti password (Account Settings) dengan `newPassword` sama dengan `currentPassword` → ditolak (harus berbeda).
11. Ganti password dengan confirmPassword tidak cocok → ditolak.
12. User dengan `must_change_password=1` (hasil bulk import) ganti password sukses → flag hilang, bisa navigasi bebas setelahnya.

---

## 9. Skenario Impor Massal (Verifikator — `VerifikatorImportView`)

1. Download template `.xlsx` → cek 2 sheet ("Usulan" + "Referensi Pangkat"), kolom wajib bertanda `*`.
2. Upload file bukan `.xlsx` (misal `.csv`, `.xls`) → ditolak.
3. Upload `.xlsx` > 5MB → ditolak.
4. Upload dengan baris > 500 → ditolak/terpotong sesuai pesan error (verifikasi pesan yang muncul).
5. Upload template dengan urutan kolom diacak / ada baris instruksi tambahan → parser tetap toleran (berbasis label header, bukan posisi kolom) — cek hasil parse tetap benar.
6. Baris dengan pangkat tidak valid (di luar daftar resmi) → ditandai "Error" dengan field='pangkat'.
7. Baris dengan email format salah → "Error" field='email'.
8. Baris instansi "Pemerintah Daerah" tanpa pemda_tipe/provinsi → "Error".
9. Baris dengan pemda_tipe/provinsi/kabkota yang **saling tidak konsisten** (misal kabkota tidak sesuai provinsi) → cek apakah tervalidasi silang dengan benar (area ini belum ada test otomatis — uji manual teliti).
10. Baris dengan NIP yang sudah ada di `data_individu` → ditandai "DuplicateUpdate".
11. Pilih instansi saat upload yang **di luar cakupan Verifikator** → ditolak 403.
12. Di tahap preview, edit inline salah satu baris (perbaiki data Error) → baris tervalidasi ulang, status berubah jadi "Valid" jika sudah benar.
13. Edit baris duplicate → cek re-flag duplicate tetap konsisten.
14. Klik Confirm/Simpan:
    - Baris baru → akun `mst_user` baru dibuat (level=User, must_change_password=1, password random, username auto dari NIP; jika NIP duplikat antar baris → username dapat suffix `-2`, `-3`).
    - Baris DuplicateUpdate dengan `id_user` ada → hanya `data_individu` diperbarui, password/akun **tidak** disentuh.
    - Baris berstatus "Error" saat konfirmasi → otomatis di-skip, tidak menggagalkan baris lain.
15. Simulasikan 1 baris gagal saat commit (misal email sama dengan baris lain yang berbeda NIP) → baris itu jadi "Failed", baris lain tetap sukses tersimpan (isolasi per-baris via SAVEPOINT).
16. Jika SMTP belum dikonfigurasi (`.env` kosong) → hasil akhir menunjukkan `email_status: Failed/Queued` per baris, dan UI menampilkan banner "Email otomatis belum aktif" + kredensial ditampilkan manual di tabel hasil untuk didistribusikan Verifikator sendiri.
17. Batalkan batch (masih status Preview) via tombol delete/discard → batch hilang, tidak ada data tersimpan ke `data_individu`.
18. Coba edit baris pada batch yang **sudah dikonfirmasi** (bukan Preview) → harus ditolak (hanya bisa edit saat status Preview).

---

## 10. Skenario Antrian Verifikasi (Verifikator — `VerifikatorQueueView` & `VerifikatorDetailView`)

1. Login sebagai Verifikator dengan cakupan 1 instansi → antrian hanya menampilkan individu dari instansi tsb.
2. Verifikator dengan cakupan multi-instansi → dropdown filter Instansi hanya berisi instansi dalam scope-nya, bukan semua instansi sistem.
3. Filter Status Data / Status Berkas (Menunggu/Disetujui/Ditolak) → hasil sesuai kombinasi filter.
4. Klik "Periksa" pada satu baris → detail terbuka, tampilkan data pribadi + grid dokumen dengan counter kelengkapan.
5. Approve/reject dari halaman detail → status ter-update dan kembali konsisten dengan tampilan di antrian.
6. Akses detail individu di luar cakupan via manipulasi URL (ganti ID) → "Data tidak ditemukan atau di luar cakupan Anda".

---

## 11. Skenario Dokumen Generik (Admin — Pemberitahuan / Laporan / Usulan / Distribusi)

Keempat halaman ini memakai pola yang sama; uji pola berikut di **masing-masing** dari 4 halaman:

1. Tambah entri baru dengan file wajib → berhasil, muncul di tabel.
2. Edit entri, ganti file lama dengan file baru → file baru menggantikan (idealnya file lama dibersihkan dari storage).
3. Filter by Tahun / Jenis (/ Instansi khusus Usulan & Distribusi) → hasil sesuai, Reset mengembalikan semua data.
4. Hapus entri → konfirmasi modal, entri hilang, file tidak lagi bisa diakses via URL lama.
5. Coba kirim field yang tidak ada di whitelist backend (via API langsung, misal field asing/SQL-like payload di `nama_usulan`) → pastikan tidak menyebabkan error server atau tersimpan field liar (uji whitelist kolom).
6. Cari via search box lalu ubah page size / sort kolom → hasil dan pagination konsisten, tidak error di edge case (0 hasil, 1 hasil, hasil > 1 halaman).
7. Perhatikan konsep "Usulan" di halaman Admin ini **berbeda** dengan "Usulan Massal" (import Verifikator) dan "Usulan" milik User (`UserUsulan`) — pastikan tidak ada kebingungan navigasi/istilah saat demo ke stakeholder.

---

## 12. Skenario Kode Registrasi Verifikator (Admin — `AdminVerifikatorCodeView`)

1. Generate kode baru dengan tanggal kadaluarsa di masa lalu → ditolak (harus tanggal masa depan).
2. Generate kode dengan tanggal kadaluarsa valid → kode 10-karakter ter-generate, status "Aktif".
3. Nonaktifkan kode aktif (toggle) → status jadi "Nonaktif", dan kode tsb tidak bisa lagi dipakai untuk register-verifikator baru.
4. Aktifkan kembali kode yang dinonaktifkan (dan belum kadaluarsa) → berhasil, bisa dipakai lagi.
5. Biarkan kode kadaluarsa (tunggu tanggalnya lewat atau set tanggal dekat untuk uji cepat) → status otomatis "Kadaluarsa", tombol toggle aktif/nonaktif hilang/disabled, dan kode tidak bisa dipakai lagi walau `is_active=1`.
6. Cek kolom "Dipakai" (usage_count) bertambah setiap kali kode berhasil dipakai untuk registrasi Verifikator baru.

---

## 13. Skenario Lintas Peran & Keamanan Akses (RBAC)

1. Login sebagai User, coba akses endpoint Admin-only langsung via API (misal `GET /users`) → 403 "Akses ditolak".
2. Login sebagai Verifikator, coba akses endpoint `/individu` (Admin-only) → 403.
3. Tanpa token / token invalid, akses endpoint mana pun yang butuh auth → 401 "Tidak terautentikasi".
4. Login sebagai User, coba akses route frontend Admin/Verifikator via URL langsung → di-redirect (bukan hanya disembunyikan dari menu).
5. Coba manipulasi payload registrasi untuk memaksa `level=Admin` (API langsung) saat register biasa → harus tetap dipaksa `level=User` oleh server, diabaikan.
6. Coba download file individu lain (ganti fileColumn/ID di URL download) lintas peran/cakupan → ditolak sesuai kepemilikan/cakupan (User hanya file miliknya sendiri; Verifikator hanya dalam cakupan; Admin bebas).

---

## 14. Skenario Dashboard Admin

1. Buka Dashboard → 4 stat card user (Bulan Ini/Total/Aktif/Tidak Aktif) sesuai data aktual.
2. Grafik "Penghargaan per Tahun" (bar) dan "Berdasarkan Jenis Penghargaan" (pie) serta "10 Instansi Terbanyak" (bar) menampilkan data valid, tidak error saat data kosong (misal instalasi baru tanpa data).
3. Tabel "Individu Terbaru" (10 terbaru) — cari & paginate, cek konsistensi dengan data individu terbaru sebenarnya.

---

## 15. Skenario Non-Fungsional / Edge Case Umum

1. **Path traversal / nama file berbahaya**: upload file dengan nama seperti `../../etc/passwd.pdf` atau mengandung karakter aneh → nama file harus disanitasi, tidak menimpa file sistem.
2. **XSS**: isi field teks (nama, jabatan, catatan verifikasi, keterangan kode) dengan `<script>alert(1)</script>` → harus di-escape saat ditampilkan, bukan dieksekusi.
3. **SQL Injection**: isi field pencarian/filter dengan payload SQL (`' OR '1'='1`) → tidak menyebabkan error atau kebocoran data.
4. **Responsif**: uji halaman-halaman utama (Dashboard, IndividuView, UserUsulan, VerifikatorImportView) di lebar layar sempit (mobile) — tabel dan modal tetap bisa digunakan (scroll horizontal, dsb).
5. **Refresh saat mengisi form panjang** (misal form Individu dengan banyak file) → cek tidak ada data hilang tanpa peringatan, atau minimal tidak crash.
6. **Konsistensi pesan error** — semua pesan validasi berbahasa Indonesia dan jelas dipahami pengguna non-teknis (Verifikator/User bukan staf IT).
7. **Kompatibilitas browser** — uji minimal di 2 browser berbeda (Chrome & Firefox/Edge) untuk fitur upload file dan grafik dashboard.

---

## 16. Template Pelaporan Bug

Gunakan format berikut saat menemukan isu selama testing:

```
ID: BUG-XXX
Area: (mis. Registrasi Verifikator)
Langkah reproduksi:
1. ...
2. ...
Hasil aktual:
Hasil diharapkan:
Role/akun yang digunakan:
Severity: (Blocker/Major/Minor/Cosmetic)
Screenshot/lampiran:
```
