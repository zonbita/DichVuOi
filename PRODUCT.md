# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Khach thue can dat dich vu da nganh nghe (online/offline) nhanh, ro gia, ro lich.
- Nguoi lam (partner/freelancer) muon mo ho so, nhan viec, quan ly don va uy tin tren cung tai khoan.
- Admin van hanh san: duyet doi tac, quan tri danh muc, xu ly khieu nai/tranh chap.

## Product Purpose

Dich Vu Oi la san ket noi 2 chieu customer-partner theo mo hinh freelancer marketplace tai Viet Nam. Mot tai khoan co the vua thue vua nhan viec; gia tri cot loi la ket noi dung nguoi, dung dich vu, dung thoi diem, co co che dat coc/giu tien de giam rui ro.

## Positioning

"Mot tai khoan, hai vai" cho thi truong dich vu Viet Nam: ket hop luong dich vu tai cho va dich vu so, voi catalog 3 tang va luong dat coc escrow ngay luc tao don.

## Operating Context

- Customer duyet `Group -> Category -> Service`, chon partner, dat lich, theo doi booking, thanh toan/danh gia.
- Partner bat ho so tren cung account, cai dat offering theo service, nhan va xu ly booking.
- Admin xu ly duyet, complaint, dispute, moderation, va governance noi bo.

## Capabilities and Constraints

- Co dual-role tren 1 account (`CUSTOMER`, `PARTNER`, `ADMIN`).
- Co escrow hold tien ngay khi tao don; hoa hong mac dinh theo booking sau khi hoan thanh.
- Catalog public uu tien service online; service offline duoc quan tri trong he thong.
- Rang buoc layout web theo container 1396 (`chrome-container`, `section-container`).
- Chua co cong thanh toan production day du (dang local-first + roadmap).

## Brand Commitments

- Thuong hieu dich vu dang tin cay, than thien, minh bach.
- Khong cam ket "bao dam tuyet doi" neu khong co quy trinh van hanh tuong ung.
- Ngon ngu va truyen thong giu tinh trung gian ket noi marketplace, khong dong nhat partner voi nhan vien.

## Evidence on Hand

- Mo ta domain, role, legal boundary, va quy trinh van hanh trong `README.md`.
- Token mau, typography, radius, container, component style trong `apps/web/src/index.css`.
- Cac page web va API hien huu cho booking/catalog/partner/admin trong monorepo.

## Product Principles

- Tin cay truoc: minh bach thong tin, trang thai, gia va rang buoc giao dich.
- Mot account, nhieu ngu canh su dung: chuyen doi vai tro ma khong tach danh tinh.
- Uu tien completion flow: tim nhanh, dat nhanh, xu ly don ro rang.
- Mo rong da nganh nhung van giu chat luong theo catalog co cau truc.

## Accessibility & Inclusion

- Web responsive cho desktop/tablet/mobile.
- Ton trong reduced-motion va tap trung kha nang doc/hieu tren giao dien dich vu.
