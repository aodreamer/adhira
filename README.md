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

## Struktur

- `backend/` - Express REST API
- `frontend/` - Vue 3 SPA
- `docker-compose.yml` - Orchestration
