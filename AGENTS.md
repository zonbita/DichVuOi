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
- Section / chrome: **1280px** (`.chrome-container` / `.section-container`)
- Dashboard khách thuê & người làm: `UserDashboardLayout` (cột giống admin)
