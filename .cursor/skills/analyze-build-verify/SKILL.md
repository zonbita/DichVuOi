---
name: analyze-build-verify
description: >-
  Runs the DichVuOi feature loop: analyze codebase → implement → verify
  (build/lint/API/UI). Use when the user asks to phân tích, làm chức năng,
  implement a feature, improve dashboards, fix bugs end-to-end, or says
  "phân tích rồi làm", "làm đi", "check chức năng", or wants analyze → build → verify.
---

# Analyze → Build → Verify

Bắt buộc chạy **đủ 3 pha** theo thứ tự. Không nhảy sang code khi chưa có kết luận phân tích; không kết thúc khi chưa verify.

Mỗi vòng = P1 → P2 → P3. Sau khi P3 pass, **tự động sang vòng kế** với hạng mục ưu tiên tiếp theo — **tối đa 3 vòng** mỗi lượt gọi.

Sao chép checklist và cập nhật trạng thái trong phiên:

```
Progress:
- [ ] Vòng 1: P1 → P2 → P3
- [ ] Vòng 2: P1 → P2 → P3
- [ ] Vòng 3: P1 → P2 → P3
```

## P1 — Analyze (phân tích)

Mục tiêu: hiểu **hiện trạng + khoảng trống + phạm vi làm**, rồi mới code.

1. Đọc điểm vào liên quan: route (`App.tsx`), page/layout, API controller/service, types, README mục liên quan.
2. Tóm tắt ngắn (bullet):
   - **Có sẵn:** file / API / UI / realtime
   - **Thiếu / lỗi:** khoảng trống UX–kỹ thuật
   - **Phạm vi làm:** P0 / P1 (không mở rộng ngoài yêu cầu)
3. Nếu yêu cầu mơ hồ: hỏi 1–2 câu; nếu đã rõ từ ngữ cảnh chat → không hỏi lại.
4. Trước khi sang P2, nêu **kế hoạch 3–7 bước** (file sẽ đụng).

Không viết code lớn trong P1. Được phép đọc/grep/readonly.

### Template output P1

```markdown
## Phân tích
- Hiện trạng: …
- Khoảng trống: …
- Phạm vi: …
## Kế hoạch
1. …
2. …
```

## P2 — Build (làm chức năng)

Mục tiêu: implement đúng phạm vi đã chốt ở P1.

1. TodoWrite (nếu ≥2 bước) — bám kế hoạch P1.
2. Sửa tối thiểu, khớp style repo (NestJS/Prisma API, React/Vite/Tailwind web).
3. Ưu tiên tái sử dụng component/hook/API có sẵn (dashboard shell, realtime, escrow…).
4. Không thêm markdown/README trừ khi user yêu cầu hoặc thay đổi hành vi cần ghi.
5. Sau mỗi cụm thay đổi liên quan: cập nhật todo.

### Quy ước DichVuOi

- Monorepo: `apps/web`, `apps/api`
- Dashboard khách thuê/người làm: `UserDashboardLayout`, max content 1600px
- Realtime: Socket.IO `/partner-realtime` (partner + customer rooms)
- Thanh toán: escrow mock (`UNPAID` → `HELD` → `RELEASED`/`REFUNDED`)
- Không invent payment gateway / exploit / secret

## P3 — Verify (check chức năng)

Mục tiêu: chứng minh thay đổi **chạy được**, không chỉ “đã viết”.

Chạy những gì liên quan (PowerShell — không dùng `&&`):

```powershell
npm run build -w @dichvuoi/web
npm run build -w @dichvuoi/api
```

Khi đụng API/runtime:

```powershell
# health (dev server đang chạy)
Invoke-WebRequest -Uri http://localhost:3001/api/health -UseBasicParsing
```

Checklist verify (tick những mục áp dụng):

- [ ] Build web/api không lỗi TypeScript
- [ ] Route/UI mới có trong `App.tsx` / layout đúng
- [ ] API shape khớp types web (`apps/web/src/types`)
- [ ] Happy path: tạo/cập nhật dữ liệu → UI phản ánh (hoặc realtime invalidate)
- [ ] Edge: chưa login, empty list, forbidden role
- [ ] Không regression rõ (header mode, dashboard shell, escrow gate)

Nếu verify fail: **fix → chạy lại P3**, không báo xong.

### Template output P3

```markdown
## Đã làm
- …
## Đã check
- Build: OK / fail
- Hành vi: …
## Còn lại (nếu có)
- …
```

## Vòng lặp tự động (tối đa 3)

Sau khi P3 pass:

1. Lấy hạng mục ưu tiên cao nhất còn lại trong backlog P1 (mục “Còn lại” của vòng trước).
2. Nếu còn việc **và** chưa đủ 3 vòng → chạy vòng mới (P1 rút gọn: chỉ phân tích hạng mục đó).
3. Nếu hết việc trong phạm vi, hoặc đã đủ 3 vòng → dừng, tổng kết.

**Dừng sớm (không chạy tiếp)** khi:

- Hạng mục kế tiếp cần user quyết định (chọn hướng, đổi schema, thêm dependency lớn)
- P3 fail 3 lần liên tiếp trên cùng lỗi → báo user, không tự vá tiếp
- Hạng mục kế tiếp nằm ngoài phạm vi user yêu cầu

Mỗi vòng báo cáo ngắn (Đã làm / Đã check / Còn lại). Cuối lượt: tổng kết các vòng đã chạy và backlog còn dư.

## Phím tắt hành vi user

| User nói | Agent làm |
|----------|-----------|
| Chỉ «phân tích…» | **Chỉ P1**, không vòng lặp (Ask/Agent đều được; không code nếu Ask) |
| «làm đi» / «implement» sau phân tích | P2 + P3 cho hạng mục đó, **1 vòng** |
| «phân tích rồi làm» / feature mới | P1 → P2 → P3 cho đúng feature, **1 vòng** |
| «check chức năng» | Chỉ P3 trên thay đổi gần nhất |
| `@analyze-build-verify` (không nêu việc cụ thể) | Vòng lặp tự động, **tối đa 6 vòng** |

## Anti-patterns

- Code ngay khi chưa biết file/API nào đụng
- Báo xong khi chưa build / chưa nêu cách verify
- Refactor rộng ngoài phạm vi
- Commit/push khi user chưa yêu cầu
- Chạy quá 6 vòng, hoặc tự chọn hạng mục cần user quyết định
