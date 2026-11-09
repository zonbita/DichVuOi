# Prisma migrations

Schema thay đổi qua **migration có version**, không dùng `prisma db push` nữa.

| Việc | Lệnh (chạy ở thư mục gốc repo) |
|---|---|
| Sửa `schema.prisma` rồi tạo migration mới (DB local/dev) | `npm run db:migrate -- --name <ten_thay_doi>` |
| Áp migration lên staging/production | `npm run db:deploy` |
| Xem trạng thái migration của một DB | `npm run db:status` |

## Migration hiện có

- `0_init` — baseline: toàn bộ schema tại thời điểm chuyển từ `db push` sang migration.
- `1_settlement_indexes` — index cho truy vấn quét đơn hết hạn (`status + *DeadlineAt`) và cọc ứng tuyển đang giữ (`bookingId + depositStatus`).

## Chuyển một DB đã tạo bằng `db push` (làm MỘT lần cho mỗi DB)

DB production/staging hiện có đã có đủ bảng của `0_init`. Phải đánh dấu baseline là
"đã áp dụng" **trước** lần `migrate deploy` đầu tiên, nếu không Prisma sẽ cố tạo lại bảng và lỗi:

```bash
# DATABASE_URL trỏ tới DB cần chuyển
npx prisma migrate resolve --applied 0_init --schema apps/api/prisma/schema.prisma
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma   # áp 1_settlement_indexes trở đi
```

Nên kiểm tra trước rằng DB đang khớp schema baseline:

```bash
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-migrations apps/api/prisma/migrations \
  --shadow-database-url "$SHADOW_DATABASE_URL" \
  --script
```

Kết quả chỉ nên chứa các lệnh `CREATE INDEX` của `1_settlement_indexes`. Nếu có thêm gì khác, DB đã lệch
schema — xử lý tay trước khi deploy.

## Không tự chạy migration khi build

`vercel.json` cố ý **chưa** chạy `prisma migrate deploy` trong bước build. Hãy chuyển DB theo các bước
trên trước, rồi mới thêm `npx prisma migrate deploy &&` vào `buildCommand` nếu muốn tự động.
