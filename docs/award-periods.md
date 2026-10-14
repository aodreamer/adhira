# Periode penghargaan

Administrator mengelola periode melalui `/admin/periods`. Pimpinan membaca ringkasan dan tahapan melalui `/pimpinan/periods`. Akses API `/api/periods` memeriksa role dan status aktif akun pada setiap request. Daftar nama pengusul serta pengaitan dokumen hanya tersedia untuk Administrator.

Setiap periode memiliki nama unik, tahun penyelenggaraan, tanggal mulai dan selesai, catatan, serta status Persiapan, Aktif, atau Selesai. Beberapa periode dalam satu tahun diperbolehkan. Tahun penyelenggaraan dipisahkan dari tahun pencatatan pengusul dan kategori Dharma Persandian 10/20/30 Tahun.

## Tahapan dan progres

1. Pemberitahuan.
2. Pengusulan.
3. Verifikasi data.
4. Verifikasi berkas.
5. Perbaikan dan verifikasi ulang (opsional).
6. Penetapan penghargaan.
7. Distribusi dan serah terima.
8. Pelaporan dan evaluasi.

Setiap tahap memiliki jadwal, status, dan catatan hasil. Status terdiri dari Belum dimulai, Berjalan, dan Selesai. Tahap opsional juga dapat berstatus Tidak diperlukan. Jadwal tahap harus berada dalam rentang periode; tanggal selesai tidak boleh mendahului tanggal mulai. Menyelesaikan tahap memerlukan catatan hasil pelaksanaan. Jadwal yang telah terlewati ditandai berdasarkan `CURRENT_DATE` database.

Progres pelaksanaan = jumlah tahap Selesai / jumlah tahap yang diperlukan × 100%, dibulatkan ke bilangan bulat. Tahap Tidak diperlukan dikecualikan dari pembilang dan penyebut. Default periode baru: tujuh tahap wajib belum dimulai dan tahap perbaikan tidak diperlukan, sehingga progres awal 0/7 atau 0%. Mengaktifkan perbaikan menambah jumlah tahap yang diperlukan menjadi delapan.

Progres tersebut merupakan konfirmasi pelaksanaan oleh Administrator. Status tahap tidak otomatis mengikuti jumlah file, tanggal, atau keputusan verifikasi. Jumlah pengusul, data dan berkas disetujui, lolos kedua verifikasi, perbaikan, serta metadata SK ditampilkan terpisah berdasarkan record terkait saat ini. Lolos verifikasi dan keberadaan metadata SK bukan bukti bahwa penghargaan atau penyerahan telah ditetapkan.

## Pengaitan data

Pada detail periode, pilih Kelola data untuk Pengusul, Surat pemberitahuan, Surat usulan, Distribusi/serah terima, atau Laporan kegiatan. Tab Belum memiliki periode menampilkan record yang dapat dipilih. Daftar mendukung pencarian dan pagination 25 record. Pengaitan dan pelepasan diproses dalam transaksi; seluruh ID harus tersedia dan konsisten. Record yang sudah terkait periode lain tidak dipindahkan secara diam-diam.

Satu record pengusulan atau arsip terkait dengan satu periode melalui `periode_id`. Data lama tetap NULL sampai Administrator mengaitkannya secara eksplisit. Penambahan pengusul dari registrasi atau import tidak mengasumsikan periode berdasarkan tanggal. Tahapan dan jadwal periode tidak membatasi fitur upload atau menggantikan keputusan verifikasi pada modul operasional.

Periode Selesai hanya dapat ditutup bila seluruh tahap yang diperlukan selesai. Pengaturan tahap dan pengaitan dikunci hingga Administrator membuka kembali periode melalui pengaturan status. Penguncian ini berlaku pada pengelolaan periode; angka verifikasi tetap membaca kondisi record operasional saat ini, bukan snapshot arsip historis. Hanya periode Persiapan tanpa record terkait yang dapat dihapus.

Setiap perubahan membutuhkan `revision` terbaru. Perubahan serentak dikendalikan dengan row lock dan pemeriksaan revision, sehingga penyimpanan dari tampilan lama mendapat respons 409. Waktu, pelaku perubahan terakhir tahap, serta waktu penyelesaian tersimpan.

## Dashboard pimpinan

Bagian atas Executive Dashboard selalu menampilkan kartu progres periode. Tanpa filter periode, maksimal tiga periode ditampilkan dengan prioritas Aktif, Persiapan, lalu Selesai; dalam status yang sama, tanggal mulai terbaru didahulukan. Kartu berisi rentang tanggal, status, progress bar, status delapan tahap, tahap berjalan atau berikutnya, jumlah pengusul terkait, dan tautan detail. Tombol Gunakan filter periode menerapkan periode kartu ke agregat pengusul.

Filter Periode penghargaan berlaku bersama filter tahun pencatatan, instansi, dan jenis penghargaan pada seluruh agregat, peta, dan ekspor CSV. Pilihan Semua periode dan data lama mencakup record tanpa periode. Progress bar periode menampilkan progres seluruh periode dan diberi keterangan bahwa filter tambahan hanya mempersempit agregat pengusul. Tautan dari detail periode membuka dashboard dengan `periode_id` terpilih.

## Migrasi dan pemeriksaan

Jalankan `backend/migrations/013_award_periods.up.sql` satu kali pada database yang sudah tersedia. Migrasi menggunakan transaksi dan menambahkan tabel periode/tahap, foreign key nullable, serta index pada lima tabel. Tidak ada pengaitan atau pembuatan periode otomatis. Backup database sebelum pemasangan; Docker entrypoint tidak menjalankan ulang migrasi pada volume lama.

`periods.integration.test.js` menerapkan migrasi pada tabel TEMP di satu koneksi PostgreSQL dan menguji API dengan role, validasi tanggal, progres, pengaitan, filter dashboard, concurrency, penutupan, pembukaan kembali, dan penghapusan. Pengujian tidak menulis record aplikasi yang sebenarnya. Atur `EXECUTIVE_TEST_DATABASE_URL` untuk menjalankannya bersama pengujian backend lainnya.
