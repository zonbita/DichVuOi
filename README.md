# Dịch Vụ Ơi

## Tổng quan

**Dịch Vụ Ơi** là sàn kết nối hai phía — giống mô hình **freelancer marketplace** — cho dịch vụ đa ngành nghề tại Việt Nam.

| | |
|--|--|
| **Trạng thái** | **Production** — web + API triển khai (Vercel), DB PostgreSQL (Neon), escrow ví nội bộ + VietQR nạp |
| **Web** | Vite/React trên Vercel (`apps/web`) |
| **API** | NestJS trên Vercel (`apps/api`) + Prisma/Postgres |
| **Realtime** | Socket.IO — trên host hỗ trợ WS bền (local / VPS); Fluid/Vercel có hạn chế WS dài |

| Phía | Tên trong sản phẩm | Việc họ làm |
|------|--------------------|-------------|
| **Người làm** | Partner / Freelancer / Thợ | Mở hồ sơ người làm, nhận / thực hiện đơn, chào giá theo dịch vụ |
| **Khách thuê** | Customer / Khách | Duyệt danh mục, chọn dịch vụ / người làm, đặt lịch (thuê), thanh toán / đánh giá |

Elevator pitch: *Một tài khoản — vừa là khách thuê vừa là người làm khi muốn. Gọi là có người tới (hoặc online).*

### Một tài khoản, hai vai (kiểu Facebook)

Giống Facebook / Facebook Marketplace: **cùng một người** vừa là Khách thuê vừa có thể là Người làm — không tách hai loại tài khoản cứng.

```text
Đăng ký / Đăng nhập  →  1 User thật
        │
        ├─► Mode «Khách thuê» (dropdown header)
        │     /don-cua-toi · đặt lịch trên trang dịch vụ
        │
        └─► mode «Người làm» (dropdown header)
              lần đầu → form bật hồ sơ · sau đó /doi-tac nhận việc
```

- Đăng ký **một** tài khoản (email thật), không tách Customer vs Partner.
- Header có **dropdown chuyển vai**: Khách thuê ↔ Người làm (cùng session).
- Lần đầu chọn «Người làm» nếu chưa có hồ sơ → kích hoạt `PartnerProfile` trên account hiện tại.
- Schema `Role`: `CUSTOMER` mặc định; `PARTNER` khi đã bật nhận việc; `ADMIN` nội bộ. Thuê vẫn dùng được khi đang ở mode người làm.

Web dùng được trên desktop và **mobile responsive** (điện thoại, tablet).

Hai trục dịch vụ trong cùng sàn:

| Trục | Ví dụ | Đặc thù |
|------|--------|---------|
| Offline / tại chỗ | Dọn nhà, điện nước, chăm sóc | Địa chỉ, giờ hẹn, người làm đến nhà |
| Online / số | Gia sư, design, coaching game, code | Meeting/file — đúng kiểu thuê freelancer |

**Rủi ro chiến lược:** nếu mở hết ngành cùng lúc dễ thành “app gì cũng có nhưng không ngành nào sâu”. Launch nên hẹp theo MVP bên dưới.

## Mô hình khách thuê / người làm (freelancer-style)

```text
Cùng 1 User
  ├── Thuê: Tìm → chọn người / dịch vụ → đặt lịch → hoàn thành → đánh giá
  └── Nhận việc (khi đã mở hồ sơ): Nhận đơn mở hoặc nhận thuê trực tiếp → làm → hoàn thành
              ↕
         Sàn Dịch Vụ Ơi
         (catalog Group → Category → Service + PartnerService offerings)
```

- **Nhận việc / người làm** = cung ứng năng lực (thời gian, kỹ năng), không phải cho thuê tài sản cố định.
- **Thuê** = tạo booking; Người làm nhận / thực hiện — gần Upwork/Fiverr + thợ tại nhà.
- Catalog 3 tầng (`Group → Category → Service`) là **khung ngành**; mỗi Người làm gắn hồ sơ / giá riêng qua `PartnerService`.

### Kiếm tiền (bền vững)

| Nguồn | Khi nào | Ghi chú |
|--------|---------|---------|
| **Nạp ví (VietQR)** | Khách / người làm nạp VNĐ vào ví nội bộ | QR gắn **TK nhận của sàn** (BIN + STK + tên + số tiền + nội dung CK). Khách **quét app NH** → form CK thường tự điền — **không** nhập STK sàn thủ công. |
| **Đặt cọc giữ chỗ (escrow)** | **Bắt buộc ngay khi tạo đơn** | Backend tự giam toàn bộ `totalPrice` từ ví (`HELD`). Ví thiếu tiền → **không tạo đơn**. Chưa `HELD` → không vào hàng chờ, không chat, không lộ địa chỉ/SĐT cho partner. |
| **Hoa hồng theo đơn** | Khi `COMPLETED` → `RELEASED` | Mặc định **15%** (`commissionBps=1500`); phần còn lại `partnerPayout`. |

- Không bán SĐT / “phí xem thông tin” tách rời — lộ liên hệ gắn **đơn đã cọc**.
- **Giống sàn freelancer lớn (Upwork/Fiverr/vLance):** lúc **nạp / trả** không lấy STK ngân hàng cá nhân của khách; lúc **rút / payout người làm** mới cần NH đã liên kết.
- Cổng ví/thẻ (MoMo/VNPay…) và **webhook tự cộng ví** (SePay/Casso/VA) là bước cứng hóa production tiếp — xem [Ví, VietQR & định danh](#ví-vietqr--định-danh-production).
- Hủy khi đang `HELD` → `REFUNDED` (chính sách phí hủy chi tiết có thể siết sau).

## Mô hình pháp lý & trách nhiệm (marketplace)

**Lựa chọn vận hành:** Dich Vụ Ơi là **sàn kết nối** (marketplace), **không** tuyển dụng / trả lương / điều hành người làm như nhân viên.

| Bên | Vai trò | Trách nhiệm chính |
|-----|---------|-------------------|
| **Khách thuê (A)** | Khách | Đặt lịch (tự giam cọc từ ví), nhận dịch vụ, đánh giá / khiếu nại theo quy trình |
| **Người làm (B)** | **Đối tác độc lập** | Thực hiện dịch vụ; chịu trách nhiệm dân sự / hình sự nếu gây thiệt hại (ví dụ chiếm đoạt tài sản) |
| **Sàn Dich Vụ Ơi** | Trung gian | Catalog, kết nối, escrow, chat in-app, rating, hỗ trợ khiếu nại, hợp tác cơ quan có thẩm quyền khi được yêu cầu hợp pháp |

### Ranh giới rõ (tránh “Case 2 / Case 3”)

- **Không** quảng cáo kiểu *«100% thợ uy tín»*, *«đảm bảo tuyệt đối»*, *«đã xác minh lý lịch đầy đủ»* nếu chưa vận hành quy trình xác minh tương ứng.
- Badge **Đã xác thực** / `isVerified` = xác minh vận hành của sàn (hồ sơ / giấy tờ khi triển khai), **không** đồng nghĩa bảo lãnh mọi hành vi của đối tác.
- Người làm **không** là nhân viên công ty vận hành sàn — trừ khi sau này có hợp đồng lao động riêng (đổi mô hình).

### Nếu đối tác gây thiệt hại cho khách

Trong mô hình marketplace độc lập (tương tự Grab / Upwork / Fiverr khi ToS rõ):

1. Người gây hại chịu trách nhiệm hình sự / dân sự trực tiếp.
2. Sàn thường **không** bị truy cứu hình sự chỉ vì kết nối — nếu không biết trước ý định phạm tội và không bao che.
3. Sàn vẫn có thể phải: **hợp tác điều tra**, cung cấp lịch sử tài khoản / giao dịch / chat đơn (trong phạm vi pháp luật), xử lý khiếu nại theo chính sách.

**Case nguy hiểm cần tránh:** biết có tố cáo lừa đảo / chiếm đoạt mà vẫn cho nhận đơn, hoặc bao che / chia tiền — có thể bị xem xét trách nhiệm tùy hành vi.

### Biện pháp giảm rủi ro (đã có / roadmap)

Không miễn mọi trách nhiệm; giúp chứng minh sàn đã **quản lý rủi ro hợp lý**.

| Biện pháp | Trạng thái |
|-----------|------------|
| Điều khoản / chính sách phân định trách nhiệm các bên | **Có** — trang `/dieu-khoan`, `/chinh-sach-doi-tac`, khiếu nại / hoàn tiền |
| Escrow giữ tiền trên sàn + lịch sử đơn / thanh toán | **Có** — ví nội bộ + VietQR nạp; tự giam cọc khi tạo đơn |
| Xác minh SĐT (OTP key / eSMS Brandname) | **Có** — mock dev; production bật `SMS_PROVIDER=esms` |
| Xác minh **email** trước khi rút ví | **Có** — bắt buộc `emailVerified` (OTP Gmail); Google → verified; liên kết STK tuỳ chọn (`bankVerified` khóa đúng TK) |
| Liên kết NH **người làm** (payout) | **Có** — `PartnerProfile` bank + VietQR xác minh mock; đồng bộ `User.bankVerified` |
| Chat in-app + lọc PII; che SĐT public | **Có** |
| Đánh giá sau `COMPLETED`; badge verified admin | **Có** (verified = duyệt vận hành) |
| Admin khóa / xử lý đơn, flagged PII, hàng đợi duyệt partner | **Có một phần** |
| Chat hỗ trợ kỹ thuật (MODERATOR) | **Có** — `/admin/support` |
| Xác minh CCCD / giấy tờ đối tác | **Roadmap** |
| Webhook ngân hàng tự cộng ví / Virtual Account | **Roadmap** (SePay/Casso…) |
| Khóa / tạm ngưng nhận việc khi khiếu nại nghiêm trọng (workflow) | **Có một phần** — tự `acceptingJobs=false` khi uy tín &lt; 500 |
| Module khiếu nại formal + trừ điểm uy tín năm | **Có** — `Complaint`, `PartnerReputationPeriod`, Admin `/admin/complaints` |
| Module dispute formal + quỹ bồi thường / bảo hiểm trách nhiệm | **Roadmap** — tăng niềm tin, không bắt buộc lúc MVP |

### Hợp tác cơ quan có thẩm quyền (định danh & giao dịch)

> **Không phải tư vấn pháp lý.** Production thương mại nên rà với luật sư / compliance TMĐT VN.

Khi có **yêu cầu hợp pháp**, sàn cung cấp dữ liệu **đã thu thập hợp lệ**, ví dụ:

| Nhóm | Nguồn trong hệ thống |
|------|----------------------|
| Định danh tài khoản | Email, họ tên, SĐT (và trạng thái `phoneVerified` nếu đã OTP) |
| Vai trò / hồ sơ | `Role`, `PartnerProfile`, badge admin `isVerified` |
| Giao dịch sàn | Đơn (`Booking`), escrow, hóa đơn, `WalletTransaction` |
| Chứng từ nạp ví | Intent VietQR / nội dung CK (`DVO…`), số tiền, thời điểm; sao kê **TK nhận của sàn** |
| Chat / hỗ trợ | `BookingMessage`, thread support (trong phạm vi luật cho phép) |

**Không có mặc định:** STK ngân hàng **cá nhân của khách lúc nạp** — VietQR/cổng nhận tiền **không trả** thông tin đó (privacy + thiết kế QR = TK người nhận). Giống các sàn freelancer khác: nạp/trả ≠ thu STK khách; **rút tiền người làm** mới gắn NH đã liên kết.

Cần truy sâu lệnh chuyển phía người gửi → thường qua **ngân hàng / trung gian thanh toán**, không chỉ từ website.

### Nghĩa vụ vận hành sàn TMĐT dịch vụ (VN) — checklist production

Khi vận hành production tại Việt Nam:

1. **Đăng ký / thông báo** hoạt động sàn giao dịch thương mại điện tử với cơ quan quản lý theo quy định hiện hành.
2. **Điều khoản sử dụng + chính sách bảo mật** công khai, dễ tìm (đã có trang tĩnh; rà pháp lý trước/scale thương mại).
3. **Quy trình khiếu nại / giải quyết tranh chấp** có thời hạn phản hồi (trang hướng dẫn + kênh hỗ trợ; module dispute sau).
4. **Lưu trữ thông tin** giao dịch, định danh tài khoản, log cần thiết trong thời hạn luật yêu cầu (Postgres + backup prod).
5. **Hợp tác cung cấp thông tin** khi có yêu cầu hợp pháp từ cơ quan có thẩm quyền (bảng trên).
6. Không đưa ra **cam kết bảo đảm an toàn tuyệt đối** nếu chưa có biện pháp xác minh / bảo hiểm tương ứng.
7. Bật **eSMS / Brandname** cho OTP SĐT; cấu hình `VIETQR_*` đúng TK doanh nghiệp nhận tiền; `JWT_SECRET` và secret intent riêng production.

> Tài liệu này **không phải tư vấn pháp lý**. Trước / khi scale thương mại, nên rà với luật sư / đơn vị tư vấn TMĐT.

## Ví, VietQR & định danh (production)

Luồng tiền nội bộ: **nạp ví → giam escrow khi tạo đơn → giải ngân / hoàn**.

### Nạp VNĐ bằng VietQR (đã có)

```text
User đăng nhập → chọn/nhập số tiền (≥ 20.000)
  → POST /api/wallet/top-up/vietqr/intent
  → QR (img.vietqr.io) = TK sàn + số tiền + nội dung CK (DVO + intent)
  → Khách quét app ngân hàng → form CK tự điền
  → Web hiện bankId / STK sàn / nội dung chỉ để đối chiếu (không phải form nhập NH khách)
```

| Trường API lúc tạo QR | Ý nghĩa |
|----------------------|----------|
| `bankId`, `accountNo`, `accountName` | **TK nhận của sàn** (`VIETQR_BANK_ID` / `ACCOUNT_NO` / `ACCOUNT_NAME`) |
| `transferNote` | Mã đối soát gắn user đã login (`intentId` ký HMAC) |
| `qrImageUrl` | Ảnh VietQR để quét |

- **Có:** biết **user sàn nào** đang nạp (session + `intentId` chứa `userId`).
- **Không có từ QR:** STK / tên NH **cá nhân của khách** — cổng/NH không cung cấp mặc định (privacy + chuẩn VietQR mô tả người nhận).
- Sau khi tạo QR, `GET …/vietqr/:id` và `POST …/mock-confirm` **không** trả lại thông tin NH (chỉ status / số dư). Dev: nút **«Tôi đã chuyển khoản (mock)»** cộng ví; production nên thay bằng **webhook** (SePay/Casso…) hoặc VA.

### Vì sao không có STK khách lúc nạp?

1. QR chuẩn chỉ mang thông tin **người nhận** (sàn).  
2. Dữ liệu NH cá nhân nhạy cảm — merchant không cần để nhận tiền.  
3. Sao kê đối ứng (nếu có) chỉ qua intermediary / NH, **không đủ mọi bank**.  
4. Cùng mô hình Upwork / Fiverr / vLance: nạp–trả không = thu STK khách; **rút** mới cần NH người nhận.

### SĐT vs ngân hàng

| | SĐT | NH lúc nạp | NH người làm |
|--|-----|------------|--------------|
| Lấy thế nào? | User khai + OTP (eSMS / mock key `TenUser-XXXXXX`) | Không lấy từ VietQR | User/partner khai + xác minh VietQR mock |
| Mục đích | Định danh, liên hệ, hỗ trợ pháp lý cơ bản | — | Payout / hoàn phía partner |
| API | `POST /api/auth/verify-phone/*` | `…/wallet/top-up/vietqr/*` | `POST /api/partners/me/verify-bank/*` |

### Roadmap cứng hóa tiền vào

| Hạng mục | Mục tiêu |
|----------|----------|
| Webhook SePay/Casso | Tự `PAID` + cộng ví theo nội dung CK / mã đơn |
| Virtual Account (VA) | Mỗi user một số TK ảo → biết **ai nạp** chắc hơn (vẫn không phải STK cá nhân họ) |
| Form / KYC NH khách | Chỉ nếu sản phẩm cần hoàn về đúng TK khách (khác mục “biết ai nạp”) |
| MoMo / VNPay | Kênh nạp bổ sung |

Env liên quan: `VIETQR_*`, `VIETQR_INTENT_SECRET`, `SMS_PROVIDER` / `ESMS_*` — xem `apps/api/.env.example`.

## Personas

| Vai trò | Ai | Mục tiêu chính |
|---------|-----|----------------|
| **User / Khách thuê** | Cá nhân, hộ, SME cần thuê | **Chỉ đặt / thuê** — có thể thuê **nhiều nghề** (Service) trên nhiều nhóm; bản thân **không phải** ngành nghề trên sàn |
| **Người làm** (khi đã bật hồ sơ) | Thợ / freelancer trên cùng account | Là bên **cung ứng nghề** — gắn một hoặc nhiều `PartnerService`; hiện trong danh sách người làm |
| **Admin** | Nội bộ | Duyệt hồ sơ, catalog, tranh chấp, khiếu nại |

### User được / không được gì

| | |
|--|--|
| **Được** | Duyệt catalog → chọn **nghề cụ thể** (Service) → chọn người làm → đặt lịch. Một user thuê được **nhiều nghề** khác nhau (nhiều đơn / nhiều lần). |
| **Không được** | Không phải “ngành nghề” (Group) và không đặt cả **nhóm bao quát** như một SKU. Group chỉ để điều hướng. User thuần túy cũng **không hiện** trong lưới người làm nghề — trừ khi tự bật «Người làm» (tạo `PartnerProfile`). |

`Role` kỹ thuật: `CUSTOMER` (mặc định, phía thuê) → nâng `PARTNER` khi bật nhận việc; không tạo account thứ hai.

- Đã có: thuê + danh sách Người làm theo dịch vụ; nhận việc; dual-role (bật nhận việc trên cùng account — tùy chọn, không bắt buộc).
- Hồ sơ người làm (UI dashboard): **SĐT, địa chỉ, nghề, giới thiệu kỹ năng** + trang công khai `/user/:userId`; ẩn SĐT/email public.
- **Chọn nhiều nghề** trên Hồ sơ người làm: UI tags kiểu UE5 (`ProfessionTagsInput`) → đồng bộ `PartnerService` qua `PUT /api/partners/me/offerings` (`serviceIds[]`, tối đa 40). Gắn lúc bật nhận việc hoặc khi sửa hồ sơ `/doi-tac`.

## Danh mục — cấu trúc 3 tầng

```text
Nhóm bao quát (Group)     ← điều hướng trang chủ / mega menu
  └── Danh mục (Category) ← cột trong panel hover
        └── Dịch vụ (Service) ← SKU đặt được, có giá
```

- **Group** chỉ để phân loại và điều hướng — **không** phải gói combo, **không** đặt được.
- **Service (nghề)** mới là SKU User đặt được — một user có thể đặt **nhiều nghề** theo thời gian; mỗi đơn gắn một nghề + một Người làm.
- **Combo / Package** (mua nhiều dịch vụ một đơn) là entity riêng sau này, không nhét vào Group.
- Trang chủ hiện **tất cả nhóm ngành nghề** (`GET /api/groups`); `isFeatured` vẫn dùng để gắn nhãn hot / ưu tiên admin nếu cần.
- Catalog công khai (trang chủ, `/nhom`, menu nhóm, chi tiết dịch vụ) **chỉ hiện nghề online** (`Service.supportsOnline=true`). Nghề offline vẫn nằm trong DB/admin để quản trị; không lộ ra marketplace.

### Cache catalog (giảm tải + offline nhẹ)

Catalog ít đổi — cache **hai tầng** (FE + BE). Không thay Redis production; đủ cho MVP local / traffic vừa.

| Tầng | Cơ chế | TTL / hành vi |
|------|--------|----------------|
| **Web** | TanStack Query (`catalogQueries`) + `localStorage` key `dichvuoi_catalog_cache_v1` | Hiện bản đã lưu trước → rồi refetch API (timeout ~4s). API lỗi mà còn cache → vẫn hiện nhóm/dịch vụ + banner «đang dùng danh mục đã lưu». `staleTime` 5 phút; tắt refetch on focus/reconnect. |
| **API** | In-memory Map trong `CatalogService` | TTL **60s** cho `GET /groups`, `/groups/:slug`, `/services`, `/services/:slug`. **Không** cache `…/partners` (thợ đổi thường). Admin tạo/sửa dịch vụ hoặc nhóm → `invalidateCache()`. |
| **HTTP** | `CatalogHttpCacheInterceptor` | `Cache-Control: public, max-age=60, stale-while-revalidate=300` + `ETag`; `If-None-Match` khớp → **304**. |

File chính: `apps/web/src/lib/catalog-cache.ts`, `catalog-queries.ts`; `apps/api/src/modules/catalog/catalog.service.ts`, `catalog-http-cache.interceptor.ts`.

### Menu điều hướng (mega menu)

- Desktop: hover **Nhóm dịch vụ** → panel cây `Nhóm → Danh mục → Dịch vụ`.
- Mobile: nút / drawer mở cùng cây; chạm mũi tên để xổ danh mục.
- **Không hiện giá** trong panel hover / menu cây — giá chỉ hiện ở thẻ dịch vụ, trang chi tiết và khi đặt lịch.
- Giá catalog trên web là **giá tham khảo = khoảng giá thị trường** (`priceMin`–`priceMax`, nhãn «Giá tham khảo»); giá chào từng partner và `totalPrice` trên đơn là số tiền giao dịch.
- API tree: `GET /api/groups?tree=true`.

## Nhóm dịch vụ bao quát (tầm nhìn catalog)

22 nhóm là **tầm nhìn dài hạn**. Catalog công khai **chỉ hiện nghề `supportsOnline=true`** (menu ~13 nhóm online/hybrid). Nghề offline-only vẫn seed/admin nhưng ẩn khỏi trang chủ / `/nhom` / mega menu.

| Nhóm bao quát | Ví dụ nghề / dịch vụ bên trong | Ghi chú |
|---------------|--------------------------------|---------|
| **Nhà cửa - không gian sống** | *(ẩn)* Dọn nhà, giúp việc, tổng vệ sinh, sofa/rèm, khử khuẩn, diệt côn trùng… | Offline-only |
| **Sửa chữa - kỹ thuật** | *(ẩn)* Điện nước, điện lạnh, camera/mạng tại chỗ, sơn chống thấm… | Offline-only |
| **Xây dựng - hoàn thiện** | *(ẩn)* Thợ hồ, ốp lát, thạch cao, nội thất… | Offline-only |
| **Chăm sóc - sức khỏe** | *(ẩn)* Chăm già, bảo mẫu, massage/spa tại nhà… | Offline-only |
| **Làm đẹp** | *(ẩn)* Makeup, nail, tóc tại nhà… | Offline-only |
| **Bếp - đời sống** | *(ẩn)* Nấu ăn, đi chợ, giặt ủi tại chỗ… | Offline-only |
| **Xe - vận chuyển** | *(ẩn)* Rửa xe, tài xế, chuyển nhà… | Offline-only |
| **Học tập - ngoại ngữ** | **Gia sư:** Toán, Lý, Hóa, Sinh, Văn, Sử, Địa, Tin · **Ngoại ngữ:** Anh, Nhật, Hàn, Trung, Đức, Pháp, Tây Ban Nha, Việt cho NN · **Luyện thi:** IELTS, TOEIC, TOEFL, SAT, GRE, GMAT, JLPT, TOPIK, HSK, VSTEP, ĐH | Online / hybrid |
| **Game - eSports** | Coaching, Game Tester, dạy/lập trình/đồ họa game, edit highlight, overlay, thumbnail, cộng đồng, Caster, tổ chức giải, dịch game, VO · *(ẩn)* setup PC | Online; cấm boosting |
| **Lập trình - công nghệ** | Frontend / Backend / Fullstack / Mobile / DevOps / QA / Game Dev, WordPress, SEO kỹ thuật, hỗ trợ máy từ xa, MVP · **AI Engineer, Prompt, AI Automation, Chatbot, Consultant** · Excel · *(ẩn)* cài mạng VP | MVP số + Top IT |
| **Thiết kế - sáng tạo nội dung** | UI/UX, Graphic, Illustrator, 3D, Interior (online), Retoucher · Video / Motion / Audio / Podcast / AI Video · Content / Copy / Technical / Ghostwriter / Biên tập / AI Content | MVP số + creative |
| **Sự kiện - truyền thông** | Webinar, MC online, hỗ trợ họp, **Livestream Operator từ xa** · *(ẩn)* chụp/quay tại chỗ, trang trí, ban nhạc | Một phần online |
| **Thú cưng** | *(ẩn)* Tắm cắt, dắt chó, trông pet… | Offline-only |
| **Thể thao - PT** | PT / yoga / coach chạy **online**, giáo án · *(ẩn)* PT gym, bơi, pickleball tại chỗ | Hybrid |
| **Doanh nghiệp - văn phòng** | CSKH từ xa, tuyển dụng, quy trình, đào tạo NV online, kế toán hộ KD · *(ẩn)* dọn VP, lễ tân, tea-break | Hybrid |
| **Tài chính – hành chính – pháp lý hỗ trợ** | Báo cáo TC, **tư vấn thuế / luật sư / HR online** (có phép) · *(ẩn)* runner công chứng | Compliance |
| **Sân vườn - ngoài trời** | *(ẩn)* Cắt cỏ, tiểu cảnh, hồ cá… | Offline-only |
| **Marketing - bán hàng online** | **SEO Specialist**, Facebook/Google/TikTok Ads, email/affiliate, Social Media Manager, **Shopee / TikTok Shop / Lazada Operator**, inbox, product listing | Online 100% |
| **Dịch thuật - ngôn ngữ** | Dịch Anh/Trung/Nhật/Hàn – Việt, hiệu đính, phiên dịch online, phụ đề, gỡ băng, chuẩn hóa CV | Online 100% |
| **Trợ lý từ xa - vận hành** | **VA**, Appointment Setter, Live Chat, **Data Entry**, Excel/PPT, Research, Project Coordinator, **Sales Online / Telesales / Lead Gen** · *(ẩn)* nộp hồ sơ tại chỗ | Online (+ runner ẩn) |
| **Tư vấn - phát triển cá nhân** | Hướng nghiệp, **Career Coach**, phỏng vấn, CV–LinkedIn, dinh dưỡng / tham vấn tâm lý online (chứng chỉ) | Online — compliance y tế |
| **Giải trí** | Hát live, ảo thuật/DJ/MC online, RPG/board/cờ, quiz, kể chuyện, xem phim đồng hành | Online 100% — không người lớn / cày thuê |

## Hệ thống giao diện (UI)

Giao diện công khai theo hướng **sàn dịch vụ đáng tin cậy**: navy / teal / gold trên nền canvas sáng, card bo tròn, shadow nhẹ. Token nằm tại `apps/web/src/index.css` (`:root`).

### Màu hệ thống (chrome UI)

| Token CSS | Hex | Vai trò |
|-----------|-----|---------|
| `--color-navy` | `#073B5C` | Header full-bleed, tiêu đề section, chữ đậm trên nền sáng |
| `--color-navy-deep` | `#052D47` | Hover header / nút navy, nền badge cấp partner |
| `--color-brand` | `#009C95` | CTA chính (`.btn-primary`), link accent, viền tab active |
| `--color-brand-soft` | `#E8F7F5` | Nền chip marquee, tab active, `.icon-tile` (trust strip) |
| `--color-gold` | `#D9A441` | Badge cấp ★, viền nút «Đơn thuê» trên header navy |
| `--color-ink` | `#18313F` | Body text |
| `--color-muted` | `#6B7D87` | Phụ đề, label phụ |
| `--color-line` | `#E2E9EC` | Viền card, divider |
| `--color-canvas` | `#F7F9FA` | Nền trang |
| `--color-card` | `#FFFFFF` | Nền card |
| `--color-sale` | `#B42318` | **Giá**, số tiền đơn — không đổi theo ngành |

Shadow: `--shadow-card` = `0 6px 24px rgba(7,59,92,0.08)` · `--shadow-hover` khi hover card/nút.

### Typography & layout

- Font: **Be Vietnam Pro** (primary) + **Inter** fallback — khai báo trong `index.html` + `:root`.
- Base 16px, `-webkit-font-smoothing: antialiased`.
- Container công khai: **1280px** — `.page-container` / `.chrome-container` / `.section-container` (token `--container-page`).
- Dashboard khách thuê & người làm (`UserDashboardLayout`): sidebar + nội dung, kế thừa token (admin shell dùng cùng canvas/line).

### Component classes

| Class | Mô tả |
|-------|--------|
| `.surface-card` | Card trắng, viền `--color-line`, radius `--radius-xl` (16px), shadow card |
| `.btn-primary` | Teal → hover `--color-navy-deep` |
| `.btn-navy` | Nút navy solid |
| `.btn-outline-gold` | Viền gold trên nền header tối |
| `.icon-tile` | Ô icon trust strip: nền mint + icon teal (**không** dùng cho icon catalog ngành) |
| `.section-header-bar` | Khối tiêu đề section bo `--radius-lg` |
| `.field-input` | Input bo `--radius-md`, focus ring teal |

Radius token: `--radius-sm` 8px · `--radius-md` 12px · `--radius-lg` 14px · `--radius-xl` 16px.

### Sidebar dashboard — icon tile (tham chiếu inventory UI)

Tham chiếu style **ô item tối + icon màu** (grid inventory game / FiveM): icon đứng riêng trên nền tile, chữ label rõ, badge số góc phải.

**Mockup tham chiếu:** `assets/dichvuoi-inventory-tile-style-reference.png` (sinh trong repo để team bám layout).

| Thuộc tính | Giá trị / quy ước |
|------------|-------------------|
| Nền tile | `#0A0E14` – `#121820` (charcoal navy), hoặc nền trắng sidebar hiện tại + viền tile |
| Viền tile | `1px` cyan/teal mờ `rgba(0, 156, 149, 0.25)`; active = glow `--color-brand` |
| Bo góc | `8px` (`--radius-sm`) |
| Icon | **Màu riêng từng mục** (không monochrome) — stroke `currentColor`, kích thước `18px` |
| Label | Sans-serif, `600`, uppercase tùy ngữ cảnh; dashboard dùng title case tiếng Việt |
| Badge số | Góc phải trên, nền amber `--color-gold` / `admin-badge-amber` |
| Hover | Nền `--admin-bg` hoặc lift shadow nhẹ; icon **giữ màu** |

**Màu icon sidebar khách thuê** (`user-dashboard-layout.tsx`):

| Mục | Màu |
|-----|-----|
| Đơn thuê | `--color-brand` (teal) |
| Thuê dịch vụ | `--color-gold` |
| Ví VNĐ | `emerald-600` |
| Hóa đơn | `--color-navy` |
| Trợ giúp | `sky-600` |
| Khiếu nại | `amber-600` |
| Sang Nhận việc | `--color-navy` |

**Không áp dụng** style inventory cho catalog ngành nghề (mega menu vẫn dùng [Bảng màu ngành nghề](#bảng-màu-ngành-nghề)).

### Header & trang chủ

- Header navy (`site-header.tsx`): logo trái · search giữa · tài khoản phải; dropdown khu vực / nhóm dịch vụ dùng prop `onDark`.
- Hero banner + benefit cards + chip marquee dịch vụ (`service-tag-nav`) — nền/viền theo token hệ thống.
- Tab «Dịch vụ nổi bật» trên home: active mint/teal (UI chung), **không** recolor theo ngành.
- **Card việc mới** (`OpenJobCard`): hàng đầu **Hạn ứng tuyển** (trái) + giá ví (phải) → hàng nội dung ảnh trái | tiêu đề + khách + pill meta **ngang** (lịch · thời lượng · ứng viên, cách bằng dấu ·) → footer trạng thái + CTA `rounded-full`. 8 việc / trang.
- **Pill meta** (`JobMetaPill` / `ScheduleTimePill`): capsule viền mỏng màu theo loại — lịch hẹn xanh dương, thời lượng sky, ứng viên xanh lá, hạn ứng tuyển đỏ. Dùng chung home + danh sách đơn realtime người làm.

### Tách màu UI vs màu ngành (icon)

- **Chrome UI** (header, nút, card, tab, trust strip): luôn dùng token `:root` ở trên.
- **Icon & accent ngành** (mega menu, thẻ dịch vụ, sidebar catalog): giữ **màu riêng từng nhóm** qua `groupColor(slug).main` — **không** đổi icon catalog sang teal thương hiệu.
- Giá (`--color-sale`), CTA chính, trạng thái đơn: màu hệ thống, không theo ngành.
- Thanh uy tín partner: track hồng `#e91e8c`, fill gradient vàng→cam (ngoài palette navy/teal — nhận diện riêng).

## Bảng màu ngành nghề

Mỗi nhóm dịch vụ có **một màu nhận diện riêng** để phân biệt nhanh trên thẻ, menu và trang chi tiết.
Nguồn duy nhất: `apps/web/src/utils/catalog-colors.ts` — hàm `groupColor(slug)` trả về `{ main, soft, ink }`.

| Nhóm (slug) | `main` (nhấn) | `soft` (nền chip) | `ink` (chữ trên nền soft) |
|-------------|---------------|-------------------|---------------------------|
| Nhà cửa - không gian sống (`nha-cua`) | `#0f9d8a` | `#e6f6f3` | `#0a7a6b` |
| Sửa chữa - kỹ thuật (`sua-chua`) | `#2563eb` | `#e5edff` | `#1d4ed8` |
| Xây dựng - hoàn thiện (`xay-dung`) | `#b45309` | `#fdf0dc` | `#92400e` |
| Chăm sóc - sức khỏe (`cham-soc`) | `#e11d74` | `#fde7f1` | `#be1560` |
| Làm đẹp (`lam-dep`) | `#c026d3` | `#fbe8fe` | `#a21caf` |
| Bếp - đời sống (`bep-doi-song`) | `#ea580c` | `#ffeade` | `#c2410c` |
| Xe - vận chuyển (`xe`) | `#0e7490` | `#dff4f9` | `#155e75` |
| Học tập - ngoại ngữ (`hoc-tap`) | `#4f46e5` | `#e8e7fd` | `#4338ca` |
| Game - eSports (`game`) | `#7c3aed` | `#eee8fe` | `#6d28d9` |
| Lập trình - công nghệ (`lap-trinh`) | `#0284c7` | `#e0f2fe` | `#0369a1` |
| Thiết kế - sáng tạo nội dung (`thiet-ke`) | `#db2777` | `#fde8f1` | `#be185d` |
| Sự kiện - truyền thông (`su-kien`) | `#9333ea` | `#f2e9fe` | `#7e22ce` |
| Thú cưng (`thu-cung`) | `#d97706` | `#fef1d9` | `#b45309` |
| Thể thao - PT (`the-thao`) | `#16a34a` | `#e3f7e9` | `#15803d` |
| Doanh nghiệp - văn phòng (`doanh-nghiep`) | `#475569` | `#eaeef4` | `#334155` |
| Tài chính – hành chính – pháp lý (`tai-chinh`) | `#0f766e` | `#e0f2f0` | `#115e59` |
| Sân vườn - ngoài trời (`san-vuon`) | `#65a30d` | `#eef8dc` | `#4d7c0f` |
| Marketing - bán hàng online (`marketing-online`) | `#dc2626` | `#fee7e7` | `#b91c1c` |
| Dịch thuật - ngôn ngữ (`ngon-ngu`) | `#ca8a04` | `#fdf4d7` | `#a16207` |
| Trợ lý từ xa - vận hành (`tro-ly-tu-xa`) | `#78716c` | `#f1efed` | `#57534e` |
| Tư vấn - phát triển cá nhân (`tu-van-phat-trien`) | `#059669` | `#dff5ec` | `#047857` |
| Giải trí (`giai-tri`) | `#eab308` | `#fef9c3` | `#a16207` |

Slug lạ / thiếu màu → fallback `#0f9d8a` (chỉ cho **icon/viền ngành**, khác `--color-brand` `#009C95` của UI chrome).

### Quy tắc dùng màu

- `main`: viền nhấn (border-top thẻ dịch vụ, border-left thẻ nhóm), **icon nhóm** trong mega menu / marquee / catalog, gạch tiêu đề danh mục.
- `soft`: nền chip / badge (tên nhóm trên thẻ dịch vụ, link “← nhóm”, số danh mục), nền item nhóm đang chọn.
- `ink`: màu chữ khi đặt trên nền `soft` — luôn cặp `soft` + `ink`, không dùng `main` làm chữ trên nền `soft`.
- **Không** đổi màu giá (`--color-sale`), nút CTA chính (`.btn-primary`) hay trạng thái đơn theo ngành — các màu đó thuộc [hệ thống giao diện](#hệ-thống-giao-diện-ui).
- Màu ngành chỉ dùng ở tầng **Group**; Category và Service kế thừa màu của group cha, không tự định nghĩa màu riêng.

Nơi đang áp dụng **màu ngành** (icon / viền / chip nghề): `service-card.tsx`, `group-card.tsx`, `catalog-menu-shared.tsx`, `catalog-menu.tsx`, `service-tag-nav.tsx` (chỉ **icon**), `group-detail-page.tsx`, `group-detail-hero.tsx`, `service-detail-page.tsx` (accent nhóm), `groups-page.tsx`, `profession-tags-input.tsx`, `partner-profile-page.tsx` (chip nghề), `hire-service-form.tsx`, `hire-service-picker.tsx` (dropdown chọn nghề — `border-left` theo nhóm).

### Dropdown chọn nghề

Quy chuẩn cho dropdown chọn nghề (ví dụ `hire-service-picker.tsx`) phải giống mẫu UI hiện tại:

- Trigger là ô bo tròn kiểu `field-input`, full width, chữ canh trái, chevron bên phải.
- Placeholder dùng đúng format: `— Chọn nghề —`.
- Khi đã chọn nghề: trigger hiển thị `Tên nghề · Danh mục`; thêm `border-left` dày **4px** theo màu `groupColor(groupSlug).main`.
- Panel dropdown nền trắng, bo góc lớn, có viền mảnh và `shadow-card`; chiều cao tối đa khoảng `420px` hoặc `60vh`, phần danh sách phải `overflow-y-auto`.
- Dữ liệu hiển thị theo **nhóm ngành**; mỗi nhóm có tiêu đề riêng, chữ đậm, kèm `border-left` 4px theo màu ngành.
- Mỗi item nghề thụt vào so với tiêu đề nhóm; layout 1 dòng: **tên nghề** đậm + `· danh mục` màu muted.
- Hover item dùng nền `groupColor.soft`; item đang chọn giữ nền `soft` và chữ `groupColor.ink`.
- Không đưa icon/thẻ thừa trong item nghề; điểm nhấn màu chỉ nằm ở `border-left`, nền `soft`, và màu chữ của tiêu đề / item active.

## Tỉnh / thành (khu vực)

Dropdown khu vực trên ô tìm kiếm header (icon pin + tên + chevron) — chọn **một** trong **34 đơn vị hành chính cấp tỉnh** theo Nghị quyết 202/2025/QH15 (có hiệu lực từ 1/7/2025): **6 thành phố** + **28 tỉnh**.

- Nguồn duy nhất: `apps/web/src/data/provinces.ts` (`PROVINCES`, `filterProvinces`, `loadProvinceSlug` / `saveProvinceSlug`).
- UI: `apps/web/src/components/layout/location-picker.tsx` — mở dropdown → ô **tìm kiếm** (bỏ dấu: «ha noi» khớp «Hà Nội») → chọn → lưu `localStorage` key `dichvuoi.province`.
- Mặc định: **Hồ Chí Minh** (`ho-chi-minh`).
- Thành phố đánh dấu nhãn **TP** trong list; tỉnh không có nhãn phụ.

### 6 thành phố trực thuộc TW

| Tên | slug |
|-----|------|
| Hà Nội | `ha-noi` |
| Hải Phòng | `hai-phong` |
| Đà Nẵng | `da-nang` |
| Huế | `hue` |
| Cần Thơ | `can-tho` |
| Hồ Chí Minh | `ho-chi-minh` |

### 28 tỉnh

| Tên | slug | Tên | slug |
|-----|------|-----|------|
| An Giang | `an-giang` | Lào Cai | `lao-cai` |
| Bắc Ninh | `bac-ninh` | Nghệ An | `nghe-an` |
| Cà Mau | `ca-mau` | Ninh Bình | `ninh-binh` |
| Cao Bằng | `cao-bang` | Phú Thọ | `phu-tho` |
| Đắk Lắk | `dak-lak` | Quảng Ngãi | `quang-ngai` |
| Điện Biên | `dien-bien` | Quảng Ninh | `quang-ninh` |
| Đồng Nai | `dong-nai` | Quảng Trị | `quang-tri` |
| Đồng Tháp | `dong-thap` | Sơn La | `son-la` |
| Gia Lai | `gia-lai` | Tây Ninh | `tay-ninh` |
| Hà Tĩnh | `ha-tinh` | Thái Nguyên | `thai-nguyen` |
| Hưng Yên | `hung-yen` | Thanh Hóa | `thanh-hoa` |
| Khánh Hòa | `khanh-hoa` | Tuyên Quang | `tuyen-quang` |
| Lai Châu | `lai-chau` | Vĩnh Long | `vinh-long` |
| Lâm Đồng | `lam-dong` | | |
| Lạng Sơn | `lang-son` | | |

Lọc danh sách Người làm theo tỉnh (trang dịch vụ) và seed `PartnerProfile.city` nên dùng cùng tên `Province.name` trong bảng trên.

## Hồ sơ khách thuê / người làm

UI dashboard hiện **tối giản 4 mục**. Trang công khai `/user/:userId` vẫn hiện thông tin phục vụ quyết định thuê — không copy donate / newsfeed / album đời tư.

### Ba tầng thông tin

| Tầng | Nội dung | Mục đích |
|------|----------|----------|
| **Ai làm** (UI dashboard) | **SĐT** (từ tài khoản), **địa chỉ/khu vực** (`districts`), **nghề** (`serviceIds` / tags), **giới thiệu kỹ năng** (`bio`) | Sửa hồ sơ nhận việc |
| **Ai làm** (public `/user/:userId`) | tên, bio, cấp, verified, districts, offerings… | Tin cậy + phạm vi phục vụ |
| **Làm gì** (`PartnerService`) | giá, headline, KN, **includes** / **excludes** / **coverageNote** theo từng dịch vụ catalog | Chọn gói thuê cụ thể |
| **Thuê thế nào** (`Booking`) | lịch, địa chỉ (hoặc link họp), note | Hoàn tất đơn |

### Quy tắc riêng Dich Vụ Ơi

- **SĐT / email không công khai** trên tile, hover, `GET /api/services/:slug/partners`, `GET /api/partners/public/:userId`.
- **Lộ liên hệ theo giai đoạn đơn** (chống bỏ sàn) — xem [Chống bỏ sàn](#chống-bỏ-sàn-disintermediation): việc mở che SĐT + địa chỉ; khách **không bao giờ** thấy SĐT/email partner; partner chỉ thấy SĐT khách từ `IN_PROGRESS`; kênh chính là **chat đơn** (`BookingMessage`).
- Trang hồ sơ công khai: `/user/:userId` — CTA Thuê dẫn về `/dich-vu/:slug`.
- **Nhấp vào thẻ Người làm** (avatar / tên / giá trên lưới trang dịch vụ) → mở trang hồ sơ `/user/:userId`. Hover chỉ xem nhanh; nút **Thuê** riêng để chọn người đặt lịch (không chuyển trang).
- Dashboard `/doi-tac` hiện rút gọn form hồ sơ còn 4 mục chính: **SĐT** (sửa được), **địa chỉ/khu vực phục vụ**, **nghề bạn làm** (tags), **giới thiệu kỹ năng**.
- **Không** đưa donate, feed MXH, cày thuê/boosting trái ToS vào hồ sơ.

### Schema (đã có)

`PartnerProfile`: `districts`, `bio` *(UI dashboard chỉ sửa các mục này + nghề qua offerings; field schema khác có thể còn trong DB)*  
`PartnerService`: `includes`, `excludes`, `coverageNote`  
`Booking`: `paymentStatus`, `commissionBps`, `commissionAmount`, `partnerPayout`, `paidAt` / `releasedAt` / `refundedAt`  
`Booking` (nghiệm thu %): `settlementPercent`, `settlementProposedBy`, `customerSettlementApprovedAt`, `partnerSettlementApprovedAt`, `settlementResolvedAt`  
`BookingMessage`: chat theo đơn (`body`, `redacted`)  
`Review`: đánh giá hai chiều (`rating`, `comment`, unique booking+fromUser)

### Retention — quan hệ & thuê lại (P0, đã có)

Lấy cảm hứng từ [Player Duo](https://playerduo.net/) về **giữ chân qua quan hệ cá nhân**, không copy feed/donate/truyện tranh.

| Tính năng | API / UI | Mục đích |
|-----------|----------|----------|
| **Lưu người làm quen** | `PartnerFavorite`; `GET/POST/DELETE /api/partners/favorites*`; nút trái tim trên `/user/:userId` | Gắn bó partner, quay lại không cần tìm lại |
| **Thuê lại nhanh** | `GET /api/bookings/rebook-hints`; section trang chủ + nút trên đơn `COMPLETED` | Một chạm → `/dich-vu/:slug?partner=:userId` |
| **Cá nhân hóa «Đề xuất»** | `rankFeaturedServices()` — ưu tiên nhóm/dịch vụ đã thuê, bỏ shuffle ngẫu nhiên | Trang chủ relevant hơn cho khách cũ |
| **Profile = landing thuê** | Giá từ `/giờ`, CTA «Đặt lịch ngay», deep-link `?partner=` | Giống trang idol Player Duo nhưng vẫn escrow |

**Không làm (non-goals retention):** newsfeed MXH, donate, bảng xếp hạng đại gia, chat public ngoài đơn.

### Uy tín partner — điểm năm & khiếu nại (P0, đã có)

Tách biệt với **cấp độ merit (1–100)** — uy tín đo **tuân thủ / khiếu nại**, không phải kinh nghiệm.

| Khái niệm | Giá trị / quy tắc |
|-----------|-------------------|
| **Điểm khởi đầu** | **1000** mỗi chu kỳ |
| **Chu kỳ** | Một năm kể từ **ngày tạo hồ sơ partner** (`PartnerProfile.createdAt`), không theo lịch 1/1 |
| **Reset** | Sang chu kỳ mới → tạo `PartnerReputationPeriod` mới với 1000 điểm (lazy khi đọc/ghi) |
| **Trừ điểm** | Chỉ khi Admin đặt khiếu nại `VERIFIED` (mặc định −100; preset −50 / −100 / −200) |
| **Sàn tự động** | Uy tín &lt; **500** → `acceptingJobs = false` (partner tạm không nhận việc mới) |
| **UI công khai** | Thanh progress trên `/user/:userId` — nền hồng, fill gradient vàng→cam = điểm còn lại |

**Schema:** `Complaint`, `PartnerReputationPeriod`, `ReputationLedgerEntry`  
**API:** `POST /api/bookings/:id/complaints` · `GET /api/complaints/mine` · `GET/PATCH /api/admin/complaints*` · `GET /api/partners/public/:userId` (kèm `reputation`)

#### Behavior tree — uy tín & khiếu nại

```mermaid
flowchart TD
  A[Partner có hồ sơ] --> B{Đọc uy tín chu kỳ hiện tại}
  B --> C[periodIndex = số năm từ PartnerProfile.createdAt]
  C --> D{Đã có PartnerReputationPeriod?}
  D -->|Không| E[Tạo period: startingPoints=1000, currentPoints=1000]
  D -->|Có| F[Dùng currentPoints hiện tại]
  E --> G[Hiển thị progress bar trên /user/:userId]
  F --> G

  H[Khách thuê trên đơn có partner] --> I[POST /bookings/:id/complaints]
  I --> J[Complaint status=SUBMITTED]
  J --> K[Admin /admin/complaints]

  K --> L{Quyết định}
  L -->|UNDER_REVIEW| M[Đang xử lý — chưa trừ điểm]
  L -->|REJECTED| N[Đóng — không trừ điểm]
  L -->|VERIFIED| O[Trừ deductionPoints khỏi currentPoints]
  O --> P[Ghi ReputationLedgerEntry delta âm]
  P --> Q{currentPoints < 500?}
  Q -->|Có| R[acceptingJobs = false]
  Q -->|Không| S[Giữ acceptingJobs]
  R --> T[UI profile cập nhật % uy tín]
  S --> T

  U[Đến ngày kỷ niệm năm mới] --> V[periodIndex +1]
  V --> E
```

**Luồng tóm tắt:**

1. **Khách** — Đơn của tôi → Chi tiết đơn → «Gửi khiếu nại» (hoặc email/hotline trang `/khieu-nai`).
2. **Admin** — `/admin/complaints` → Nhận xử lý → **Xác minh đúng & trừ điểm** hoặc Từ chối.
3. **Partner** — Thanh uy tín trên profile công khai; điểm không âm (floor 0).
4. **Khác cấp độ** — `level` (1–100) vẫn tính từ giờ làm, đánh giá, verified; **không** trộn với uy tín.

### Roadmap P1 / P2

- P1: gallery portfolio 3–6 ảnh; % đúng hạn từ booking `COMPLETED`; **push/PWA nhắc lịch định kỳ**
- P2: lịch trống (availability filter trên trang dịch vụ); intro video ngắn (ngành online); escrow thanh toán thật; đặt lịch định kỳ (dọn 2 tuần/lần, gia sư 3 buổi/tuần)

### Chưa làm (ghi chú) — không SEO / không mở rộng `/admin` trong vòng này

Các hạng mục sau **cố ý hoãn** (không implement cùng vòng xác minh rút tiền):

| Hạng mục | Ghi chú |
|---------|--------|
| **Push / PWA nhắc lịch** | Nhắc booking định kỳ trên thiết bị |
| **Gallery portfolio** (3–6 ảnh người làm) | Schema đã có `galleryJson`; UI upload/hiển thị còn thiếu |
| **Admin: ban chat** | Cảnh cáo / khóa chat / ban từ tin bị lọc PII |
| **Admin: audit log** | Nhật ký thao tác admin |
| **Admin: biểu đồ GMV** | Funnel / GMV theo thời gian, export CSV |
| SEO prerender/SSR catalog | SPA hiện tại; tách khỏi admin dashboard |

> Không làm SEO kèm dashboard `/admin` trong cùng đợt. Ưu tiên ops tiền thật (webhook nạp) + email/NH rút.

## Tìm kiếm không dấu + gần đúng

Tiện ích chung: `apps/web/src/utils/search.ts`.

- `normalizeText(s)`: bỏ dấu tiếng Việt + hạ chữ thường (`Sửa chữa` → `sua chua`, `Đà Nẵng` → `da nang`).
- `levenshtein(a, b)`: khoảng cách sửa để đo độ gần đúng.
- `fuzzyMatch(haystack, query)`: khớp khi (1) trùng chuỗi con sau bỏ dấu, hoặc (2) **mỗi từ khoá** khớp một từ trong text qua substring / Levenshtein trong ngưỡng theo độ dài (≤2:0, ≤4:1, ≤7:2, còn lại 3), hoặc (3) gõ tắt liền chuỗi (subsequence).

Ví dụ: `sua` → «Sửa chữa», `dien lanh` → «Điện lạnh», `giasu` → «Gia sư», `ha noi` → «Hà Nội», typo `sưat` vẫn khớp.

Nơi áp dụng:
- Trang `/nhom` (`groups-page.tsx`): tìm trên **cả cây** nhóm → danh mục → dịch vụ; trả 2 khối kết quả «Nhóm dịch vụ» + «Dịch vụ khớp».
- Dropdown tỉnh/thành (`location-picker.tsx` qua `filterProvinces`).
- Bộ lọc Người làm ở trang dịch vụ (tên / khu vực) — `service-detail-page.tsx`.

## Định hướng sản phẩm & MVP

Nên bắt đầu với một số nhóm nhu cầu cao thay vì mở toàn bộ 17 ngành.

### MVP dịch vụ truyền thống

1. Dọn dẹp nhà  
2. Vệ sinh và sửa chữa điện lạnh  
3. Sửa điện nước  
4. Gia sư  
5. Chăm sóc tại nhà  

### MVP nhóm số / sáng tạo

1. Sửa máy / cài đặt  
2. Thiết kế banner – logo  
3. Edit video ngắn  
4. Gia sư tin học / Excel  
5. Coaching game (**ưu tiên coaching, không boosting**)  
6. Lập trình freelance nhỏ (landing, bot, fix bug)  

### Nguyên tắc theo ngành

Mỗi ngành cần có: quy trình đặt lịch, cách tính giá, tiêu chuẩn đối tác, chính sách khiếu nại riêng.

**Game - eSports:** ưu tiên coaching, setup PC, edit stream, dạy làm game; nếu có cày thuê thì cần disclaimer + whitelist game cho phép.

**Tài chính / pháp lý hỗ trợ:** không mở free-for-all; chỉ đối tác đủ điều kiện / có phép khi pháp luật yêu cầu.

### Non-goals (chưa làm ở giai đoạn này)

- Matching tự động thông minh  
- Webhook bank / MoMo / VNPay tự cộng ví — hiện VietQR + **mock-confirm**; escrow ví nội bộ đã dùng production-path  
- Thu STK ngân hàng **cá nhân khách** chỉ vì nạp VietQR (không chuẩn ngành / không khả thi từ QR)  
- Geo quận-huyện sâu; gói combo (Package)  
- Partner tự đăng gói dịch vụ riêng (đang dùng catalog chung)  

## Booking (thuê dịch vụ)

Hai trục trạng thái song song: `BookingStatus` (tiến độ đơn) × `PaymentStatus` (escrow). Logic chính: `apps/api/src/modules/bookings/bookings.service.ts`; khiếu nại: `complaints.service.ts`.

### Behavior tree — hiện tại (as-is)

```text
CREATE (ví đủ `totalPrice` / `budgetMax`)
├─ Thuê mở (không partner)     → PENDING + HELD + matchingDeadlineAt (+7 ngày) + open queue
│    └─ partner.apply (cọc 10% ví) → BookingApplication APPLIED
│         └─ customer.selectApplicant → CONFIRMED + responseDeadlineAt (+4 giờ)
│              (+ hoàn cọc ứng viên khác; giữ cọc 10% người được chọn)
└─ Thuê thẳng (?partner=)      → CONFIRMED + HELD

CREATE (ví thiếu) → lỗi, **không lưu đơn**
*(Internally: tạo tạm `UNPAID` rồi `holdBooking`; fail → xóa đơn. `POST /bookings/:id/pay` chỉ legacy/admin.)*

Hết matchingDeadlineAt khi vẫn PENDING → CANCELLED + hoàn escrow khách + hoàn cọc ứng tuyển

CONFIRMED + HELD
├─ Partner → IN_PROGRESS                    [bắt buộc HELD; clear responseDeadlineAt]
├─ Hết responseDeadlineAt (chưa IN_PROGRESS)
│    → tịch thu cọc ứng tuyển (APPLY_FORFEIT)
│    → nếu còn hạn ghép: gỡ partner, về PENDING + open queue lại
│    → nếu hết hạn ghép: CANCELLED + hoàn escrow khách
├─ Partner hủy khi CONFIRMED → tịch thu cọc ứng tuyển + CANCELLED + hoàn escrow khách
└─ Customer/Admin hủy khi CONFIRMED → hoàn cọc ứng tuyển + CANCELLED + hoàn escrow

IN_PROGRESS
└─ Partner → AWAITING_CONFIRM               [confirmDeadlineAt = now+48h]

AWAITING_CONFIRM (escrow vẫn HELD)
├─ Customer đề xuất % nghiệm thu (1..100) + Partner đồng ý + Customer đồng ý
│    → COMPLETED + RELEASED theo % nghiệm thu (phần còn lại hoàn về ví khách)
├─ Customer confirmCompletion (legacy) = đề xuất 100% + đồng ý phía khách
├─ Hết 48h (lazy settle khi đọc/list đơn) → COMPLETED + RELEASED
├─ Gửi khiếu nại → DISPUTED
└─ Cancel: chỉ Admin

DISPUTED (escrow vẫn HELD) — admin resolve complaint
├─ REFUND            → CANCELLED + REFUNDED (+ trừ uy tín partner nếu VERIFIED)
├─ RELEASE           → COMPLETED + RELEASED
├─ RETRY_IN_PROGRESS → IN_PROGRESS
├─ RETRY_AWAITING    → AWAITING_CONFIRM (+48h mới)
└─ NONE              → giữ status + ghi note

COMPLETED / CANCELLED → terminal
```

Chuỗi rút gọn:

```text
PENDING → CONFIRMED → IN_PROGRESS → AWAITING_CONFIRM ─┬─→ COMPLETED
                                                      └─→ DISPUTED ─┬─→ COMPLETED / CANCELLED
                                                                    └─→ IN_PROGRESS / AWAITING_CONFIRM (retry)
         ↘ CANCELLED (sớm: PENDING/CONFIRMED; muộn: chỉ Admin)
```

Escrow / đặt cọc (`PaymentStatus`):

```text
(tạo đơn) → HELD (auto từ ví; fail → không lưu đơn)
           → RELEASED (khi COMPLETED)
           ↘ REFUNDED (khi CANCELLED / REFUND khiếu nại lúc đang HELD)
*(`UNPAID` chỉ tồn tại tạm / legacy; `POST /bookings/:id/pay` giữ cho admin/luồng cũ)*
```

**Ai bấm cạnh nào**

| Transition | Actor |
|---|---|
| `(create)→HELD` | Hệ thống khi tạo đơn (ví đủ); legacy `POST …/pay` / Admin |
| Partner apply (cọc 10%) | Partner `POST …/apply` (cần HELD, đơn PENDING mở) |
| `PENDING→CONFIRMED` | Customer `select` ứng viên (hoặc Admin); legacy `accept` = apply |
| SLA phản hồi (+4h) | Set `responseDeadlineAt` khi select; partner phải `IN_PROGRESS` trước hạn |
| Hết SLA / partner hủy lúc CONFIRMED | Tịch thu cọc (`APPLY_FORFEIT`); mở lại PENDING nếu còn hạn ghép |
| `CONFIRMED→IN_PROGRESS` | Partner (cần HELD; clear SLA) |
| `IN_PROGRESS→AWAITING_CONFIRM` | Partner |
| `AWAITING_CONFIRM→COMPLETED` | Hai bên đồng ý cùng % nghiệm thu (`settlement`) / Admin / auto 48h |
| `→DISPUTED` | Gửi khiếu nại (không PATCH status thường) |
| `PENDING/CONFIRMED→CANCELLED` | Customer hoặc Partner |
| Hủy từ `IN_PROGRESS` / `AWAITING_CONFIRM` / `DISPUTED` | Chỉ Admin |
| Resolve dispute | Admin |

**Bắt buộc đặt cọc khi thuê (as-is hiện tại)**

1. Customer đăng nhập → tạo đơn (`PENDING` chờ nhận, hoặc thuê thẳng → `CONFIRMED`).
2. Backend **giam cọc ngay trong cùng bước tạo đơn** theo `totalPrice` (đơn mở lấy theo `budgetMax` nếu có):
   - ví đủ tiền: đơn lưu với `HELD`;
   - ví không đủ: trả lỗi và rollback, **không tạo đơn**.
3. Chỉ đơn `HELD` mới:
   - xuất hiện trong `GET /bookings/open` (hàng chờ partner);
   - được `accept` / `apply` (nhận việc / ứng tuyển);
   - mở chat `GET|POST /bookings/:id/messages`;
   - lộ địa chỉ cho partner (sau `CONFIRMED`) theo `contact-privacy`.
4. Partner **chỉ `IN_PROGRESS` khi đã `HELD`**.
5. `COMPLETED` → giải ngân: `RELEASED`, trừ hoa hồng 15% (`commissionBps=1500`); recalculate cấp partner.
6. Review hai chiều sau `COMPLETED`: `POST /api/bookings/:id/reviews` (mỗi bên 1 lần).
7. Checklist `BookingRequirement`: seed khi có partner; khách xác nhận bàn giao; gate hoàn thành nếu còn mục chưa tích (trừ `acceptIncomplete`).

Xem hồ sơ / lưới người làm trên trang dịch vụ vẫn **miễn phí** — cọc chỉ khi tạo đơn thuê thành công (đã giam ví).

### Behavior tree — mục tiêu (to-be, product note)

Sơ đồ product (chưa implement đủ) — khác as-is ở chỗ **chủ chọn người** và **cọc người làm**:

```text
Đơn thuê
  • Thông tin thuê · danh sách yêu cầu · Money Min–Max
  • Thời gian đóng đơn (giờ→ngày) · thời hạn ví dụ 7 ngày
        ↓
Chủ đơn đặt cọc 100%
        ↓
Pending — thông báo người làm đúng nghề;
         người làm đăng ký → hiện trong list chủ đơn;
         chủ theo dõi trạng thái
        ├─ Người làm đặt cọc 10% → mới vào được danh sách
        └─ Có thể huỷ
        ↓
Chủ thuê chọn 1 người để làm
  ├─ Không → chọn người khác
  └─ Có → Đang làm (mở chat + hiện thông tin)
        ↓
Chủ check list việc đã làm
        ↓
Upload file / link / ảnh / video (dữ liệu từ người làm)
        ↓
Hoàn thành
  ├─ Nếu khiếu nại → Ban quản trị kiểm tra lại
  └─ Chủ phải đủ 100% tiền
       ├─ Làm đủ → OK
       └─ Làm thiếu → trừ điểm uy tín + giảm tiền đơn
        ↓
Thanh toán cho 2 bên + source sàn
```

**Gap as-is ↔ to-be**

| Ý to-be | As-is |
|---|---|
| Chủ cọc 100% | Có — **tự giam khi tạo đơn**; ví thiếu → không tạo đơn (`totalPrice` / đơn mở: `budgetMax`) |
| Pending + thông báo đúng nghề | Một phần — open queue; chưa push notify theo nghề |
| Người làm cọc 10% vào list | **Có** — `POST /bookings/:id/apply` (`APPLY_DEPOSIT`, 10% `totalPrice`) |
| Chủ chọn 1 trong list ứng viên | **Có** — `POST /bookings/:id/applications/:appId/select` → `CONFIRMED` |
| Chat + lộ thông tin khi đang làm | Có — sau `HELD` + có partner; lộ dần theo status |
| Checklist việc | Có — `BookingRequirement` |
| Upload đa media (file/ảnh/video) | Mỏng — `evidenceUrl` từng mục |
| Thời hạn đóng đơn 7 ngày | **Có** — `matchingDeadlineAt` (+7 ngày); lazy settle hủy + hoàn cọc |
| SLA phản hồi sau chọn (chống bỏ việc) | **Có** — `responseDeadlineAt` (+4 giờ); quá hạn / partner hủy lúc CONFIRMED → tịch thu cọc 10%, mở lại hàng chờ |
| Khiếu nại → admin | Có — `DISPUTED` + resolve |
| Làm thiếu → trừ uy tín + giảm tiền đơn | Một phần — trừ uy tín khi refund khiếu nại; chưa giảm payout theo % thiếu |
| Thanh toán 2 bên + source | Có mock — `RELEASED` + `commissionBps`; hoàn cọc ứng tuyển khi hoàn thành / khách hủy; tịch thu khi no-show SLA |

## Admin

- Seed: `admin@dichvuoi.vn` / `demo1234` (role `ADMIN`).
- Web: `/admin` — shell sidebar riêng (không dùng header/footer marketplace). Layout: Tổng quan · Đơn hàng · Dịch vụ · Đối tác · Khách hàng · Đánh giá · Khiếu nại.

### Màn hình `/admin`

Layout chung (`pages/admin/admin-layout.tsx`) chặn non-ADMIN, hiện nav + badge số việc tồn
(hồ sơ chờ duyệt, tin bị lọc). Mỗi tab là một route riêng — bookmark / share link được.

| Route | Làm gì |
|-------|--------|
| `/admin` | Tổng quan KPI + shortcut hàng đợi |
| `/admin/bookings` | Danh sách đơn — filter status / escrow / ngày |
| `/admin/bookings/:id` | **Chi tiết đơn kiểu ops**: header + actions, 3 cột (Các bên / Escrow / Timeline), chat bubble, đánh giá |
| `/admin/catalog` | CRUD dịch vụ + featured nhóm |
| `/admin/partners` | Hàng đợi duyệt hồ sơ |
| `/admin/users` | Khách hàng — đổi role |
| `/admin/reviews` | Đánh giá |
| `/admin/complaints` | Hàng đợi khiếu nại đơn — xác minh & trừ uy tín |
| `/admin/flagged` | Tin chat bị lọc PII |

Bộ lọc sống trong URL (`?q=&status=&page=`), đổi filter tự reset về trang 1.

### API `@Roles(ADMIN)` dưới `/api/admin/*`

| Endpoint | Ghi chú |
|----------|---------|
| `GET stats` | users, partners, **partnersPendingVerify**, đơn, GMV hoàn thành, escrow, hoa hồng, reviews, tin bị lọc |
| `GET users` | `?q&role&page&pageSize` |
| `PATCH users/:id` | đổi role |
| `GET partners` | `?q&verified&acceptingJobs&city&page&pageSize` — chưa verify lên đầu |
| `PATCH partners/:userId` | `isVerified` / `acceptingJobs` |
| `GET bookings` | `?q&status&paymentStatus&from&to&page&pageSize` |
| `GET bookings/:id` | chi tiết + messages (kèm `redacted`) + reviews |
| `PATCH bookings/:id` | force status / escrow / hoàn tiền |
| `GET reviews` | `?q&page&pageSize` |
| `GET messages/flagged` | `?q&page&pageSize` |
| `GET catalog` | cây `Group → Category` + đếm |
| `GET categories` | danh mục phẳng (đổ vào select khi tạo dịch vụ) |
| `GET services` | `?q&groupId&categoryId&isActive&page&pageSize` |
| `POST services` | tạo dịch vụ (slug tự sinh từ tên nếu bỏ trống, trùng slug → 409) |
| `PATCH services/:id` | sửa / bật / tắt |
| `PATCH groups/:id` | bật / tắt `isFeatured` |

Mọi endpoint list trả `{ items, total, page, pageSize, pageCount }` (mặc định 20/trang, tối đa 100).

### Chưa có (roadmap admin)

- ~~Module tranh chấp / khiếu nại riêng~~ → **đã có** `/admin/complaints` + trừ uy tín năm
- Hành động trên tin bị lọc (cảnh cáo / khóa chat / ban) và ẩn review giả — **hoãn** (xem *Chưa làm*)
- Audit log cho mọi thao tác admin; role nội bộ `SUPPORT` tách khỏi `ADMIN` — **hoãn**
- Biểu đồ GMV / funnel theo thời gian, export CSV — **hoãn**

## Chống bỏ sàn (disintermediation)

Mục tiêu thực tế (Upwork, Fiverr, Airbnb, TaskRabbit): **không chặn 100%**, mà làm việc ngoài sàn rủi ro hơn / kém lợi hơn, trì hoãn lộ danh tính liên hệ, và giữ giá trị (escrow, dispute, rating) trên Dich Vụ Ơi.

### Nguyên tắc sản phẩm

| Lớp | Cách làm | Tham khảo |
|-----|----------|-----------|
| **Che liên hệ** | Public không SĐT/email; việc mở che SĐT + địa chỉ; khách không thấy SĐT partner | Upwork, Fiverr |
| **Chat in-app** | `BookingMessage` — lọc SĐT, email, Zalo/FB/Telegram; **chỉ sau khi đã cọc + có partner** | Fiverr Inbox |
| **Lộ dần** | Địa chỉ đủ sau `CONFIRMED` **và** `HELD`; SĐT khách từ `IN_PROGRESS` | Handy / logistics |
| **Tiền qua sàn** | **Tạo đơn = giam cọc** (`HELD`); thiếu ví → không tạo đơn; ToS cấm CK ngoài | Upwork Milestone |
| **Giá trị ở lại** | Rating, verified, dispute, bảo hiểm đơn (sau) | Airbnb |
| **ToS + phạt** | Cấm trao đổi liên hệ ngoài kênh; suspend khi tái phạm | Mọi sàn lớn |

### Quy tắc lộ dữ liệu API (đã code)

Utility: `apps/api/src/common/contact-privacy.ts` — mọi response booking đi qua `shapeBookingForViewer` (có xét `paymentStatus`).

| Viewer | Điều kiện | SĐT khách | Địa chỉ | SĐT/email partner |
|--------|-----------|-----------|---------|-------------------|
| Open queue | `PENDING` + **`HELD`** (API chỉ trả đơn đã cọc) | Che | Che | — |
| Partner | `CONFIRMED` nhưng chưa `HELD` (legacy) | Che | Che | — |
| Partner | `CONFIRMED` + `HELD` | Che | Đủ | (tự xem account mình) |
| Partner | `IN_PROGRESS` / `COMPLETED` + funded | Đủ | Đủ | — |
| Customer | mọi | SĐT mình (đủ) | Đủ | **Không bao giờ** |
| Admin | mọi | Đủ | Đủ | Đủ |

Response thêm: `contactPolicy` (`channel: in_app`, `phoneRevealed`, `addressRevealed`, `hint`), `customerPhoneMasked`, `addressMasked`.

### Chat đơn + lọc PII

- Model `BookingMessage` (`body`, `redacted`).
- `redactContactLeak` / `detectContactLeak`: SĐT, email, `zalo.me`, facebook, telegram, discord…
- Ghi chú đặt lịch (`note`) cũng bị lọc khi tạo đơn.
- Chat API từ chối nếu chưa `HELD` hoặc chưa có `partnerId`.
- UI: `BookingChat` trên `/don-cua-toi` và `/doi-tac` khi đơn đã cọc + `CONFIRMED` / `IN_PROGRESS`.

### Roadmap chống bỏ sàn

1. ~~Đặt cọc bắt buộc + escrow ví~~ — **đã có** (VietQR nạp + mock-confirm; webhook bank / VA tiếp theo)
2. Báo cáo tin nhắn + review thủ công pattern bypass  
3. Bảo hiểm đơn + quy trình tranh chấp  
4. Giảm hoa hồng theo level / đơn hoàn thành trên sàn (carrot)
5. (Tuỳ chọn) cọc một phần % thay vì full `totalPrice`

**Giới hạn:** dịch vụ tại nhà (gặp mặt) không chặn hết được — tối ưu lần thuê đầu và đơn lẻ qua sàn; ngành online dễ khóa hơn.

## Đối thủ & khoảng trống định vị

### Giúp việc / nhà cửa

- bTaskee, JupViec, beHome / be Giúp Việc — sâu một ngành, ops mạnh.

### Thợ / đa ngành kỹ thuật

- Vua Thợ, Ong Thợ, Thợ Việt, Thợ Top, Alo Dịch Vụ.

### Khoảng trống Dịch Vụ Ơi nhắm tới

1. **Sàn khách thuê / người làm đa ngành** (offline tại nhà + freelancer số), không chỉ app một nghề.  
2. Người làm đăng ký như freelancer; người cần việc thuê theo lịch / gói — gần Fiverr/Upwork + thợ tại nhà.  
3. Tránh “catalog rộng, ops nông” — bám MVP hẹp (ưu tiên luồng thuê của Customer) rồi mới mở onboarding người làm.  

## Tiến độ kỹ thuật

### Đã có (production path)

- Monorepo `apps/web` + `apps/api` · deploy **Vercel** + **PostgreSQL (Neon)** (không dùng SQLite trên prod)
- Catalog 3 tầng + seed ~22 nhóm / nhiều nghề cụ thể (`prisma/catalog-data.ts`), mega menu (desktop hover / mobile drawer)
- **Cache catalog:** FE localStorage + TanStack Query; BE in-memory TTL 60s + `Cache-Control`/`ETag`/`304` — xem [Cache catalog](#cache-catalog-giảm-tải--offline-nhẹ)
- Auth JWT + dual-role: dropdown header chuyển **Khách thuê** / **Người làm** (cùng account)
- **Ví + VietQR nạp** (`/vi`): tạo QR TK sàn, đối chiếu nội dung CK; mock-confirm cộng ví — xem [Ví, VietQR & định danh](#ví-vietqr--định-danh-production)
- **Xác minh SĐT** (khách + partner): OTP key một lần; production eSMS Brandname
- **Xác minh NH người làm** (payout): liên kết STK trên `PartnerProfile` + VietQR mock
- Thuê dịch vụ → tạo đơn = tự giam cọc (`PENDING`/`CONFIRMED` + `HELD`; ví thiếu → không tạo); matching mở: ứng tuyển cọc 10% + chủ chọn; `/don-cua-toi`
- Form đăng ký thuê: UI stepper 3 bước (Chọn dịch vụ → Thông tin → Xác nhận), slider khoảng giá, React Hook Form + Zod (`features/booking/`, `hire-service-form.tsx`)
- Danh sách Người làm theo dịch vụ (`GET /api/services/:slug/partners`) — **không trả SĐT/email**
- **Chống bỏ sàn P0:** che liên hệ theo vai trò/trạng thái (`contact-privacy.ts`); chat đơn `BookingMessage` + lọc PII; UI chat trên đơn thuê / việc của partner
- **Escrow** (`PaymentStatus`): **tạo đơn = tự giam cọc** từ ví → `HELD`; `RELEASED` + hoa hồng 15% khi hoàn thành; chặn hàng chờ / nhận việc / chat / `IN_PROGRESS` khi chưa `HELD`
- **Review hai chiều** sau `COMPLETED` (cập nhật `PartnerProfile.ratingAvg`)
- **Admin dashboard** `/admin` + **MODERATOR** chat hỗ trợ `/admin/support`
- Hồ sơ công khai `/user/:userId` (select gọn + cache TanStack 60s; skeleton loading)
- **Retention P0:** lưu người làm quen; gợi ý thuê lại; trang chủ «Thuê lại nhanh»
- **Lịch thuê partner** + realtime Socket.IO `/partner-realtime`
- OpenAPI/Swagger: `/docs` trên API host
- Stack FE: Vite, React, Tailwind, React Router, TanStack Query

### Tiếp theo (theo roadmap)

- `packages/` shared types/validation FE–BE
- Redis (rate limit, session, **cache phân tán** catalog đa instance)
- BullMQ workers (thông báo, matching, tác vụ nền)
- Webhook SePay/Casso hoặc **Virtual Account** — bỏ mock-confirm nạp ví
- Lịch trống / availability filter trên trang dịch vụ (khách chọn ngày còn trống)
- Ảnh dịch vụ trên R2/S3; Partner tự đăng gói dịch vụ  
- MoMo/VNPay bổ sung kênh nạp  
- Xác minh CCCD đối tác; workflow tạm khóa nhận việc khi khiếu nại nghiêm trọng  
- **Hoãn (không SEO + admin):** Push/PWA nhắc lịch · gallery portfolio · admin ban chat · audit log · biểu đồ GMV — xem mục *Chưa làm (ghi chú)*  
- Rà soát nghĩa vụ đăng ký sàn TMĐT VN khi scale thương mại  
- Tái cấu trúc FE dần về `features/catalog`, mở rộng `features/booking`  

## Công nghệ đích

### Frontend

- Vite, React, Tailwind CSS, React Router, TanStack Query  
- React Hook Form và Zod  
- Mobile-first / responsive (`sm` / `md` / `lg`)  
- Bố cục công khai: **1280px** (`.chrome-container` / `.section-container` / `.page-container`); header/footer full-bleed navy — xem [Hệ thống giao diện](#hệ-thống-giao-diện-ui)
- Dashboard **Khách thuê** (`/don-cua-toi`) và **Người làm** (`/doi-tac`): cột sidebar + nội dung giống Admin (`UserDashboardLayout`)
- Trang chủ: chip nghề marquee nằm **dưới vùng perks** (trong `HeroSection`), không còn dưới header
- Header: **logo trái | search căn giữa | tài khoản phải** — nền `--color-navy`, nút «Đơn thuê» viền gold
- UI: token navy/teal/gold trong `index.css`; class `.surface-card` / `.btn-primary` / `.icon-tile` / `.section-header-bar`
- Icon catalog theo ngành: `utils/catalog-colors.ts` → `groupColor(slug)` — **giữ nguyên màu icon**, tách khỏi palette chrome (mục [Bảng màu ngành nghề](#bảng-màu-ngành-nghề))  
- Triển khai: Vercel  

### Backend

- NestJS, REST + OpenAPI, Prisma  
- Catalog công khai: **in-memory TTL + HTTP ETag** (MVP); Redis / CDN khi scale  
- PostgreSQL (prod), Redis, BullMQ  
- WebSocket hoặc dịch vụ realtime bên ngoài  

### Hạ tầng

- FE: Vercel · BE: Vercel (Nest Fluid) + PostgreSQL (Neon)  
  (hoặc BE Railway / Render / Fly / VPS nếu cần Socket.IO bền)  
- PostgreSQL managed (Neon, Supabase, …)  
- Redis: Upstash hoặc managed  
- Ảnh: Cloudflare R2 hoặc Amazon S3 (upload `/tmp` trên Vercel chỉ tạm) 

## Kiến trúc

```text
Vite + React + Tailwind (Vercel)
              |
          REST API
              |
       NestJS (host riêng)
        /      |       \
PostgreSQL   Redis    Workers
```

- `dichvuoi.com` → `apps/web`  
- `api.dichvuoi.com` → `apps/api`  

## Cấu trúc monorepo

```text
DichVuOi/
├── apps/
│   ├── web/                 # FE: Vite + React + Tailwind
│   └── api/                 # BE: NestJS + Prisma
├── packages/                # Shared types / validation (sau)
├── package.json
└── README.md
```

### Frontend — `apps/web/src` (đích)

```text
src/
├── assets/
├── components/   # ui, layout, booking/BookingChat, common, home
├── features/     # catalog, booking (mục tiêu; MVP đang dùng pages/)
├── pages/
│   └── admin/    # layout + 1 file / màn hình admin, admin-ui, admin-utils
├── routes/
├── services/
├── hooks/
├── types/
├── utils/
├── App.tsx
└── main.tsx
```

### Backend — `apps/api/src`

```text
src/
├── common/          # contact-privacy, portrait-avatar, escrow, slug, guards…
├── config/
├── database/prisma/
├── modules/
│   ├── auth/
│   ├── catalog/     # groups/services + in-memory cache + HTTP ETag interceptor
│   ├── bookings/    # messages, auto-hold escrow on create, reviews, apply/select matching
│   ├── partners/
│   ├── admin/       # dashboard API (stats, lists có filter/paging, catalog CRUD → invalidate cache)
│   └── health/
├── app.module.ts
└── main.ts
```

Quy tắc đặt tên:

- Package: `@dichvuoi/web`, `@dichvuoi/api`  
- Thư mục/file: `kebab-case`  
- Nest: `bookings.controller.ts`, `create-booking.dto.ts`  
- React: `PascalCase.tsx`  

## Chạy dự án

```bash
npm install
# Postgres: điền DATABASE_URL trong apps/api/.env (Neon prod hoặc Postgres local)
npm run prisma:push -w @dichvuoi/api
npm run prisma:seed -w @dichvuoi/api
npm run dev        # FE + BE cùng lúc (Windows OK)
# hoặc tách terminal:
npm run dev:api    # http://localhost:3001
npm run dev:web    # http://localhost:5173
```

Production: cấu hình env trên Vercel (web `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, API `DATABASE_URL`, `CORS_ORIGIN`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM`, `VIETQR_*`, tùy chọn `SMS_PROVIDER=esms` + `ESMS_*`). Chi tiết mẫu: `apps/api/.env.example`, `apps/web/.env.example`.

### Xác minh trước khi rút ví

1. **Bước 1 (email/MK):** tự nhập email → OTP Gmail → `emailVerified`. Google login → bỏ bước này.
2. **Bước 2:** mới cho nhập ngân hàng / STK → `POST /api/wallet/withdraw`.
3. `withdraw` → `403` nếu chưa `emailVerified` (phòng rút sai NH).
4. Env API: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM` — chi tiết `apps/api/README.md`.

### Google OAuth (đăng nhập)

1. Google Cloud Console → **OAuth 2.0 Client ID** (loại Web).
2. **Authorized JavaScript origins:** `http://localhost:5173`, `https://dich-vu-oi.vercel.app` (đúng domain web).
3. Cùng Client ID vào API `GOOGLE_CLIENT_ID` và web `VITE_GOOGLE_CLIENT_ID`.
4. Web hiện nút Google trên `/dang-nhap`, `/dang-ky` → `POST /api/auth/google` `{ idToken }` → JWT như login email.
5. User Google-only: `passwordHash` null; email trùng tài khoản cũ → tự gắn `googleId`. Không thay OTP SĐT.

### Công thức cấp (level) Người làm — 1–100

`level = clamp(1, 100, round(onlineHoursPoints + jobsPoints + ratingPoints + reviewCountPoints + verifiedBonus + diversityBonus))`

| Thành phần | Cách tính | Trần |
|------------|-----------|------|
| **Giờ online** | `min(onlineSeconds/3600, 180) × 0.25` — tích lũy khi còn Socket.IO (`presence:ping` + connect/disconnect, grace 30s) | 45 |
| **Đơn hoàn thành** | `min(jobs, 80) × 0.25` | 20 |
| **Điểm ★** | Nếu ≥ 3 đánh giá: `(ratingAvg / 5) × 15` | 15 |
| **Số đánh giá** | `min(count, 40) × 0.125` | 5 |
| **Đã xác thực** | `+10` khi admin verify | 10 |
| **Đa dạng nghề** | `min(offerings_active, 8) × 0.625` | 5 |

- Giờ online: `PartnerProfile.onlineSeconds` / `lastOnlineAt` — WS `/partner-realtime`
- Tự tính lại level khi: flush giờ online, hoàn thành đơn, nhận đánh giá, đổi nghề gắn, admin verify
- API chi tiết: `GET /api/partners/me/level`
- Code: `apps/api/src/common/partner-level.ts`, `partner-presence.service.ts`

### Chatbot (FAQ + ChatGPT)

- Popup chat góc phải dưới trên web khách hàng
- Ưu tiên khớp **~2000 câu FAQ** có sẵn (`apps/api/src/modules/chatbot/data/faq-knowledge.json`)
- Không khớp đủ điểm → gọi **ChatGPT** nếu có `OPENAI_API_KEY` trong `apps/api/.env`
- Sinh lại FAQ: `node apps/api/scripts/generate-faq.mjs`
- API: `POST /api/chatbot/ask`, `GET /api/chatbot/suggestions`, `GET /api/chatbot/stats`

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Mục tiêu tải (roadmap — không phải cam kết MVP hiện tại)

Bottleneck giai đoạn đầu thường là matching thủ công + CSKH, không phải CCU. Các mốc dưới đây là hướng scale khi traffic thật lớn.

### Giai đoạn 1 — khoảng 10.000 online đồng thời

- NestJS stateless, nhiều instance sau load balancer  
- Connection pool PostgreSQL, index phù hợp  
- **Catalog:** đã có cache in-process + HTTP; khi nhiều instance → Redis/CDN shared cache (invalidate qua pub/sub hoặc TTL ngắn)  
- Redis: rate limit, session, cache phân tán  
- Worker riêng: thông báo, matching, tác vụ nền  
- Tách realtime khỏi API khi kết nối lớn  
- Load test theo RPS thực tế  

### Giai đoạn 2 — hướng tới khoảng 100.000 online đồng thời

- Scale ngang + autoscale  
- PG primary + read replica, PgBouncer  
- Redis cluster  
- Realtime tách (Ably, Pusher hoặc Socket.IO cluster)  
- Có thể tách module khi nghẽn (booking, notification, matching)  
- Load test định kỳ trước khi claim chịu tải  
