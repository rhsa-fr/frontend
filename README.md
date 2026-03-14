
## Setup & Instalasi

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Koneksi ke Backend FastAPI

Axios instance dikonfigurasi di `src/lib/axios.ts`:

- **Base URL**: `NEXT_PUBLIC_API_URL/api/v1`
- **Auth**: JWT Bearer token dari `localStorage`
- **Interceptors**:
  - Request → otomatis attach `Authorization: Bearer <token>`
  - Response → handle error 401/403/404/422/500 secara global

