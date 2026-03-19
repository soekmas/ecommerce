# E-commerce Application (Go + React)

Ini adalah aplikasi e-commerce sederhana dengan stack Go (Backend) dan React/Vite (Frontend).

## Prerequisites
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## Cara Menjalankan

### 1. Jalankan Infrastruktur & Frontend via Docker
Gunakan Docker Compose untuk menjalankan database (Postgres, Redis, Mailhog) serta Frontend.
```bash
docker-compose up -d --build
```

### 2. Jalankan Backend (Go)
Masuk ke folder `backend` dan jalankan API server:
```bash
cd backend
go run cmd/api/main.go
```

## Cara Import Database
Jika Anda ingin menggunakan data yang sudah ada, Anda bisa melakukan import database:
```bash
docker exec -i ecommerce_db psql -U root ecommerce < ecommerce_dump.sql
```

## Akses Layanan
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **Mailhog (Web UI)**: [http://localhost:8025](http://localhost:8025) untuk mengecek email keluar.

## Struktur Project
- `/backend`: Go API Server.
- `/frontend`: React/Vite web application.
- `docker-compose.yml`: Definisi container untuk DB, Redis, Mailhog, dan Frontend.
