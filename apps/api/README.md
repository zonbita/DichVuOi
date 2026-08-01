# @dichvuoi/api

NestJS API cho **Dịch Vụ Ơi** — catalog 3 tầng, auth JWT, thuê / nhận việc, escrow mock, review, admin.

## Chạy local

Từ root monorepo:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev:api
```

- API: http://localhost:3001/api  
- Swagger/OpenAPI: http://localhost:3001/docs  

DB local / production: **PostgreSQL** (`DATABASE_URL` trong `.env`). Local có thể dùng [Neon](https://neon.tech) free hoặc Docker Postgres — không còn SQLite.

### Deploy Vercel (API)

1. Tạo DB Neon → copy connection string.
2. Vercel project API: **Root Directory** = `apps/api`.
3. Env:
   - `DATABASE_URL` = Neon URL (`?sslmode=require`)
   - `CORS_ORIGIN` = `https://dich-vu-oi.vercel.app` (hoặc để trống)
   - `JWT_SECRET` = chuỗi mạnh
4. Sau deploy: chạy `prisma db push` / seed từ máy local trỏ cùng `DATABASE_URL`.
5. Project Web: set `VITE_API_URL=https://dich-vu-oi-api.vercel.app` rồi **Redeploy**.

> Upload ảnh trên Vercel ghi vào `/tmp` (ephemeral). Realtime Socket.IO có thể hạn chế trên serverless — REST vẫn hoạt động.

### Tài khoản seed

Mật khẩu chung: **`demo1234`**

| Email | Role | Ghi chú |
|-------|------|---------|
| `demo@dichvuoi.vn` | CUSTOMER | Khách Demo — ví 5 triệu |
| `demo02@dichvuoi.vn` | CUSTOMER | Khách Demo 02 — ví 3 triệu |
| `demo03@dichvuoi.vn` | CUSTOMER | Khách Demo 03 — ví 2 triệu |
| `lan@dichvuoi.vn` | CUSTOMER | Nguyễn Thị Lan — ví 4 triệu |
| `minh@dichvuoi.vn` | CUSTOMER | Trần Văn Minh — ví 4 triệu |
| `admin@dichvuoi.vn` | ADMIN | Admin nội bộ |
| `partner@dichvuoi.vn` / `partnerNN@…` | PARTNER | Người làm (45 hồ sơ seed) |

## Module hiện có

| Module | Vai trò |
|--------|---------|
| `auth` | Đăng ký / đăng nhập / me (JWT) |
| `catalog` | Groups, categories, services |
| `bookings` | Thuê, escrow pay, chat, review, trạng thái |
| `partners` | Hồ sơ Partner |
| `admin` | Stats, users, partners, bookings, reviews, flagged |
| `health` | Health check |

## Endpoints chính (thêm)

```text
POST /api/bookings/:id/pay
GET|POST /api/bookings/:id/messages
GET|POST /api/bookings/:id/reviews

GET  /api/admin/stats
GET|PATCH /api/admin/users/:id
GET|PATCH /api/admin/partners/:userId
GET|PATCH /api/admin/bookings/:id
GET  /api/admin/reviews
GET  /api/admin/messages/flagged
GET  /api/admin/catalog
```

## Quy ước

- File: `kebab-case`
- Package: `@dichvuoi/api`
- Prefix toàn cục: `/api`
