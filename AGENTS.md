# DichVuOi — Agent

## Feature workflow

Dùng skill **analyze-build-verify**:

1. **Phân tích** hiện trạng + khoảng trống + phạm vi
2. **Làm chức năng** theo kế hoạch (tối thiểu, đúng stack)
3. **Check chức năng** (build web/api + happy/edge path)

Chi tiết: `.cursor/skills/analyze-build-verify/SKILL.md`

## Stack nhanh

- Web: `apps/web` (React, Vite, Tailwind, TanStack Query)
- API: `apps/api` (NestJS, Prisma, Socket.IO)
- Section / chrome: **1396px** (`.chrome-container` / `.section-container`)
- Dashboard khách thuê & người làm: `UserDashboardLayout` (cột giống admin)

## Auth & role (web)

| Khái niệm | Nguồn | Giá trị | Ghi chú |
|-----------|--------|---------|---------|
| `user.role` | DB `User.role` → JWT → `GET /api/auth/me` | `CUSTOMER` \| `PARTNER` \| `ADMIN` \| `MODERATOR` | Quyền hệ thống (admin, guard API) |
| `mode` | `localStorage` `dichvuoi_mode` | `hire` \| `offer` | UI khách thuê / người làm, **không** lưu DB |
| `canOffer` | `user.partnerProfile != null` | boolean | Có hồ sơ người làm mới chuyển mode `offer` |
| Token | `localStorage` `dichvuoi_token` | JWT string | Client không parse role trực tiếp |

Chi tiết: `apps/web/src/features/auth/auth-context.tsx`

## UI / Admin (ghi trong README)

Quy tắc chi tiết (Lucide trên `/admin` Tổng quan, dashboard chrome theo `/doi-tac/viec`, gallery `object-contain`, **giá tiền 1 hàng**…): xem **README.md** mục *Hệ thống giao diện (UI)* và *Admin*.
