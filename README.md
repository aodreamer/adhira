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

Skema database dan data contoh (dummy) otomatis ter-load saat volume `pgdata` pertama kali dibuat, lewat file-file di `backend/migrations/` (termasuk `010_seed_data.up.sql`). Kalau volume sudah pernah ada sebelumnya, migrasi tidak otomatis dijalankan ulang — jalankan file `.sql` yang baru secara manual lewat `docker exec -i adhira_db psql -U euser -d adhira < backend/migrations/<file>.sql`.

## Struktur

- `backend/` - Express REST API
- `frontend/` - Vue 3 SPA
- `docker-compose.yml` - Orchestration
