---
name: Dich Vu Oi
description: Trusted two-sided service marketplace for Vietnam
colors:
  navy: "#073b5c"
  navy-deep: "#052d47"
  brand: "#009c95"
  brand-deep: "#007a74"
  brand-soft: "#e8f7f5"
  gold: "#d9a441"
  gold-soft: "#fbf4e6"
  ink: "#18313f"
  muted: "#6b7d87"
  line: "#e2e9ec"
  canvas: "#f7f9fa"
  card: "#ffffff"
typography:
  body:
    fontFamily: "Be Vietnam Pro, Inter, Manrope, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Be Vietnam Pro, Inter, Manrope, Segoe UI, sans-serif"
    fontWeight: 600
rounded:
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "16px"
spacing:
  page-inline-mobile: "16px"
  page-inline-tablet: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
  button-primary-hover:
    backgroundColor: "{colors.navy-deep}"
  surface-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
  input-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
---

# Design System: Dich Vu Oi

## Overview

**Creative North Star: "Trusted Service Control Room"**

He thong giao dien uu tien cam giac dang tin cay, ro rang, va co cau truc nhu mot san giao dich dich vu nghiem tuc. Tong the giu nen sang, typography de doc, va cac diem nhan mau brand de dinh huong hanh dong thay vi trang tri.

Brand voice cua UI la "calm confidence": khong phat sang qua muc, nhung du suc nang de huong dan nguoi dung qua cac flow dat dich vu, xu ly don, va theo doi trang thai.

## Colors

Palette ket hop navy + teal + gold tren nen canvas sang de tao trust-first hierarchy.

### Primary

- **Navy Trust** (`#073b5c`): header, title, vung chrome can authority.
- **Brand Teal** (`#009c95`): CTA chinh, active states, focus accents.

### Neutral

- **Canvas Mist** (`#f7f9fa`): nen tong trang.
- **Card White** (`#ffffff`): card/surface chinh.
- **Line Soft** (`#e2e9ec`): border, divider, field outlines.
- **Ink Deep** (`#18313f`): text chinh.
- **Muted Slate** (`#6b7d87`): text phu, helper.

## Typography

**Body Font:** Be Vietnam Pro, Inter, Manrope, Segoe UI, sans-serif

Typography uu tien kha nang doc tren dashboard va danh sach nghiep vu: contrast ro, size nen 16px, trong so 600 cho tieu de/phim hanh dong.

### Hierarchy

- **Title:** semibold cho headings va section labels.
- **Body:** 16px / 1.5 cho noi dung chinh.
- **Label:** compact semibold cho button, chip, field labels.

## Layout

Layout dung container co gioi han 1396px (`page/chrome/section`) de giu nhip nhat quan giua public pages va dashboard. Page shell responsive voi padding ngang 16px (mobile) va 24px (tablet+).

## Elevation & Depth

Depth duoc dung muc vua phai: card bong nhe (`--shadow-card`) cho surface tach lop, hover shadow manh hon (`--shadow-hover`) cho interactive affordance. Khong dung effect phuc tap tren da so man hinh.

### Soft-3D Chrome (navy)

Ngon ngu do sau dung cho chrome thuong hieu — **giu mau navy cu**, khong doi sang teal/purple.

**Ap dung:**
- Navbar (`site-header.tsx`)
- Section header trang chu (`.section-header-bar` / `SectionHeaderBar`)
- Thanh footer **«Bạn cần hỗ trợ?»** (`.soft-3d-navy`)

**Cong thuc:**
- **Nen radial navy:** `#0a5678 → #073b5c → #052d47 → #041f32` (ellipse tu goc tren-trai)
- **Bong mem:** shadow ngoai offset + blur; inset highlight top + inset dark day
- **Highlight:** overlay radial trang nhe canh tren (`.section-header-bar__highlight` / `.soft-3d-navy__highlight`)
- **Radius:** ~22px (squircle panel)
- **Squircle icon:** `.soft-3d-squircle` — border white/15, nen white/10, inset highlight
  - Section: 1 icon theo chu de (sparkles / briefcase / chart…)
  - Support bar: headset lon + 4 kenh (phone, message, Zalo, mail)

**Token CSS:** `apps/web/src/index.css` — component: `apps/web/src/components/home/section-header-bar.tsx`

## Shapes

Form language mem vua phai: radius 8-16px cho controls va cards; bo goc lon (~22px) cho soft-3D chrome; pill cho chip/nav mobile.

## Components

### Buttons

- **Primary (`.btn-primary`):** teal nen trang, semibold, hover chuyen navy-deep + shadow.
- **Navy (`.btn-navy`):** tone trust cho action thu cap nhung van noi bat.
- **Outline Gold (`.btn-outline-gold`):** dung tren vung toi/decorative CTA.

### Cards / Containers

- **Surface Card (`.surface-card`):** border neutral + radius xl + shadow card.
- **Glass Card (`.glass-card`):** dung cho mot so booking detail panels co backdrop blur.

### Inputs

- **Field Input (`.field-input`):** border neutral, radius md, focus ring teal alpha.

## Do's and Don'ts

- Do giu trust hierarchy: navy cho authority, teal cho action, gold dung co dieu do.
- Do giu spacing/container theo 1396 framework de tranh vo chrome.
- Don't dung qua nhieu accent cung luc tren cung viewport.
- Don't pha vo token radius/spacing mau trong cac flow cot loi khi khong co ly do nghiep vu.
