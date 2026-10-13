# Adhira

Sistem pengarsipan dokumen penghargaan elektronik.

## Tech Stack
- Backend: Node.js + Express.js + PostgreSQL
- Frontend: Vue.js 3 + Tailwind CSS
- Infrastructure: Docker Compose

## Menjalankan

```bash
docker-compose up -d
```

Akses aplikasi di http://localhost:8080

Default login: admin / admin123

## Executive Dashboard

Administrator dapat membuka `/admin/executive`. Untuk akses pimpinan, buat akun melalui Manajemen User dengan level **Pimpinan**. Setelah login, akun tersebut diarahkan ke `/pimpinan` dan hanya mendapat ringkasan agregat serta pengaturan akun sendiri.

Dashboard menyediakan filter tahun pencatatan, instansi, dan jenis penghargaan; peta Indonesia dengan zoom per provinsi; komposisi status; tren pengusul; usia pencatatan; prioritas koordinasi; matriks verifikasi; rekap instansi; unduhan CSV; serta cetak. Layout memakai komponen bersama aplikasi, dengan grafik Chart.js dan animasi Motion for Vue yang mengikuti preferensi reduced motion. Definisi indikator dan batasan perhitungan tersedia pada [rancangan executive dashboard](docs/executive-dashboard.md).

Pengujian backend: `cd backend && npm test`. Pengujian SQL dashboard menggunakan PostgreSQL dan dijalankan jika `EXECUTIVE_TEST_DATABASE_URL` diatur ke database pengujian terpisah. Pengujian tersebut menggunakan tabel sementara pada koneksi pengujian.

Skema database dan data contoh (dummy) otomatis ter-load saat volume `pgdata` pertama kali dibuat, lewat file-file di `backend/migrations/` (termasuk `010_seed_data.up.sql`). Kalau volume sudah pernah ada sebelumnya, migrasi tidak otomatis dijalankan ulang — jalankan file `.sql` yang baru secara manual lewat `docker exec -i adhira_db psql -U euser -d adhira < backend/migrations/<file>.sql`.

## Struktur

- `backend/` - Express REST API
- `frontend/` - Vue 3 SPA
- `docker-compose.yml` - Orchestration
