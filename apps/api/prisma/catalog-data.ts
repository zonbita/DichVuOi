/**
 * Catalog seed: Group → Category → Service (nghề cụ thể).
 * Đồng bộ tầm nhìn với README mục "Nhóm dịch vụ bao quát".
 */

export type SeedService = {
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  /** Khoảng giá thị trường (tham khảo) — mặc định suy từ basePrice. */
  priceMin: number;
  priceMax: number;
  unit: string;
  durationMin: number;
  supportsOnline: boolean;
};

export type SeedCategory = {
  slug: string;
  name: string;
  services: SeedService[];
};

export type SeedGroup = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  isFeatured: boolean;
  categories: SeedCategory[];
};

/** Chỉ đánh dấu các nghề có thể hoàn thành từ xa, không cần có mặt tại địa điểm. */
const ONLINE_SERVICE_SLUGS = new Set([
  'gia-su-toan',
  'gia-su-ly',
  'gia-su-hoa',
  'gia-su-van',
  'gia-su-ielts',
  'tieng-anh-giao-tiep',
  'tieng-trung',
  'tieng-nhat',
  'luyen-thi-dai-hoc',
  'day-nhac-tai-nha',
  'day-ve',
  'tin-hoc-van-phong',
  'day-lap-trinh-tre',
  'coaching-game',
  'coaching-lien-quan',
  'coaching-lmht',
  'coaching-valorant',
  'edit-highlight-stream',
  'day-lam-game-co-ban',
  'sua-may-cai-dat',
  'lap-trinh-freelance',
  'lam-website-wordpress',
  'seo-ky-thuat',
  'excel-tu-dong-hoa',
  'chatbot-api',
  'google-workspace',
  'thiet-ke-banner-logo',
  'thiet-ke-ui-ux',
  'edit-video-ngan',
  'retouch-anh',
  'thiet-ke-slide',
  'viet-content',
  'voice-over',
  'thiet-ke-menu-catalogue',
  'tro-ly-hanh-chinh',
  'ke-toan-ho-kd',
  'ke-khai-thue-co-ban',
  'tu-van-thu-tuc',
  // Học tập
  'tieng-han',
  'luyen-thi-toeic',
  'tieng-anh-tre-em',
  'day-excel-nang-cao',
  'day-canva-co-ban',
  'day-ai-cho-cong-viec',
  // Game
  'coaching-pubg',
  'coaching-fc-online',
  'huong-dan-len-song-stream',
  'thiet-ke-overlay-stream',
  // Lập trình
  'ho-tro-may-tinh-tu-xa',
  'sua-loi-website',
  'toi-uu-toc-do-web',
  'dung-app-mvp',
  'tu-dong-hoa-quy-trinh',
  'phan-tich-du-lieu',
  'dung-dashboard-bao-cao',
  // Thiết kế
  'thiet-ke-thumbnail',
  'motion-graphic-ngan',
  'an-pham-mang-xa-hoi',
  'viet-bai-seo',
  'viet-kich-ban-video',
  'dung-podcast',
  // Thể thao online
  'pt-online',
  'yoga-online',
  'giao-an-tap-ca-nhan',
  'coach-chay-bo-online',
  // Doanh nghiệp từ xa
  'cham-soc-khach-hang-tu-xa',
  'ho-tro-tuyen-dung',
  'soan-quy-trinh-noi-bo',
  'dao-tao-nhan-vien-online',
  // Tài chính
  'lap-ke-hoach-tai-chinh',
  'ra-soat-hop-dong-mau',
  'bao-cao-tai-chinh-don-gian',
  // Sự kiện trực tuyến
  'to-chuc-webinar',
  'mc-online',
  'ho-tro-ky-thuat-hop-truc-tuyen',
  // Marketing - bán hàng online
  'chay-ads-facebook',
  'chay-ads-google',
  'chay-ads-tiktok',
  'nghien-cuu-tu-khoa',
  'toi-uu-ty-le-chuyen-doi',
  'quan-ly-fanpage',
  'van-hanh-shopee',
  'van-hanh-tiktok-shop',
  'cham-soc-inbox',
  'viet-mo-ta-san-pham',
  // Dịch thuật - ngôn ngữ
  'dich-anh-viet',
  'dich-trung-viet',
  'dich-nhat-viet',
  'dich-han-viet',
  'hieu-dinh-van-ban',
  'phien-dich-online',
  'lam-phu-de-video',
  'go-bang-ghi-am',
  'chuan-hoa-cv-tieng-anh',
  // Trợ lý từ xa
  'tro-ly-ao-theo-gio',
  'quan-ly-email-lich',
  'dat-lich-goi-khach',
  'nhap-lieu',
  'lam-sach-du-lieu',
  'nghien-cuu-thi-truong',
  'lam-bao-cao-dinh-ky',
  // Tư vấn - phát triển cá nhân
  'tu-van-huong-nghiep',
  'coach-su-nghiep',
  'luyen-phong-van',
  'toi-uu-cv-linkedin',
  'coach-quan-ly-thoi-gian',
  'tu-van-dinh-duong-online',
  'tham-van-tam-ly-online',
  'huong-dan-thien-chanh-niem',
  // Giải trí online
  'hat-live-online',
  'ao-thuat-online',
  'dj-online',
  'mc-tiec-online',
  'dm-rpg-online',
  'choi-board-game-online',
  'coach-co-vua-online',
  'to-chuc-quiz-online',
  'ke-chuyen-online',
  'xem-phim-dong-hanh',
  'tro-chuyen-giai-tri',
  'goi-y-playlist',
]);

function s(
  slug: string,
  name: string,
  description: string,
  basePrice: number,
  unit: string,
  durationMin: number,
): SeedService {
  const priceMin = Math.round((basePrice * 0.85) / 1000) * 1000;
  const priceMax = Math.max(
    priceMin,
    Math.round((basePrice * 1.25) / 1000) * 1000,
  );
  return {
    slug,
    name,
    description,
    basePrice,
    priceMin,
    priceMax,
    unit,
    durationMin,
    supportsOnline: ONLINE_SERVICE_SLUGS.has(slug),
  };
}

export const catalogGroups: SeedGroup[] = [
  {
    slug: 'nha-cua',
    name: 'Nhà cửa - không gian sống',
    description: 'Dọn nhà, tổng vệ sinh, sofa/rèm/thảm, khử khuẩn, diệt côn trùng',
    icon: 'home',
    sortOrder: 1,
    isFeatured: true,
    categories: [
      {
        slug: 've-sinh',
        name: 'Vệ sinh',
        services: [
          s('don-nha-theo-ca', 'Dọn nhà theo ca', 'Dọn dẹp nhà cửa theo giờ', 120000, 'giờ', 120),
          s('giup-viec-theo-gio', 'Giúp việc theo giờ', 'Hỗ trợ việc nhà theo ca linh hoạt', 110000, 'giờ', 120),
          s('tong-ve-sinh', 'Tổng vệ sinh', 'Vệ sinh chuyên sâu toàn nhà', 800000, 'gói', 240),
          s('ve-sinh-sau-xay-dung', 'Vệ sinh sau xây dựng', 'Dọn bụi, vữa, rác công trình', 1200000, 'gói', 360),
          s('diet-con-trung', 'Diệt côn trùng', 'Xử lý kiến, gián, muỗi tại nhà', 350000, 'lần', 90),
          s('ve-sinh-kinh', 'Vệ sinh kính / cửa kính', 'Lau kính cửa sổ, mặt dựng thấp', 180000, 'm2', 90),
          s('don-kho-gac', 'Dọn kho / gác', 'Sắp xếp và vệ sinh kho gác xép', 400000, 'lần', 180),
        ],
      },
      {
        slug: 'sofa-rem-tham',
        name: 'Sofa / rèm / thảm',
        services: [
          s('giat-sofa', 'Giặt sofa', 'Giặt hấp sofa tại nhà', 280000, 'chỗ ngồi', 90),
          s('ve-sinh-rem-tham', 'Vệ sinh rèm / thảm', 'Giặt rèm cửa và thảm trải sàn', 200000, 'm2', 120),
          s('giat-nem', 'Giặt nệm / đệm', 'Giặt hấp nệm tại chỗ', 350000, 'chiếc', 120),
        ],
      },
      {
        slug: 'khu-khuan',
        name: 'Khử khuẩn',
        services: [
          s('khu-khuan-nha', 'Khử khuẩn nhà cửa', 'Phun khử khuẩn toàn nhà theo gói', 450000, 'gói', 120),
          s('khu-khuan-van-phong-nho', 'Khử khuẩn văn phòng nhỏ', 'Khử khuẩn không gian làm việc', 600000, 'gói', 150),
        ],
      },
    ],
  },
  {
    slug: 'sua-chua',
    name: 'Sửa chữa - kỹ thuật',
    description: 'Điện, nước, điện lạnh, điện máy, camera, mạng, chống thấm, sơn',
    icon: 'wrench',
    sortOrder: 2,
    isFeatured: true,
    categories: [
      {
        slug: 'dien-lanh',
        name: 'Điện lạnh',
        services: [
          s('ve-sinh-may-lanh', 'Vệ sinh máy lạnh', 'Vệ sinh và bảo dưỡng máy lạnh', 250000, 'máy', 90),
          s('sua-tu-lanh', 'Sửa tủ lạnh', 'Chẩn đoán và sửa tủ lạnh tại nhà', 300000, 'lần', 90),
          s('sua-may-giat', 'Sửa máy giặt', 'Sửa máy giặt cửa trước / cửa trên', 280000, 'lần', 90),
          s('bao-tri-binh-nong-lanh', 'Bảo trì bình nóng lạnh', 'Vệ sinh, kiểm tra an toàn bình nóng lạnh', 220000, 'lần', 60),
        ],
      },
      {
        slug: 'dien-nuoc',
        name: 'Điện nước',
        services: [
          s('sua-dien-nuoc', 'Sửa điện nước', 'Khắc phục sự cố điện nước tại nhà', 200000, 'lần', 60),
          s('sua-o-cam-den', 'Sửa ổ cắm / đèn', 'Thay ổ cắm, bóng đèn, công tắc', 150000, 'lần', 45),
          s('thong-tac-cong', 'Thông tắc cống', 'Thông tắc lavabo, bồn cầu, thoát sàn', 250000, 'lần', 60),
          s('sua-khoa-cua', 'Sửa / thay khóa cửa', 'Sửa khóa, thay ruột khóa cơ bản', 180000, 'lần', 45),
        ],
      },
      {
        slug: 'camera-mang',
        name: 'Camera - mạng',
        services: [
          s('lap-camera', 'Lắp camera', 'Lắp đặt camera giám sát cơ bản', 350000, 'mắt', 120),
          s('sua-wifi', 'Sửa / tối ưu Wi‑Fi', 'Khắc phục mạng chậm, mở rộng sóng', 180000, 'lần', 60),
          s('lap-quat-tran', 'Lắp quạt trần', 'Lắp đặt và cân bằng quạt trần', 200000, 'cái', 90),
        ],
      },
      {
        slug: 'son-chong-tham',
        name: 'Sơn - chống thấm',
        services: [
          s('chong-tham', 'Chống thấm', 'Xử lý thấm dột tường, sân thượng', 500000, 'm2', 180),
          s('son-nha-phong', 'Sơn nhà / phòng', 'Sơn lại tường phòng hoặc căn hộ nhỏ', 120000, 'm2', 240),
        ],
      },
    ],
  },
  {
    slug: 'xay-dung',
    name: 'Xây dựng - hoàn thiện',
    description: 'Thợ hồ, ốp lát, thạch cao, cửa kính, rèm, lắp đặt nội thất',
    icon: 'hammer',
    sortOrder: 3,
    isFeatured: false,
    categories: [
      {
        slug: 'hoan-thien',
        name: 'Hoàn thiện',
        services: [
          s('tho-ho-sua-chua', 'Thợ hồ sửa chữa nhỏ', 'Sửa tường, lát gạch, trát vá cơ bản', 400000, 'ngày', 480),
          s('lap-dat-noi-that', 'Lắp đặt nội thất', 'Lắp tủ, kệ, rèm, cửa kính theo yêu cầu', 350000, 'lần', 180),
          s('lam-cua-kinh', 'Làm / sửa cửa kính', 'Lắp cửa kính cường lực, sửa ray cửa', 450000, 'lần', 180),
          s('lap-rem-cua', 'Lắp rèm cửa', 'Đo và lắp rèm theo kích thước', 250000, 'cửa', 90),
          s('thao-do-nhe', 'Tháo dỡ nhẹ', 'Tháo tường ngăn, gạch men khu vực nhỏ', 500000, 'ngày', 480),
        ],
      },
      {
        slug: 'op-lat-thach-cao',
        name: 'Ốp lát - thạch cao',
        services: [
          s('op-lat-gach', 'Ốp lát gạch', 'Ốp tường, lát nền theo mét vuông', 180000, 'm2', 240),
          s('tran-thach-cao', 'Trần thạch cao', 'Làm trần thạch cao phòng nhỏ', 220000, 'm2', 360),
          s('lat-san-go', 'Lát sàn gỗ / SPC', 'Lát sàn gỗ công nghiệp hoặc SPC', 150000, 'm2', 240),
          s('ba-tuong', 'Bả tường', 'Bả matit trước khi sơn', 80000, 'm2', 180),
        ],
      },
    ],
  },
  {
    slug: 'cham-soc',
    name: 'Chăm sóc - sức khỏe',
    description: 'Trông trẻ, người già, người bệnh, massage, spa tại nhà',
    icon: 'heart',
    sortOrder: 4,
    isFeatured: true,
    categories: [
      {
        slug: 'cham-soc-tai-nha',
        name: 'Chăm sóc tại nhà',
        services: [
          s('cham-soc-nguoi-gia', 'Chăm sóc người già', 'Đồng hành chăm sóc tại nhà theo ca', 180000, 'giờ', 180),
          s('cham-benh-nhe', 'Chăm bệnh nhẹ tại nhà', 'Hỗ trợ người ốm / sau xuất viện', 200000, 'giờ', 180),
          s('massage-tai-nha', 'Massage tại nhà', 'Massage thư giãn tại địa chỉ khách', 250000, 'buổi', 60),
          s('spa-foot-tai-nha', 'Spa foot tại nhà', 'Chăm sóc chân, thư giãn tại nhà', 220000, 'buổi', 60),
          s('dong-hanh-kham-benh', 'Đồng hành khám bệnh', 'Đi cùng người thân tới bệnh viện', 150000, 'giờ', 120),
          s('cham-me-sau-sinh', 'Chăm mẹ sau sinh', 'Hỗ trợ mẹ và bé những tuần đầu', 250000, 'giờ', 240),
        ],
      },
      {
        slug: 'trong-tre',
        name: 'Trông trẻ',
        services: [
          s('bao-mau-theo-gio', 'Bảo mẫu theo giờ', 'Trông trẻ tại nhà theo ca', 120000, 'giờ', 120),
          s('bao-mau-cuoi-tuan', 'Bảo mẫu cuối tuần', 'Trông trẻ buổi tối / cuối tuần', 140000, 'giờ', 180),
        ],
      },
      {
        slug: 'gia-su-suc-khoe',
        name: 'Gia sư sức khỏe',
        services: [
          s('gia-su-hoa', 'Gia sư Hóa', 'Dạy kèm Hóa học THCS / THPT', 150000, 'giờ', 90),
        ],
      },
    ],
  },
  {
    slug: 'lam-dep',
    name: 'Làm đẹp',
    description: 'Makeup, tóc, nail, gội đầu dưỡng sinh tại nhà',
    icon: 'beauty',
    sortOrder: 5,
    isFeatured: true,
    categories: [
      {
        slug: 'lam-dep-tai-nha',
        name: 'Làm đẹp tại nhà',
        services: [
          s('makeup-tai-nha', 'Makeup tại nhà', 'Trang điểm dự tiệc, chụp ảnh, sự kiện', 400000, 'buổi', 90),
          s('makeup-co-dau', 'Makeup cô dâu', 'Trang điểm cô dâu + thử makeup', 1500000, 'gói', 180),
          s('nail-tai-nha', 'Nail tại nhà', 'Làm móng cơ bản hoặc nghệ thuật tại nhà', 200000, 'buổi', 90),
          s('noi-mi-tai-nha', 'Nối mi tại nhà', 'Nối mi classic / volume tận nơi', 350000, 'buổi', 120),
          s('cham-da-tai-nha', 'Chăm da mặt tại nhà', 'Chăm da cơ bản, đắp mặt nạ', 280000, 'buổi', 75),
        ],
      },
      {
        slug: 'toc-goi-dau',
        name: 'Tóc - gội đầu',
        services: [
          s('goi-dau-duong-sinh', 'Gội đầu dưỡng sinh', 'Gội đầu dưỡng sinh tại nhà', 180000, 'buổi', 75),
          s('lam-toc-tai-nha', 'Làm tóc tại nhà', 'Cắt / tạo kiểu tóc tận nơi', 250000, 'buổi', 90),
          s('nhuom-toc-tai-nha', 'Nhuộm tóc tại nhà', 'Nhuộm / phủ bạc tại nhà', 400000, 'buổi', 150),
        ],
      },
    ],
  },
  {
    slug: 'bep-doi-song',
    name: 'Bếp - đời sống',
    description: 'Nấu ăn, đi chợ, meal prep, giặt ủi, may sửa đồ',
    icon: 'utensils',
    sortOrder: 6,
    isFeatured: true,
    categories: [
      {
        slug: 'nau-an-doi-song',
        name: 'Nấu ăn - đời sống',
        services: [
          s('nau-an-theo-bua', 'Nấu ăn theo bữa', 'Nấu ăn tại nhà theo thực đơn yêu cầu', 200000, 'bữa', 120),
          s('meal-prep-tuan', 'Meal prep tuần', 'Chuẩn bị suất ăn cả tuần', 800000, 'gói', 240),
          s('di-cho-ho', 'Đi chợ hộ', 'Mua thực phẩm theo list', 100000, 'lần', 90),
          s('giat-ui', 'Giặt ủi', 'Giặt ủi quần áo theo kg hoặc theo gói', 30000, 'kg', 60),
          s('ui-do-cong-so', 'Ủi đồ công sở', 'Ủi áo sơ mi, quần âu theo bộ', 25000, 'món', 45),
          s('may-sua-do', 'May sửa đồ', 'Sửa quần áo, bóp/nới cơ bản', 80000, 'món', 60),
          s('nau-tiec-nho', 'Nấu tiệc nhỏ tại nhà', 'Nấu set tiệc 8–15 người', 2500000, 'gói', 360),
        ],
      },
    ],
  },
  {
    slug: 'xe',
    name: 'Xe - vận chuyển',
    description: 'Rửa xe, cứu hộ nhẹ, tài xế theo giờ, chuyển nhà, bê đồ',
    icon: 'truck',
    sortOrder: 7,
    isFeatured: true,
    categories: [
      {
        slug: 'van-chuyen',
        name: 'Vận chuyển',
        services: [
          s('chuyen-nha-nhe', 'Chuyển nhà nhẹ', 'Bê đồ và hỗ trợ chuyển nhà nhỏ', 600000, 'gói', 240),
          s('be-do-van-phong', 'Bê đồ văn phòng', 'Chuyển bàn ghế, thùng hồ sơ', 500000, 'gói', 180),
          s('rua-xe-tai-nha', 'Rửa xe tại nhà', 'Rửa xe máy / ô tô tận nơi', 150000, 'xe', 60),
          s('danh-bong-xe', 'Đánh bóng xe', 'Đánh bóng và phủ bóng cơ bản', 400000, 'xe', 120),
          s('tai-xe-theo-gio', 'Tài xế theo giờ', 'Thuê tài xế lái xe khách', 200000, 'giờ', 60),
          s('cuu-ho-xe-nhe', 'Cứu hộ xe nhẹ', 'Hỗ trợ ắc quy, thay lốp dự phòng', 250000, 'lần', 60),
          s('runner-cong-chung', 'Runner công chứng', 'Hỗ trợ nộp hồ sơ, công chứng qua đối tác có phép', 200000, 'hồ sơ', 120),
        ],
      },
    ],
  },
  {
    slug: 'hoc-tap',
    name: 'Học tập - ngoại ngữ',
    description: 'Gia sư Toán và các môn nền tảng',
    icon: 'book',
    sortOrder: 8,
    isFeatured: true,
    categories: [
      {
        slug: 'gia-su',
        name: 'Gia sư',
        services: [
          s('gia-su-toan', 'Gia sư Toán', 'Dạy kèm Toán tại nhà hoặc online', 150000, 'giờ', 90),
          s('tu-van-thu-tuc', 'Tư vấn thủ tục cơ bản', 'Hướng dẫn checklist thủ tục thường gặp', 300000, 'buổi', 60),
        ],
      },
    ],
  },
  {
    slug: 'game',
    name: 'Game - eSports',
    description: 'Coaching, review replay, setup PC, dạy làm game, edit stream',
    icon: 'game',
    sortOrder: 9,
    isFeatured: true,
    categories: [
      {
        slug: 'esports',
        name: 'eSports',
        services: [
          s('coaching-game', 'Coaching game', 'Review replay, hướng dẫn leo rank (không boosting)', 120000, 'giờ', 60),
          s('coaching-lien-quan', 'Coaching Liên Quân', 'Coaching Liên Quân Mobile 1 kèm 1', 100000, 'giờ', 60),
          s('coaching-lmht', 'Coaching LMHT', 'Coaching League of Legends', 150000, 'giờ', 60),
          s('coaching-valorant', 'Coaching Valorant', 'Aim, agent, VOD review', 150000, 'giờ', 60),
          s('setup-pc-gaming', 'Setup / tối ưu PC gaming', 'Cài đặt, tối ưu hiệu năng máy chơi game', 300000, 'lần', 120),
          s('edit-highlight-stream', 'Edit highlight / stream', 'Cắt highlight, intro stream', 250000, 'video', 120),
          s('day-lam-game-co-ban', 'Dạy làm game cơ bản', 'Giới thiệu Unity / Godot cơ bản', 300000, 'giờ', 90),
          s('coaching-pubg', 'Coaching PUBG Mobile', 'Kỹ năng bắn, đội hình, vòng bo', 120000, 'giờ', 60),
          s('coaching-fc-online', 'Coaching FC Online', 'Chiến thuật, đội hình, xử lý tình huống', 120000, 'giờ', 60),
          s('huong-dan-len-song-stream', 'Hướng dẫn lên sóng stream', 'Setup OBS, kịch bản buổi stream', 250000, 'buổi', 90),
          s('thiet-ke-overlay-stream', 'Thiết kế overlay stream', 'Overlay, alert, khung camera', 300000, 'gói', 120),
        ],
      },
    ],
  },
  {
    slug: 'lap-trinh',
    name: 'Lập trình - công nghệ',
    description: 'Web/app freelance, fix bug, SEO kỹ thuật, cài máy, Excel, chatbot, API',
    icon: 'code',
    sortOrder: 10,
    isFeatured: true,
    categories: [
      {
        slug: 'cong-nghe',
        name: 'Công nghệ',
        services: [
          s('sua-may-cai-dat', 'Sửa máy / cài đặt', 'Cài Windows, phần mềm, xử lý lỗi cơ bản', 200000, 'lần', 90),
          s('lap-trinh-freelance', 'Lập trình freelance nhỏ', 'Landing, bot, fix bug theo yêu cầu', 500000, 'gói', 240),
          s('lam-website-wordpress', 'Website WordPress', 'Dựng site giới thiệu / blog cơ bản', 1500000, 'gói', 480),
          s('seo-ky-thuat', 'SEO kỹ thuật', 'Audit tốc độ, meta, sitemap cơ bản', 800000, 'gói', 240),
          s('cai-mang-van-phong', 'Cài mạng văn phòng', 'Setup router, switch, Wi‑Fi VP nhỏ', 400000, 'lần', 180),
          s('ho-tro-may-tinh-tu-xa', 'Hỗ trợ máy tính từ xa', 'Xử lý lỗi phần mềm qua điều khiển từ xa', 150000, 'lần', 60),
          s('sua-loi-website', 'Sửa lỗi website', 'Fix lỗi giao diện, chức năng, hosting', 400000, 'lần', 120),
          s('toi-uu-toc-do-web', 'Tối ưu tốc độ web', 'Tăng điểm PageSpeed, nén tài nguyên', 600000, 'gói', 180),
          s('dung-app-mvp', 'Dựng app MVP', 'Bản chạy được đầu tiên cho ý tưởng nhỏ', 5000000, 'gói', 480),
        ],
      },
      {
        slug: 'tu-dong-hoa',
        name: 'Excel - tự động hóa',
        services: [
          s('excel-tu-dong-hoa', 'Excel / tự động hóa', 'Công thức, macro, báo cáo tự động', 300000, 'gói', 120),
          s('chatbot-api', 'Chatbot / API nhỏ', 'Tích hợp chatbot hoặc API đơn giản', 800000, 'gói', 360),
          s('google-workspace', 'Hỗ trợ Google Workspace', 'Drive, Sheet, Form, quy trình cộng tác', 250000, 'gói', 90),
          s('tu-dong-hoa-quy-trinh', 'Tự động hóa quy trình', 'Nối app bằng n8n / Zapier, bỏ thao tác tay', 900000, 'gói', 240),
          s('phan-tich-du-lieu', 'Phân tích dữ liệu', 'Làm sạch, phân tích và diễn giải số liệu', 700000, 'gói', 240),
          s('dung-dashboard-bao-cao', 'Dựng dashboard báo cáo', 'Google Data Studio / Power BI cơ bản', 1200000, 'gói', 300),
          s('tin-hoc-van-phong', 'Tin học văn phòng', 'Word, Excel, PowerPoint theo nhu cầu', 150000, 'giờ', 90),
          s('day-excel-nang-cao', 'Dạy Excel nâng cao', 'Hàm nâng cao, PivotTable, dashboard', 250000, 'giờ', 90),
          s('day-ai-cho-cong-viec', 'Dạy dùng AI cho công việc', 'Ứng dụng AI vào soạn thảo, báo cáo', 300000, 'giờ', 60),
          s('ra-soat-hop-dong-mau', 'Rà soát hợp đồng mẫu', 'Đọc và ghi chú rủi ro (đối tác có chuyên môn)', 600000, 'hồ sơ', 120),
        ],
      },
      {
        slug: 'day-lap-trinh',
        name: 'Dạy lập trình',
        services: [
          s('day-lap-trinh-tre', 'Dạy lập trình cho trẻ', 'Scratch / Python cơ bản cho trẻ', 200000, 'giờ', 60),
        ],
      },
      {
        slug: 'gia-su-khoa-hoc',
        name: 'Gia sư khoa học',
        services: [
          s('gia-su-ly', 'Gia sư Lý', 'Dạy kèm Vật lý THCS / THPT', 150000, 'giờ', 90),
        ],
      },
    ],
  },
  {
    slug: 'thiet-ke',
    name: 'Thiết kế - sáng tạo nội dung',
    description: 'Logo/banner, UI/UX, edit video/Short/TikTok, content, voice-over',
    icon: 'design',
    sortOrder: 11,
    isFeatured: true,
    categories: [
      {
        slug: 'sang-tao',
        name: 'Sáng tạo',
        services: [
          s('thiet-ke-banner-logo', 'Thiết kế banner – logo', 'Thiết kế nhận diện cơ bản', 300000, 'gói', 120),
          s('thiet-ke-ui-ux', 'Thiết kế UI/UX', 'Wireframe / mockup màn hình app-web', 800000, 'gói', 240),
          s('edit-video-ngan', 'Edit video ngắn', 'TikTok / Reels / Short', 250000, 'video', 120),
          s('retouch-anh', 'Retouch ảnh', 'Chỉnh màu, làm đẹp ảnh sản phẩm / chân dung', 100000, 'ảnh', 45),
          s('thiet-ke-slide', 'Thiết kế slide thuyết trình', 'Slide pitch / báo cáo chuyên nghiệp', 400000, 'bộ', 120),
          s('thiet-ke-thumbnail', 'Thiết kế thumbnail', 'Ảnh bìa YouTube / TikTok bắt mắt', 80000, 'ảnh', 30),
          s('motion-graphic-ngan', 'Motion graphic ngắn', 'Video đồ họa chuyển động 15–30 giây', 700000, 'video', 180),
          s('an-pham-mang-xa-hoi', 'Ấn phẩm mạng xã hội', 'Bộ post theo bộ nhận diện thương hiệu', 200000, 'bộ', 90),
          s('day-canva-co-ban', 'Dạy Canva cơ bản', 'Tự thiết kế ấn phẩm bán hàng', 180000, 'giờ', 60),
          s('day-ve', 'Dạy vẽ', 'Vẽ cơ bản, luyện thi năng khiếu', 180000, 'giờ', 90),
        ],
      },
      {
        slug: 'content-kenh',
        name: 'Content - kênh',
        services: [
          s('viet-content', 'Viết content', 'Caption, bài đăng mạng xã hội', 150000, 'bài', 60),
          s('voice-over', 'Voice-over', 'Thu âm thuyết minh ngắn', 200000, 'clip', 60),
          s('thiet-ke-menu-catalogue', 'Thiết kế menu / catalogue', 'Menu quán, catalogue sản phẩm PDF', 500000, 'gói', 180),
          s('viet-bai-seo', 'Viết bài chuẩn SEO', 'Bài blog theo từ khóa mục tiêu', 250000, 'bài', 90),
          s('viet-kich-ban-video', 'Viết kịch bản video', 'Kịch bản TikTok / Reels / quảng cáo', 200000, 'kịch bản', 60),
          s('dung-podcast', 'Dựng – xử lý podcast', 'Cắt ghép, lọc tạp âm, chuẩn hóa âm lượng', 350000, 'tập', 120),
        ],
      },
    ],
  },
  {
    slug: 'su-kien',
    name: 'Sự kiện - truyền thông',
    description: 'Chụp/quay, trang trí, MC, livestream, ban nhạc nhỏ',
    icon: 'camera',
    sortOrder: 12,
    isFeatured: false,
    categories: [
      {
        slug: 'su-kien-truyen-thong',
        name: 'Sự kiện',
        services: [
          s('chup-quay-su-kien', 'Chụp / quay sự kiện', 'Chụp ảnh và quay video sự kiện nhỏ', 1500000, 'buổi', 240),
          s('mc-su-kien', 'MC sự kiện', 'MC dẫn chương trình tiệc, khai trương', 1200000, 'buổi', 180),
          s('livestream-ban-hang', 'Livestream bán hàng', 'Hỗ trợ livestream bán hàng / sự kiện', 800000, 'buổi', 180),
          s('trang-tri-tiec', 'Trang trí tiệc nhỏ', 'Trang trí sinh nhật, khai trương quy mô nhỏ', 1000000, 'gói', 240),
          s('ban-nhac-acoustic', 'Ban nhạc acoustic', 'Biểu diễn acoustic 3–5 bài', 2000000, 'buổi', 120),
          s('setup-am-thanh', 'Setup âm thanh / ánh sáng nhỏ', 'Cho tiệc, workshop quy mô nhỏ', 900000, 'buổi', 180),
        ],
      },
      {
        slug: 'su-kien-truc-tuyen',
        name: 'Sự kiện trực tuyến',
        services: [
          s('to-chuc-webinar', 'Tổ chức webinar', 'Lên kịch bản, điều phối hội thảo online', 1200000, 'buổi', 240),
          s('mc-online', 'MC online', 'Dẫn chương trình họp mặt / ra mắt online', 800000, 'buổi', 120),
          s('ho-tro-ky-thuat-hop-truc-tuyen', 'Hỗ trợ kỹ thuật họp trực tuyến', 'Trực Zoom / Meet, chia phòng, ghi hình', 500000, 'buổi', 180),
        ],
      },
    ],
  },
  {
    slug: 'thu-cung',
    name: 'Thú cưng',
    description: 'Tắm cắt, trông pet, dắt chó, đưa khám',
    icon: 'pet',
    sortOrder: 13,
    isFeatured: false,
    categories: [
      {
        slug: 'cham-soc-pet',
        name: 'Chăm sóc pet',
        services: [
          s('tam-cat-thu-cung', 'Tắm cắt thú cưng', 'Tắm, cắt tỉa lông tại nhà hoặc cửa hàng', 200000, 'lần', 90),
          s('dat-cho', 'Dắt chó', 'Dắt chó đi dạo theo giờ', 80000, 'giờ', 60),
          s('trong-pet-tai-nha', 'Trông pet tại nhà', 'Trông chó/mèo khi chủ vắng', 150000, 'ngày', 480),
          s('dua-kham-thu-y', 'Đưa khám thú y', 'Đưa pet đi khám / tiêm', 120000, 'lần', 120),
          s('huan-luyen-pet-co-ban', 'Huấn luyện pet cơ bản', 'Nghe lời cơ bản, đi vệ sinh đúng chỗ', 250000, 'buổi', 60),
        ],
      },
    ],
  },
  {
    slug: 'the-thao',
    name: 'Thể thao - PT',
    description: 'PT gym, yoga, bơi, pickleball coach',
    icon: 'dumbbell',
    sortOrder: 14,
    isFeatured: false,
    categories: [
      {
        slug: 'pt-the-thao',
        name: 'Huấn luyện',
        services: [
          s('pt-gym', 'PT gym 1 kèm 1', 'Huấn luyện viên cá nhân tại phòng gym hoặc nhà', 250000, 'buổi', 60),
          s('yoga-tai-nha', 'Yoga tại nhà', 'Hướng dẫn yoga cá nhân hoặc nhóm nhỏ', 200000, 'buổi', 60),
          s('day-boi', 'Dạy bơi', 'Dạy bơi cơ bản cho người lớn / trẻ', 220000, 'buổi', 60),
          s('pickleball-coach', 'Pickleball coach', 'Huấn luyện pickleball 1 kèm 1', 250000, 'buổi', 60),
          s('tennis-cau-long', 'Tennis / cầu lông coach', 'Huấn luyện kỹ thuật cơ bản', 250000, 'buổi', 60),
          s('chay-bo-coach', 'Chạy bộ coach', 'Lịch tập và kèm chạy theo mục tiêu', 180000, 'buổi', 60),
          s('boxing-co-ban', 'Boxing / Muay cơ bản', 'Tập đối kháng nhẹ, kỹ thuật cơ bản', 220000, 'buổi', 60),
        ],
      },
      {
        slug: 'huan-luyen-online',
        name: 'Huấn luyện online',
        services: [
          s('pt-online', 'PT online 1 kèm 1', 'Tập theo camera, sửa động tác trực tiếp', 200000, 'buổi', 60),
          s('yoga-online', 'Yoga online', 'Lớp yoga cá nhân hoặc nhóm nhỏ qua video', 150000, 'buổi', 60),
          s('giao-an-tap-ca-nhan', 'Giáo án tập cá nhân hóa', 'Lịch tập và dinh dưỡng theo mục tiêu', 500000, 'gói', 120),
          s('coach-chay-bo-online', 'Coach chạy bộ online', 'Theo dõi cự ly, nhịp tim, điều chỉnh lịch', 400000, 'tháng', 90),
        ],
      },
    ],
  },
  {
    slug: 'doanh-nghiep',
    name: 'Doanh nghiệp - văn phòng',
    description: 'Dọn VP, vệ sinh công nghiệp, lễ tân thời vụ, phúc lợi nhân viên',
    icon: 'briefcase',
    sortOrder: 15,
    isFeatured: false,
    categories: [
      {
        slug: 'van-phong',
        name: 'Văn phòng',
        services: [
          s('don-van-phong', 'Dọn văn phòng', 'Vệ sinh định kỳ văn phòng, khu làm việc', 500000, 'lần', 180),
          s('ve-sinh-cong-nghiep', 'Vệ sinh công nghiệp', 'Vệ sinh nhà xưởng / mặt bằng lớn', 2000000, 'gói', 480),
          s('le-tan-thoi-vu', 'Lễ tân thời vụ', 'Nhân sự lễ tân theo ca / sự kiện', 300000, 'ca', 240),
          s('tro-ly-hanh-chinh', 'Trợ lý hành chính theo giờ', 'Hỗ trợ giấy tờ, sắp xếp lịch VP', 180000, 'giờ', 120),
          s('tea-break', 'Phục vụ tea-break', 'Chuẩn bị đồ uống / bánh cho họp', 400000, 'buổi', 120),
          s('ke-toan-ho-kd', 'Kế toán hộ kinh doanh', 'Hỗ trợ sổ sách, kê khai cơ bản cho hộ KD', 800000, 'tháng', 240),
        ],
      },
      {
        slug: 'van-hanh-tu-xa',
        name: 'Vận hành từ xa',
        services: [
          s('cham-soc-khach-hang-tu-xa', 'Chăm sóc khách hàng từ xa', 'Trực hotline / chat theo ca', 200000, 'giờ', 120),
          s('ho-tro-tuyen-dung', 'Hỗ trợ tuyển dụng', 'Đăng tin, lọc CV, hẹn lịch phỏng vấn', 1500000, 'vị trí', 240),
          s('soan-quy-trinh-noi-bo', 'Soạn quy trình nội bộ', 'Chuẩn hóa quy trình, biểu mẫu làm việc', 1200000, 'gói', 240),
          s('dao-tao-nhan-vien-online', 'Đào tạo nhân viên online', 'Buổi đào tạo kỹ năng theo chủ đề', 800000, 'buổi', 120),
        ],
      },
    ],
  },
  {
    slug: 'tai-chinh',
    name: 'Tài chính – hành chính – pháp lý hỗ trợ',
    description: 'Báo cáo tài chính, kế toán và tư vấn tài chính cơ bản',
    icon: 'scale',
    sortOrder: 16,
    isFeatured: false,
    categories: [
      {
        slug: 'hanh-chinh',
        name: 'Hành chính hỗ trợ',
        services: [
          s('bao-cao-tai-chinh-don-gian', 'Báo cáo tài chính đơn giản', 'Tổng hợp thu chi, lãi lỗ cho hộ / shop nhỏ', 700000, 'gói', 180),
        ],
      },
    ],
  },
  {
    slug: 'san-vuon',
    name: 'Sân vườn - ngoài trời',
    description: 'Cắt cỏ, chăm cây, tiểu cảnh, hồ cá',
    icon: 'leaf',
    sortOrder: 17,
    isFeatured: false,
    categories: [
      {
        slug: 'san-vuon-ngoai-troi',
        name: 'Sân vườn',
        services: [
          s('cat-co-cham-cay', 'Cắt cỏ / chăm cây', 'Cắt cỏ, tỉa cây, chăm sóc sân vườn', 250000, 'lần', 120),
          s('thiet-ke-tieu-canh', 'Tiểu cảnh cơ bản', 'Bố trí tiểu cảnh, chậu cây theo không gian', 500000, 'gói', 180),
          s('cham-cay-canh', 'Chăm cây cảnh trong nhà', 'Tỉa, thay đất, tưới dinh dưỡng', 150000, 'lần', 60),
          s('ve-sinh-ho-ca', 'Vệ sinh hồ cá', 'Thay nước, vệ sinh lọc hồ cá cảnh', 300000, 'lần', 90),
          s('lap-tuoi-cay', 'Lắp hệ thống tưới', 'Tưới nhỏ giọt / hẹn giờ cơ bản', 400000, 'gói', 150),
          s('don-san-thuong', 'Dọn sân thượng', 'Vệ sinh và sắp xếp sân thượng', 350000, 'lần', 120),
        ],
      },
    ],
  },
  {
    slug: 'marketing-online',
    name: 'Marketing - bán hàng online',
    description: 'Chạy quảng cáo, quản lý fanpage, vận hành gian hàng TMĐT',
    icon: 'chart',
    sortOrder: 18,
    isFeatured: true,
    categories: [
      {
        slug: 'quang-cao-so',
        name: 'Quảng cáo số',
        services: [
          s('chay-ads-facebook', 'Chạy ads Facebook', 'Lên chiến dịch, tối ưu ngân sách theo tháng', 1500000, 'tháng', 240),
          s('chay-ads-google', 'Chạy ads Google', 'Search / Shopping cho shop và dịch vụ nhỏ', 1800000, 'tháng', 240),
          s('chay-ads-tiktok', 'Chạy ads TikTok', 'Set up và tối ưu quảng cáo TikTok', 1500000, 'tháng', 240),
          s('nghien-cuu-tu-khoa', 'Nghiên cứu từ khóa', 'Bộ từ khóa và định hướng nội dung', 500000, 'gói', 120),
          s('toi-uu-ty-le-chuyen-doi', 'Tối ưu tỉ lệ chuyển đổi', 'Rà soát landing, phễu bán hàng', 900000, 'gói', 180),
        ],
      },
      {
        slug: 'van-hanh-kenh-ban',
        name: 'Vận hành kênh bán',
        services: [
          s('quan-ly-fanpage', 'Quản lý fanpage', 'Lên lịch bài, trả lời khách theo tháng', 1200000, 'tháng', 180),
          s('van-hanh-shopee', 'Vận hành gian hàng Shopee', 'Đăng sản phẩm, chạy khuyến mãi, xử lý đơn', 1500000, 'tháng', 240),
          s('van-hanh-tiktok-shop', 'Vận hành TikTok Shop', 'Quản lý sản phẩm, chiến dịch, đơn hàng', 1500000, 'tháng', 240),
          s('cham-soc-inbox', 'Chăm sóc inbox / bình luận', 'Trực tin nhắn và bình luận theo khung giờ', 800000, 'tháng', 180),
          s('viet-mo-ta-san-pham', 'Viết mô tả sản phẩm', 'Mô tả bán hàng chuẩn sàn TMĐT', 120000, 'sản phẩm', 45),
          s('ke-khai-thue-co-ban', 'Kê khai thuế cơ bản', 'Hỗ trợ tờ khai định kỳ (đối tác có phép)', 500000, 'lần', 120),
        ],
      },
    ],
  },
  {
    slug: 'ngon-ngu',
    name: 'Dịch thuật - ngôn ngữ',
    description: 'Biên dịch, hiệu đính, phiên dịch online, phụ đề, gỡ băng',
    icon: 'book',
    sortOrder: 19,
    isFeatured: true,
    categories: [
      {
        slug: 'bien-dich',
        name: 'Biên dịch',
        services: [
          s('dich-anh-viet', 'Dịch Anh – Việt', 'Dịch tài liệu, email, hồ sơ hai chiều', 120000, 'trang', 60),
          s('dich-trung-viet', 'Dịch Trung – Việt', 'Dịch tài liệu thương mại, hợp đồng cơ bản', 140000, 'trang', 60),
          s('dich-nhat-viet', 'Dịch Nhật – Việt', 'Dịch tài liệu kỹ thuật, hồ sơ cá nhân', 160000, 'trang', 60),
          s('dich-han-viet', 'Dịch Hàn – Việt', 'Dịch tài liệu, nội dung marketing', 160000, 'trang', 60),
          s('hieu-dinh-van-ban', 'Hiệu đính văn bản', 'Soát lỗi, chuẩn hóa văn phong bản dịch', 80000, 'trang', 45),
        ],
      },
      {
        slug: 'phien-dich-phu-de',
        name: 'Phiên dịch - phụ đề',
        services: [
          s('phien-dich-online', 'Phiên dịch online', 'Phiên dịch họp qua Zoom / Google Meet', 400000, 'giờ', 60),
          s('lam-phu-de-video', 'Làm phụ đề video', 'Phụ đề song ngữ, canh timing', 150000, 'phút video', 60),
          s('go-bang-ghi-am', 'Gỡ băng ghi âm', 'Chuyển audio phỏng vấn thành văn bản', 100000, 'phút audio', 45),
          s('chuan-hoa-cv-tieng-anh', 'Chuẩn hóa CV tiếng Anh', 'Dịch và chuẩn hóa CV, thư xin việc', 300000, 'bộ', 90),
        ],
      },
      {
        slug: 'day-ngoai-ngu',
        name: 'Dạy ngoại ngữ',
        services: [
          s('gia-su-ielts', 'Gia sư IELTS', 'Luyện thi IELTS 1 kèm 1', 250000, 'giờ', 90),
          s('tieng-anh-giao-tiep', 'Tiếng Anh giao tiếp', 'Luyện nói tiếng Anh thực tế', 200000, 'giờ', 60),
          s('tieng-trung', 'Gia sư tiếng Trung', 'Hán ngữ giao tiếp / HSK cơ bản', 200000, 'giờ', 60),
          s('tieng-nhat', 'Gia sư tiếng Nhật', 'Tiếng Nhật N5–N3', 220000, 'giờ', 60),
          s('tieng-han', 'Gia sư tiếng Hàn', 'Tiếng Hàn giao tiếp / TOPIK cơ bản', 220000, 'giờ', 60),
          s('luyen-thi-toeic', 'Luyện thi TOEIC', 'Luyện đề và chiến thuật làm bài', 200000, 'giờ', 90),
          s('tieng-anh-tre-em', 'Tiếng Anh trẻ em', 'Học qua trò chơi, phát âm cơ bản', 180000, 'giờ', 60),
          s('gia-su-van', 'Gia sư Văn', 'Dạy kèm Ngữ văn, luyện viết', 140000, 'giờ', 90),
        ],
      },
    ],
  },
  {
    slug: 'tro-ly-tu-xa',
    name: 'Trợ lý từ xa - vận hành',
    description: 'Trợ lý ảo theo giờ, nhập liệu, quản lý lịch, báo cáo định kỳ',
    icon: 'clock',
    sortOrder: 20,
    isFeatured: true,
    categories: [
      {
        slug: 'tro-ly-ao',
        name: 'Trợ lý ảo',
        services: [
          s('tro-ly-ao-theo-gio', 'Trợ lý ảo theo giờ', 'Hỗ trợ việc hành chính từ xa theo ca', 150000, 'giờ', 120),
          s('quan-ly-email-lich', 'Quản lý email – lịch hẹn', 'Lọc email, sắp lịch, nhắc việc hàng ngày', 800000, 'tháng', 180),
          s('dat-lich-goi-khach', 'Đặt lịch – gọi khách', 'Gọi xác nhận lịch hẹn, nhắc khách', 180000, 'giờ', 120),
          s('nop-ho-so-hanh-chinh', 'Nộp hồ sơ hành chính', 'Đi nộp / nhận kết quả hộ giấy tờ', 180000, 'hồ sơ', 120),
        ],
      },
      {
        slug: 'nhap-lieu-bao-cao',
        name: 'Nhập liệu - báo cáo',
        services: [
          s('nhap-lieu', 'Nhập liệu', 'Nhập đơn, danh sách khách, hóa đơn vào file', 100000, 'giờ', 120),
          s('lam-sach-du-lieu', 'Làm sạch dữ liệu', 'Chuẩn hóa, khử trùng lặp danh sách', 400000, 'gói', 180),
          s('nghien-cuu-thi-truong', 'Nghiên cứu thị trường', 'Thu thập giá, đối thủ, danh sách khách tiềm năng', 600000, 'gói', 240),
          s('lam-bao-cao-dinh-ky', 'Làm báo cáo định kỳ', 'Tổng hợp số liệu tuần / tháng theo mẫu', 500000, 'gói', 180),
        ],
      },
    ],
  },
  {
    slug: 'tu-van-phat-trien',
    name: 'Tư vấn - phát triển cá nhân',
    description: 'Hướng nghiệp, coach sự nghiệp, kỹ năng, đồng hành cân bằng',
    icon: 'users',
    sortOrder: 21,
    isFeatured: true,
    categories: [
      {
        slug: 'huong-nghiep-su-nghiep',
        name: 'Hướng nghiệp - sự nghiệp',
        services: [
          s('tu-van-huong-nghiep', 'Tư vấn hướng nghiệp', 'Định hướng ngành học, nghề nghiệp', 400000, 'buổi', 60),
          s('coach-su-nghiep', 'Coach sự nghiệp', 'Lộ trình thăng tiến, chuyển ngành', 600000, 'buổi', 60),
          s('luyen-phong-van', 'Luyện phỏng vấn', 'Phỏng vấn thử và nhận xét chi tiết', 350000, 'buổi', 60),
          s('toi-uu-cv-linkedin', 'Tối ưu CV – LinkedIn', 'Viết lại CV và hồ sơ LinkedIn', 400000, 'bộ', 90),
          s('luyen-thi-dai-hoc', 'Luyện thi đại học', 'Ôn khối A/B/C/D theo môn', 180000, 'giờ', 90),
        ],
      },
      {
        slug: 'ky-nang-can-bang',
        name: 'Kỹ năng - cân bằng',
        services: [
          s('coach-quan-ly-thoi-gian', 'Coach quản lý thời gian', 'Sắp xếp công việc, thói quen làm việc', 350000, 'buổi', 60),
          s('tu-van-dinh-duong-online', 'Tư vấn dinh dưỡng online', 'Đồng hành thực đơn; không thay tư vấn y tế', 300000, 'buổi', 60),
          s('tham-van-tam-ly-online', 'Tham vấn tâm lý online', 'Người làm có chứng chỉ; không thay điều trị y khoa', 500000, 'buổi', 60),
          s('huong-dan-thien-chanh-niem', 'Hướng dẫn thiền chánh niệm', 'Thực hành thở, thiền theo buổi', 250000, 'buổi', 45),
          s('lap-ke-hoach-tai-chinh', 'Lập kế hoạch tài chính cá nhân', 'Ngân sách, tiết kiệm, mục tiêu dài hạn', 500000, 'buổi', 90),
        ],
      },
    ],
  },
  {
    slug: 'giai-tri',
    name: 'Giải trí',
    description: 'Biểu diễn online, trò chơi, đồng hành xem phim / kể chuyện — không cày thuê game, không nội dung người lớn',
    icon: 'sparkles',
    sortOrder: 22,
    isFeatured: true,
    categories: [
      {
        slug: 'bieu-dien-online',
        name: 'Biểu diễn online',
        services: [
          s('hat-live-online', 'Hát live / karaoke đồng hành', 'Hát live hoặc hát cùng qua video call', 250000, 'buổi', 60),
          s('day-nhac-tai-nha', 'Dạy nhạc tại nhà', 'Guitar, piano, thanh nhạc cơ bản', 200000, 'giờ', 60),
          s('ao-thuat-online', 'Ảo thuật online', 'Biểu diễn ảo thuật / ảo giác trên camera', 350000, 'buổi', 45),
          s('dj-online', 'DJ / mix nhạc online', 'Mix set nhạc cho tiệc / họp mặt trực tuyến', 400000, 'buổi', 90),
          s('mc-tiec-online', 'MC tiệc / sinh nhật online', 'Dẫn chương trình tiệc riêng tư qua Meet / Zoom', 500000, 'buổi', 90),
        ],
      },
      {
        slug: 'tro-choi-giai-tri',
        name: 'Trò chơi giải trí',
        services: [
          s('dm-rpg-online', 'Game master RPG online', 'Dẫn phiên chơi nhập vai (D&D / tương tự)', 300000, 'buổi', 180),
          s('choi-board-game-online', 'Dẫn board game online', 'Hướng dẫn và chơi board / card game qua mạng', 200000, 'buổi', 120),
          s('coach-co-vua-online', 'Cờ vua / cờ tướng online', 'Chơi kèm hoặc chỉ kỹ thuật cơ bản', 180000, 'buổi', 60),
          s('to-chuc-quiz-online', 'Tổ chức quiz / mini game', 'Lên câu hỏi, dẫn đêm quiz cho nhóm bạn / team', 450000, 'buổi', 90),
        ],
      },
      {
        slug: 'dong-hanh-giai-tri',
        name: 'Đồng hành giải trí',
        services: [
          s('ke-chuyen-online', 'Kể chuyện / đọc sách online', 'Kể chuyện thiếu nhi hoặc đọc sách theo giờ', 150000, 'buổi', 45),
          s('xem-phim-dong-hanh', 'Xem phim đồng hành', 'Cùng xem / bình luận phim theo chủ đề (không phát lại bản quyền)', 180000, 'buổi', 120),
          s('tro-chuyen-giai-tri', 'Trò chuyện giải trí theo chủ đề', 'Trò chuyện thư giãn; không hẹn hò / nội dung người lớn', 120000, 'giờ', 60),
          s('goi-y-playlist', 'Gợi ý playlist theo mood', 'Curate playlist Spotify / YouTube theo không khí', 150000, 'gói', 45),
        ],
      },
    ],
  },
];

// Chặn sai chính tả slug: mọi slug đánh dấu online phải tồn tại trong catalog.
const allSlugs = new Set(
  catalogGroups.flatMap((group) =>
    group.categories.flatMap((category) =>
      category.services.map((service) => service.slug),
    ),
  ),
);
const unknownOnlineSlugs = [...ONLINE_SERVICE_SLUGS].filter(
  (slug) => !allSlugs.has(slug),
);
if (unknownOnlineSlugs.length) {
  throw new Error(
    `ONLINE_SERVICE_SLUGS chứa slug không có trong catalog: ${unknownOnlineSlugs.join(', ')}`,
  );
}
