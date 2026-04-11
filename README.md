# GoCommerce - Enterprise-Grade E-Commerce Platform 🚀🏙️✨

**GoCommerce** adalah platform e-commerce modern yang dirancang untuk performa tinggi, skalabilitas, dan pengalaman pengguna yang premium. Dibangun dengan fokus pada kecepatan pemrosesan transaksi dan kemudahan manajemen operasi toko.

---

## 🌟 Fitur Utama

### 🛒 E-Commerce & Checkout
- **Unified Checkout**: Alur transaksi mulus dengan integrasi **Xendit** (Pembayaran VA, QRIS, E-Wallet) dan **Biteship** (Logistik/Ongkir Real-time).
- **Inventory Engine**: Manajemen stok otomatis yang sinkron dengan setiap transaksi.
- **Voucher System**: Sistem diskon dan promo yang fleksibel dengan validasi real-time.

### ⚙️ Manajemen Brand Dinamis
- **Centralized Branding**: Kontrol penuh atas **Logo Toko**, **Site Title**, dan **Favicon** langsung dari dashboard Admin.
- **Responsive Layout**: Antarmuka pelanggan yang menyesuaikan identitas brand secara instan di Navbar dan Footer.

### 📝 Konten & Administrasi
- **Professional Blog**: Mesin publikasi artikel untuk konten edukatif dan strategi SEO.
- **Admin Analytics**: Dashboard statistik penjualan dan metrik performa toko secara real-time.
- **Image Optimization**: Kompresi gambar otomatis dan validasi upload **5MB** untuk performa web yang maksimal.

---

## 🛠️ Stack Teknologi

| Komponen | Teknologi |
| :--- | :--- |
| **Backend API** | **Go (Golang)** + framework **Gin** |
| **ORM** | **GORM** (PostgreSQL) |
| **Frontend** | **React.js** (Vite) + Tailwind CSS |
| **Database** | **PostgreSQL** (Data Relasional) |
| **Caching** | **Redis** (Session & Cache) |
| **Infrastruktur** | **Docker** & **Docker Compose** |
| **Keamanan** | **JWT** (Authentication) & Email Verification |

---

## 🏛️ Arsitektur Sistem
Platform ini mengadopsi pola **Clean Architecture** pada sisi backend untuk memisahkan logika bisnis dari detail infrastruktur:
1. **Domain**: Definisi model data dan interface inti.
2. **Service**: Logika aplikasi dan koordinasi alur bisnis.
3. **Repository**: Implementasi akses data (PostgreSQL/Redis).
4. **Handler**: Penanganan permintaan HTTP (RESTful API).

---

## 🚀 Cara Menjalankan (Deployment)

### 1. Prasyarat
Pastikan Anda memiliki [Docker](https://www.docker.com/) dan [Docker Compose](https://docs.docker.com/compose/) terinstal di mesin Anda.

### 2. Jalankan Kontainer
Gunakan Docker Compose untuk membangun dan menjalankan seluruh ekosistem (DB, Redis, Mailhog, Frontend):
```bash
docker-compose up -d --build
```

### 3. Jalankan Backend API
Masuk ke direktori `backend` dan jalankan server API:
```bash
cd backend
go run cmd/api/main.go
```

### 4. Inisialisasi Database (Opsional)
Jika Anda ingin menggunakan data demo atau hasil dump:
```bash
docker exec -i gocommerce-db psql -U postgres -d ecommerce < ecommerce_dump.sql
```

---

## 🔗 Akses Layanan
- **🛍️ Frontend Shop**: [http://localhost:5173](http://localhost:5173)
- **⚙️ Backend API**: [http://localhost:8080](http://localhost:8080)
- **📧 Mailhog (Email)**: [http://localhost:8025](http://localhost:8025)

---

## 📂 Struktur Proyek
- `/backend`: Kode sumber API server berbasis Go.
- `/frontend`: Aplikasi web berbasis React/Vite.
- `docker-compose.yml`: Konfigurasi kontainerisasi untuk infrastruktur pendukung.

---
> [!TIP]
> **GoCommerce** siap digunakan untuk operasional bisnis skala menengah hingga besar dengan kustomisasi yang sangat fleksibel.
