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
   - `JWT_SECRET` = chuỗi mạnh **≥16 ký tự** (bắt buộc — thiếu thì API crash 500)
   - `VIETQR_INTENT_SECRET` = chuỗi mạnh **≥16 ký tự** (bắt buộc production)
   - `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY` — xác minh nạp ví (webhook `POST /api/webhooks/payos`)
   - `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `EMAIL_FROM` — OTP xác minh email trước khi rút (Gmail; xem mục *Rút tiền*)
   - `GOOGLE_CLIENT_ID` — Google login (set `emailVerified`)
4. Sau deploy: chạy `prisma db push` / seed từ máy local trỏ cùng `DATABASE_URL`.
5. Project Web: set `VITE_API_URL=https://dich-vu-oi-api.vercel.app` rồi **Redeploy**.
6. **Ảnh upload (bắt buộc production):** Vercel Storage → **Blob** → tạo store → copy `BLOB_READ_WRITE_TOKEN` vào env API → Redeploy. Không có token thì upload trả 503 (FS `/tmp` không bền). Ảnh demo cũ có thể nằm trong `apps/web/public/uploads` (same-origin).

> Thiếu `JWT_SECRET` / `VIETQR_INTENT_SECRET` đạt chuẩn → mọi request trả `FUNCTION_INVOCATION_FAILED` / 500.

### Tài khoản seed

Mật khẩu chung: **`demo1234`**

| Email | Role | Ghi chú |
|-------|------|---------|
| `demo@dichvuoi.vn` | CUSTOMER | Khách Demo — ví 5 triệu |
| `demo02@dichvuoi.vn` | CUSTOMER | Khách Demo 02 — ví 3 triệu |
| `demo03@dichvuoi.vn` | CUSTOMER | Khách Demo 03 — ví 2 triệu |
| `demo04@dichvuoi.vn` | CUSTOMER | Khách Demo 04 — ví 2,5 triệu |
| `lan@dichvuoi.vn` | CUSTOMER | Nguyễn Thị Lan — ví 4 triệu |
| `minh@dichvuoi.vn` | CUSTOMER | Trần Văn Minh — ví 4 triệu |
| `admin@dichvuoi.vn` | ADMIN | Admin nội bộ |
| `partner@dichvuoi.vn` / `partnerNN@…` | PARTNER | Người làm (45 hồ sơ seed) |

## Module hiện có

| Module | Vai trò |
|--------|---------|
| `auth` | Đăng ký / đăng nhập / Google / me (JWT); OTP SĐT; **OTP email (Gmail)** |
| `mail` | Gửi email qua **Gmail SMTP** (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) |
| `catalog` | Groups, categories, services |
| `bookings` | Thuê, escrow pay, chat, review, trạng thái |
| `partners` | Hồ sơ Partner |
| `finance` | Ví, VietQR nạp, **rút tiền**, hóa đơn |
| `admin` | Stats, users, partners, bookings, reviews, flagged |
| `health` | Health check |

## Rút tiền — bắt buộc xác minh email trước, rồi mới nhập NH

**Luồng UI / API:**

1. User đăng ký **email/mật khẩu** (không Google) mở `/rut-tien` → **Bước 1**: **tự nhập** email (ô trống) → OTP Gmail → gắn/đổi `User.email` + `emailVerified`.
2. **Hoàn thành** bước 1 → **Bước 2**: mới hiện form ngân hàng + STK + nút rút.
3. User **Google login** → đã `emailVerified` → vào thẳng bước 2 (nhập NH).

**Quy tắc API:** `POST /api/wallet/withdraw` **chỉ** khi `User.emailVerified === true` (`403` nếu chưa).

| Bước | API | Ghi chú |
|------|-----|---------|
| 1. Xác minh email | `POST /api/auth/verify-email/request` `{ email }` → `confirm` `{ code }` | OTP Gmail; confirm → `email` + verified; trùng email user khác → 409 |
| Google | `POST /api/auth/google` | → `emailVerified=true`, bỏ bước 1 |
| 2. Rút | `POST /api/wallet/withdraw` | Sau khi đã verify email + nhập STK |
| Liên kết STK (tuỳ chọn) | `POST /api/wallet/verify-bank/*` | OTP email; nếu `bankVerified` thì lần rút sau khớp STK |

### Mail — **Gmail App Password**

Free ~100–500 mail/ngày — đủ OTP. **Max 5 OTP email / user / giờ.** Gmail đã cấu hình: không trả mã trên API/UI (kể cả khi gửi fail). Chưa cấu hình Gmail (dev): mới hiện mã mock.

```env
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
EMAIL_FROM=DichVuOi <you@gmail.com>
```

1. Bật **2-Step Verification** trên Google  
2. [App passwords](https://myaccount.google.com/apppasswords) → tạo cho Mail → copy 16 ký tự  
3. Restart API

## Endpoints chính (thêm)

```text
POST /api/auth/verify-email/request
POST /api/auth/verify-email/confirm
POST /api/wallet/verify-bank/request
POST /api/wallet/verify-bank/confirm
POST /api/wallet/withdraw

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
