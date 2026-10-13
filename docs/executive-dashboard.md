# Rancangan Executive Dashboard Adhira

Dashboard ditujukan untuk pimpinan yang memantau proses pengusulan Dharma Persandian. Informasi disajikan sebagai jumlah dan rekap instansi. Identitas pengusul, NIP/NRP, catatan penolakan individu, dan file persyaratan tidak dikirim melalui API dashboard.

## Akses dan navigasi

- Pimpinan: `/pimpinan`, hanya membaca dashboard dan mengelola profil/password sendiri. Akun dibuat oleh Administrator melalui Manajemen User, dengan level Pimpinan. Tidak tersedia registrasi mandiri atau akun dengan password bawaan.
- Administrator: `/admin/executive`, menggunakan dashboard yang sama melalui menu Executive Dashboard.
- API: `GET /api/executive-dashboard`. Akses memerlukan JWT dan pemeriksaan ulang role serta status aktif akun pada database untuk setiap request. User dan Verifikator tidak mendapat akses.
- Endpoint perubahan pengusulan serta unduhan berkas pribadi dibatasi untuk User; Pimpinan tidak memiliki akses operasional.

## Susunan antarmuka

1. Judul dashboard dan waktu pembaruan data.
2. Filter tahun pencatatan, kelompok instansi, dan jenis penghargaan. Tombol Terapkan melakukan pembaruan bersama untuk seluruh panel. Reset menampilkan seluruh data.
3. Indikator total pengusul, lolos verifikasi, menunggu verifikasi, perlu perbaikan, dan SK tersedia.
   Peta Indonesia menampilkan sebaran berdasarkan provinsi yang tercatat, dengan pilihan provinsi dan ringkasan status. Jumlah terpetakan serta belum terpetakan ditampilkan terpisah.
4. Komposisi status verifikasi dan ringkasan perhatian untuk koordinasi.
5. Tren pencatatan pengusul dan komposisi jenis penghargaan.
6. Rekap instansi dengan total, lolos verifikasi, menunggu, perbaikan, draft, dan SK tersedia.
7. Unduh rekap CSV sesuai filter dan cetak melalui browser.

Warna utama navy, dengan aksen emas pada judul dan indikator total. Label serta angka selalu menyertai warna status. Layout mengikuti lebar layar; tabel dapat digeser secara horizontal pada layar kecil. Status memuat penjelasan ketika data kosong atau request gagal.

## Definisi indikator

| Indikator | Definisi |
| --- | --- |
| Total pengusul | Jumlah record `data_individu` sesuai filter. Termasuk record yang belum memilih jenis penghargaan. |
| Perlu perbaikan | Status verifikasi data atau berkas Ditolak. Memiliki prioritas dalam pengelompokan status. |
| Lolos verifikasi | Verifikasi data dan verifikasi berkas Disetujui. Tidak berarti penghargaan telah ditetapkan. |
| Draft | Jenis kosong atau Sedang Diajukan, setelah kondisi perbaikan dan lolos verifikasi diperiksa. |
| Menunggu verifikasi data | Pengusul selain kategori di atas, dengan verifikasi data belum Disetujui. |
| Menunggu verifikasi berkas | Pengusul selain kategori di atas, dengan data Disetujui dan berkas belum Disetujui. |
| Menunggu verifikasi | Jumlah kategori menunggu data dan menunggu berkas. Tidak mencakup draft. |
| SK tersedia | Kolom `file_kepka` berisi metadata file. Tidak memeriksa isi keputusan atau memastikan file tersedia di penyimpanan. Dihitung terpisah dari status verifikasi. |
| Menunggu ≥30 hari | Pengusul pada kategori menunggu dengan tanggal pencatatan minimal 30 hari sebelumnya. Ambang untuk perhatian, bukan SLA atau lama antrean sejak keputusan terakhir. |
| Instansi tercakup | Jumlah label instansi berbeda, tanpa kategori Belum diisi. Pemerintah Pusat memakai nama instansi; Pemerintah Daerah memakai tipe, kabupaten/kota, dan provinsi jika tersedia. |

Setiap record masuk tepat satu kategori status. Total = draft + menunggu data + menunggu berkas + perbaikan + lolos verifikasi. SK tersedia dapat tumpang tindih dengan kategori status dan tidak dijumlahkan ke total.

## Sumber data dan periode

Tanggal pencatatan menggunakan `COALESCE(tgl_upload, created_at::date)`. Tahun tidak memakai `tgl_penghargaan`, karena tanggal tersebut tidak selalu menunjukkan tanggal pengajuan atau penetapan keputusan. Dengan filter tahun tertentu, tren ditampilkan Januari–Desember dan bulan kosong bernilai nol. Dengan seluruh tahun, tren dikelompokkan per tahun yang memiliki pencatatan. Record tanpa tanggal tidak tampil pada tren dan diberi keterangan jumlahnya.

Seluruh agregasi menggunakan transaksi PostgreSQL `REPEATABLE READ READ ONLY` sehingga panel menggambarkan snapshot yang sama. Parameter filter divalidasi dan diikat ke query. API tidak melakukan perubahan data. Ekspor menggunakan snapshot dan filter yang sama dengan angka yang ditampilkan, serta menangani label yang dapat dibaca sebagai formula oleh aplikasi spreadsheet.

## Peta Indonesia

Peta memuat batas 38 provinsi dari [Badan Informasi Geospasial](https://geoservices.big.go.id/gis/rest/services/STIG/Batas_Provinsi/MapServer/0), termasuk Papua Selatan, Papua Tengah, Papua Pegunungan, dan Papua Barat Daya. Geometry disimpan pada source frontend dalam bentuk path SVG; tidak diperlukan API key atau layanan peta saat dashboard dibuka. Rincian sumber tersedia pada `frontend/src/assets/maps/README.md`.

Agregasi provinsi memakai `pemda_provinsi` untuk record dengan instansi Pemerintah Daerah. BSSN, TNI, atau Pemerintah Pusat tidak diasumsikan berada di Jakarta atau provinsi tertentu. Nilai kosong dan nama yang belum dikenali dihitung sebagai belum terpetakan. Nama dibandingkan setelah normalisasi kapitalisasi dan spasi; varian DI Yogyakarta digabungkan dengan Daerah Istimewa Yogyakarta. Pengelompokan mengikuti nama provinsi yang tersimpan; data wilayah lama tidak dikoreksi otomatis berdasarkan perubahan administrasi.

Warna menunjukkan jumlah pengusul, dengan legenda angka dan label nol. Pengguna dapat memilih provinsi melalui peta, keyboard, atau dropdown untuk melihat total dan statusnya. Tombol pembesaran tersedia. Filter tahun, kelompok instansi, dan jenis penghargaan berlaku pada seluruh data peta.

## Batasan dan pengembangan berikutnya

Dashboard belum menghitung jumlah penerima penghargaan yang ditetapkan, waktu penyelesaian verifikasi, atau distribusi kepada penerima. Perhitungan tersebut memerlukan status keputusan yang terstruktur, tanggal masuk antrean dan riwayat keputusan, serta relasi antara arsip distribusi dan penerima. Keberadaan file SK digunakan sebagai indikator metadata saja.

Skema saat ini menyimpan `mst_user.level` sebagai VARCHAR, sehingga penambahan Pimpinan tidak memerlukan perubahan struktur database. Tidak ada data pengguna atau file pribadi yang ditambahkan ke source rancangan.

## Verifikasi rancangan

Pengujian backend dan PostgreSQL: 46 test lulus. Empat pengujian frontend tambahan memeriksa cakupan geometri 38 provinsi, normalisasi nama, rekonsiliasi data belum terpetakan, dan kondisi kosong. Cakupan meliputi kategori status yang tidak tumpang tindih, rekonsiliasi total, kombinasi filter, data kosong, ambang usia 29/30 hari, penolakan filter tidak valid, pembatasan akses, dan pencabutan akses operasional setelah perubahan role.

Pratinjau browser diperiksa pada desktop 1440 px dan ponsel 390 px menggunakan 160 pengusul demonstrasi. Login Pimpinan, navigasi Administrator, pembuatan akun Pimpinan, ekspor CSV, layout cetak, serta kondisi kosong dan kegagalan request telah diperiksa. Build frontend berhasil.
