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

DB local: **SQLite** (`DATABASE_URL` trong `.env`). Production chuyển PostgreSQL.

### Tài khoản seed

| Email | Password | Role |
|-------|----------|------|
| `demo@dichvuoi.vn` | `demo1234` | CUSTOMER |
| `admin@dichvuoi.vn` | `demo1234` | ADMIN |
| `partner@dichvuoi.vn` / `partnerNN@…` | `demo1234` | PARTNER |

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
