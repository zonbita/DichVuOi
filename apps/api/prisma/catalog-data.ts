/**
 * Catalog seed: Group → Category → Service (nghề cụ thể).
 * Đồng bộ tầm nhìn với README mục "Nhóm dịch vụ bao quát".
 * Catalog công khai chỉ hiện Service.supportsOnline=true.
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

function s(
  slug: string,
  name: string,
  description: string,
  basePrice: number,
  unit: string,
  durationMin: number,
  supportsOnline = false,
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
    supportsOnline,
  };
}

/** Nghề online / hybrid làm được từ xa. */
const o = (
  slug: string,
  name: string,
  description: string,
  basePrice: number,
  unit: string,
  durationMin: number,
) => s(slug, name, description, basePrice, unit, durationMin, true);

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
    description:
      'Gia sư các môn, ngoại ngữ, luyện thi quốc tế / ĐH; dạy nhạc, vẽ, tin học từ xa',
    icon: 'book',
    sortOrder: 8,
    isFeatured: true,
    categories: [
      {
        slug: 'gia-su',
        name: 'Gia sư',
        services: [
          o('gia-su-toan', 'Gia sư Toán', 'Dạy kèm Toán THCS / THPT / đại cương', 150000, 'giờ', 90),
          o('gia-su-ly', 'Gia sư Lý', 'Dạy kèm Vật lý THCS / THPT', 150000, 'giờ', 90),
          o('gia-su-hoa', 'Gia sư Hóa', 'Dạy kèm Hóa học THCS / THPT', 150000, 'giờ', 90),
          o('gia-su-sinh', 'Gia sư Sinh', 'Dạy kèm Sinh học THCS / THPT', 150000, 'giờ', 90),
          o('gia-su-van', 'Gia sư Văn', 'Dạy kèm Ngữ văn, luyện viết', 140000, 'giờ', 90),
          o('gia-su-su', 'Gia sư Sử', 'Dạy kèm Lịch sử THCS / THPT', 140000, 'giờ', 90),
          o('gia-su-dia', 'Gia sư Địa', 'Dạy kèm Địa lý THCS / THPT', 140000, 'giờ', 90),
          o('gia-su-tin', 'Gia sư Tin học', 'Tin học phổ thông, lập trình cơ bản cho HS', 160000, 'giờ', 90),
        ],
      },
      {
        slug: 'ngoai-ngu',
        name: 'Ngoại ngữ',
        services: [
          o('tieng-anh-giao-tiep', 'Tiếng Anh giao tiếp', 'Luyện nói tiếng Anh thực tế', 200000, 'giờ', 60),
          o('tieng-anh-tre-em', 'Tiếng Anh trẻ em', 'Học qua trò chơi, phát âm cơ bản', 180000, 'giờ', 60),
          o('tieng-nhat', 'Gia sư tiếng Nhật', 'Tiếng Nhật N5–N3 / giao tiếp', 220000, 'giờ', 60),
          o('tieng-han', 'Gia sư tiếng Hàn', 'Tiếng Hàn giao tiếp / TOPIK cơ bản', 220000, 'giờ', 60),
          o('tieng-trung', 'Gia sư tiếng Trung', 'Hán ngữ giao tiếp / HSK cơ bản', 200000, 'giờ', 60),
          o('tieng-duc', 'Gia sư tiếng Đức', 'Đức giao tiếp / A1–B1', 220000, 'giờ', 60),
          o('tieng-phap', 'Gia sư tiếng Pháp', 'Pháp giao tiếp / DELF cơ bản', 220000, 'giờ', 60),
          o('tieng-tay-ban-nha', 'Gia sư tiếng Tây Ban Nha', 'Tây Ban Nha giao tiếp cơ bản', 220000, 'giờ', 60),
          o('tieng-viet-cho-nn', 'Tiếng Việt cho người nước ngoài', 'Giao tiếp, phát âm, văn hóa VN', 200000, 'giờ', 60),
        ],
      },
      {
        slug: 'luyen-thi',
        name: 'Luyện thi',
        services: [
          o('gia-su-ielts', 'Gia sư IELTS', 'Luyện thi IELTS 1 kèm 1', 250000, 'giờ', 90),
          o('luyen-thi-toeic', 'Luyện thi TOEIC', 'Luyện đề và chiến thuật làm bài', 200000, 'giờ', 90),
          o('luyen-thi-toefl', 'Luyện thi TOEFL', 'TOEFL iBT / chiến thuật từng kỹ năng', 250000, 'giờ', 90),
          o('luyen-thi-sat', 'Luyện thi SAT', 'Math / Evidence-Based Reading & Writing', 300000, 'giờ', 90),
          o('luyen-thi-gre', 'Luyện thi GRE', 'Verbal / Quant / AWA cơ bản', 350000, 'giờ', 90),
          o('luyen-thi-gmat', 'Luyện thi GMAT', 'Quant / Verbal / IR chiến thuật', 350000, 'giờ', 90),
          o('luyen-thi-jlpt', 'Luyện thi JLPT', 'Ôn JLPT N5–N2', 220000, 'giờ', 90),
          o('luyen-thi-topik', 'Luyện thi TOPIK', 'Ôn TOPIK I–II', 220000, 'giờ', 90),
          o('luyen-thi-hsk', 'Luyện thi HSK', 'Ôn HSK 1–6', 220000, 'giờ', 90),
          o('luyen-thi-vstep', 'Luyện thi VSTEP', 'Ôn VSTEP theo khung CEFR', 200000, 'giờ', 90),
          o('luyen-thi-dai-hoc', 'Luyện thi đại học', 'Ôn khối A/B/C/D theo môn', 180000, 'giờ', 90),
        ],
      },
      {
        slug: 'ky-nang-hoc',
        name: 'Kỹ năng học',
        services: [
          o('day-nhac-tai-nha', 'Dạy nhạc online', 'Guitar, piano, thanh nhạc qua video call', 200000, 'giờ', 60),
          o('day-ve', 'Dạy vẽ', 'Vẽ cơ bản, luyện thi năng khiếu', 180000, 'giờ', 90),
          o('tin-hoc-van-phong', 'Tin học văn phòng', 'Word, Excel, PowerPoint theo nhu cầu', 150000, 'giờ', 90),
          o('day-lap-trinh-tre', 'Dạy lập trình cho trẻ', 'Scratch / Python cơ bản cho trẻ', 200000, 'giờ', 60),
          o('day-excel-nang-cao', 'Dạy Excel nâng cao', 'Hàm nâng cao, PivotTable, dashboard', 250000, 'giờ', 90),
          o('day-canva-co-ban', 'Dạy Canva cơ bản', 'Tự thiết kế ấn phẩm bán hàng', 180000, 'giờ', 60),
          o('day-ai-cho-cong-viec', 'Dạy dùng AI cho công việc', 'Ứng dụng AI vào soạn thảo, báo cáo', 300000, 'giờ', 60),
        ],
      },
    ],
  },
  {
    slug: 'game',
    name: 'Game - eSports',
    description:
      'Coaching, QA game, dạy / làm game, edit stream, caster — không boosting / cày thuê',
    icon: 'game',
    sortOrder: 9,
    isFeatured: true,
    categories: [
      {
        slug: 'esports',
        name: 'eSports & coaching',
        services: [
          o(
            'coaching-game',
            'Coaching game',
            'Coaching 1 kèm 1 / VOD review cho Liên Quân, LMHT, Valorant, PUBG, FC Online… (không boosting)',
            120000,
            'giờ',
            60,
          ),
          o('game-tester-qa', 'Game Tester (QA)', 'Test build, báo bug, checklist chơi thử', 200000, 'giờ', 120),
          o('caster-binh-luan', 'Caster / bình luận trận', 'Bình luận live hoặc thu sẵn highlight', 400000, 'buổi', 120),
          o('to-chuc-giai-dau', 'Tổ chức giải đấu online', 'Bracket, luật, điều phối giải nhỏ', 1500000, 'gói', 360),
          o('quan-ly-cong-dong-game', 'Quản lý cộng đồng game', 'Discord / Facebook group, sự kiện cộng đồng', 1200000, 'tháng', 180),
        ],
      },
      {
        slug: 'lam-game-stream',
        name: 'Làm game & stream',
        services: [
          o('day-lam-game-co-ban', 'Dạy làm game cơ bản', 'Giới thiệu Unity / Godot cơ bản', 300000, 'giờ', 90),
          o('lap-trinh-game', 'Lập trình game nhỏ', 'Prototype / mini-game theo brief', 2000000, 'gói', 480),
          o('thiet-ke-do-hoa-game', 'Thiết kế đồ họa game', 'Sprite, UI in-game, asset 2D cơ bản', 800000, 'gói', 240),
          o('edit-highlight-stream', 'Edit highlight / stream', 'Cắt highlight, intro stream', 250000, 'video', 120),
          o('thiet-ke-overlay-stream', 'Thiết kế overlay stream', 'Overlay, alert, khung camera', 300000, 'gói', 120),
          o('thumbnail-gaming', 'Thumbnail gaming', 'Ảnh bìa YouTube / TikTok gaming', 80000, 'ảnh', 30),
          o('dich-game', 'Dịch / localize game', 'Dịch UI, phụ đề, chuỗi hội thoại game', 150000, 'trang', 60),
          o('voice-over-nhan-vat', 'VO nhân vật game', 'Thu thoại nhân vật / trailer game', 250000, 'clip', 60),
          o('huong-dan-len-song-stream', 'Hướng dẫn lên sóng stream', 'Setup OBS, kịch bản buổi stream', 250000, 'buổi', 90),
          s('setup-pc-gaming', 'Setup / tối ưu PC gaming', 'Cài đặt, tối ưu hiệu năng máy chơi game tại chỗ', 300000, 'lần', 120),
        ],
      },
    ],
  },
  {
    slug: 'lap-trinh',
    name: 'Lập trình - công nghệ',
    description:
      'Frontend/Backend/Mobile/DevOps/QA, AI, WordPress, SEO kỹ thuật, hỗ trợ máy từ xa, Excel',
    icon: 'code',
    sortOrder: 10,
    isFeatured: true,
    categories: [
      {
        slug: 'dev-chuyen-mon',
        name: 'Lập trình chuyên môn',
        services: [
          o('frontend-dev', 'Frontend Developer', 'React / Vue / HTML-CSS theo brief', 800000, 'gói', 240),
          o('backend-dev', 'Backend Developer', 'API, DB, auth cho sản phẩm nhỏ', 1000000, 'gói', 300),
          o('fullstack-dev', 'Fullstack Developer', 'Web đầy đủ FE + BE theo MVP', 2000000, 'gói', 480),
          o('mobile-dev', 'Mobile Developer', 'App Flutter / React Native nhỏ', 2500000, 'gói', 480),
          o('devops-engineer', 'DevOps', 'CI/CD, deploy, Docker cơ bản', 1500000, 'gói', 240),
          o('qa-software', 'QA / Software Tester', 'Viết test case, manual / automation cơ bản', 500000, 'gói', 180),
          o('game-dev', 'Game Dev', 'Gameplay script, tích hợp asset (Unity/Godot)', 2000000, 'gói', 480),
          o('lap-trinh-freelance', 'Lập trình freelance nhỏ', 'Landing, bot, fix bug theo yêu cầu', 500000, 'gói', 240),
          o('lam-website-wordpress', 'Website WordPress', 'Dựng site giới thiệu / blog cơ bản', 1500000, 'gói', 480),
          o('seo-ky-thuat', 'SEO kỹ thuật', 'Audit tốc độ, meta, sitemap cơ bản', 800000, 'gói', 240),
          o('sua-loi-website', 'Sửa lỗi website', 'Fix lỗi giao diện, chức năng, hosting', 400000, 'lần', 120),
          o('toi-uu-toc-do-web', 'Tối ưu tốc độ web', 'Tăng điểm PageSpeed, nén tài nguyên', 600000, 'gói', 180),
          o('dung-app-mvp', 'Dựng app MVP', 'Bản chạy được đầu tiên cho ý tưởng nhỏ', 5000000, 'gói', 480),
          o('ho-tro-may-tinh-tu-xa', 'Hỗ trợ máy tính từ xa', 'Xử lý lỗi phần mềm qua điều khiển từ xa', 150000, 'lần', 60),
          s('sua-may-cai-dat', 'Sửa máy / cài đặt tại chỗ', 'Cài Windows, phần mềm tại địa chỉ khách', 200000, 'lần', 90),
          s('cai-mang-van-phong', 'Cài mạng văn phòng', 'Setup router, switch, Wi‑Fi VP nhỏ', 400000, 'lần', 180),
        ],
      },
      {
        slug: 'ai-cong-nghe',
        name: 'AI & tự động hóa',
        services: [
          o('ai-engineer', 'AI Engineer', 'Tích hợp model, pipeline AI cho sản phẩm nhỏ', 3000000, 'gói', 480),
          o('prompt-engineer', 'Prompt Engineer', 'Thiết kế prompt, playbook ChatGPT/Claude', 800000, 'gói', 180),
          o('ai-automation', 'AI Automation', 'Tự động hóa quy trình bằng AI + no-code', 1200000, 'gói', 240),
          o('ai-chatbot', 'AI Chatbot', 'Chatbot FAQ / CSKH trên web hoặc Zalo OA', 1500000, 'gói', 360),
          o('ai-consultant', 'AI Consultant', 'Tư vấn chọn tool AI, lộ trình áp dụng', 1000000, 'buổi', 90),
          o('chatbot-api', 'Chatbot / API nhỏ', 'Tích hợp chatbot hoặc API đơn giản', 800000, 'gói', 360),
          o('excel-tu-dong-hoa', 'Excel / tự động hóa', 'Công thức, macro, báo cáo tự động', 300000, 'gói', 120),
          o('google-workspace', 'Hỗ trợ Google Workspace', 'Drive, Sheet, Form, quy trình cộng tác', 250000, 'gói', 90),
          o('tu-dong-hoa-quy-trinh', 'Tự động hóa quy trình', 'Nối app bằng n8n / Zapier, bỏ thao tác tay', 900000, 'gói', 240),
          o('phan-tich-du-lieu', 'Phân tích dữ liệu', 'Làm sạch, phân tích và diễn giải số liệu', 700000, 'gói', 240),
          o('dung-dashboard-bao-cao', 'Dựng dashboard báo cáo', 'Looker Studio / Power BI cơ bản', 1200000, 'gói', 300),
        ],
      },
    ],
  },
  {
    slug: 'thiet-ke',
    name: 'Thiết kế - sáng tạo nội dung',
    description:
      'UI/UX, graphic, 3D, video/motion, content writer, AI content — làm từ xa',
    icon: 'design',
    sortOrder: 11,
    isFeatured: true,
    categories: [
      {
        slug: 'thiet-ke-do-hoa',
        name: 'Thiết kế đồ họa',
        services: [
          o('thiet-ke-ui-ux', 'Thiết kế UI/UX', 'Wireframe / mockup màn hình app-web', 800000, 'gói', 240),
          o('thiet-ke-banner-logo', 'Thiết kế banner – logo', 'Thiết kế nhận diện cơ bản', 300000, 'gói', 120),
          o('graphic-design', 'Graphic Designer', 'Ấn phẩm quảng cáo, poster, bộ nhận diện', 400000, 'gói', 120),
          o('illustrator', 'Illustrator', 'Minh họa vector / character theo brief', 500000, 'ảnh', 120),
          o('thiet-ke-3d', 'Thiết kế 3D', 'Model / render sản phẩm hoặc scene đơn giản', 800000, 'gói', 180),
          o('interior-online', 'Interior design (online)', 'Moodboard, layout 2D/3D từ xa', 1200000, 'gói', 240),
          o('retouch-anh', 'Retoucher', 'Chỉnh màu, làm đẹp ảnh sản phẩm / chân dung', 100000, 'ảnh', 45),
          o('thiet-ke-slide', 'Thiết kế slide thuyết trình', 'Slide pitch / báo cáo chuyên nghiệp', 400000, 'bộ', 120),
          o('thiet-ke-thumbnail', 'Thiết kế thumbnail', 'Ảnh bìa YouTube / TikTok bắt mắt', 80000, 'ảnh', 30),
          o('an-pham-mang-xa-hoi', 'Ấn phẩm mạng xã hội', 'Bộ post theo bộ nhận diện thương hiệu', 200000, 'bộ', 90),
          o('thiet-ke-menu-catalogue', 'Thiết kế menu / catalogue', 'Menu quán, catalogue sản phẩm PDF', 500000, 'gói', 180),
        ],
      },
      {
        slug: 'video-audio',
        name: 'Video - audio',
        services: [
          o('edit-video-ngan', 'Video Editor', 'TikTok / Reels / Short / YouTube ngắn', 250000, 'video', 120),
          o('motion-graphic-ngan', 'Motion graphic', 'Video đồ họa chuyển động 15–30 giây', 700000, 'video', 180),
          o('ai-video', 'AI Video', 'Dựng video bằng tool AI theo kịch bản', 400000, 'video', 120),
          o('voice-over', 'Voice-over / Audio', 'Thu âm thuyết minh, podcast intro', 200000, 'clip', 60),
          o('dung-podcast', 'Dựng – xử lý podcast', 'Cắt ghép, lọc tạp âm, chuẩn hóa âm lượng', 350000, 'tập', 120),
        ],
      },
      {
        slug: 'content-viet',
        name: 'Content & viết',
        services: [
          o('viet-content', 'Content Writer', 'Caption, bài đăng mạng xã hội', 150000, 'bài', 60),
          o('copywriter', 'Copywriter', 'Copy landing, ads, email bán hàng', 300000, 'bài', 90),
          o('technical-writer', 'Technical Writer', 'Tài liệu kỹ thuật, hướng dẫn dùng', 400000, 'bài', 120),
          o('ghostwriter', 'Ghostwriter', 'Viết bài / sách mỏng dưới tên khách', 500000, 'bài', 180),
          o('bien-tap-noi-dung', 'Biên tập nội dung', 'Soát lỗi, chỉnh văn phong bản thảo', 200000, 'bài', 60),
          o('viet-bai-seo', 'Viết bài chuẩn SEO', 'Bài blog theo từ khóa mục tiêu', 250000, 'bài', 90),
          o('viet-kich-ban-video', 'Viết kịch bản video', 'Kịch bản TikTok / Reels / quảng cáo', 200000, 'kịch bản', 60),
          o('ai-content', 'AI Content / Image', 'Sinh nội dung & ảnh bằng AI theo brief', 250000, 'gói', 90),
        ],
      },
    ],
  },
  {
    slug: 'su-kien',
    name: 'Sự kiện - truyền thông',
    description: 'Webinar, MC online, livestream từ xa; chụp/quay và trang trí tại chỗ',
    icon: 'camera',
    sortOrder: 12,
    isFeatured: false,
    categories: [
      {
        slug: 'su-kien-truyen-thong',
        name: 'Sự kiện tại chỗ',
        services: [
          s('chup-quay-su-kien', 'Chụp / quay sự kiện', 'Chụp ảnh và quay video sự kiện nhỏ', 1500000, 'buổi', 240),
          s('mc-su-kien', 'MC sự kiện', 'MC dẫn chương trình tiệc, khai trương', 1200000, 'buổi', 180),
          s('livestream-ban-hang', 'Livestream bán hàng tại chỗ', 'Hỗ trợ livestream bán hàng / sự kiện', 800000, 'buổi', 180),
          s('trang-tri-tiec', 'Trang trí tiệc nhỏ', 'Trang trí sinh nhật, khai trương quy mô nhỏ', 1000000, 'gói', 240),
          s('ban-nhac-acoustic', 'Ban nhạc acoustic', 'Biểu diễn acoustic 3–5 bài', 2000000, 'buổi', 120),
          s('setup-am-thanh', 'Setup âm thanh / ánh sáng nhỏ', 'Cho tiệc, workshop quy mô nhỏ', 900000, 'buổi', 180),
        ],
      },
      {
        slug: 'su-kien-truc-tuyen',
        name: 'Sự kiện trực tuyến',
        services: [
          o('to-chuc-webinar', 'Tổ chức webinar', 'Lên kịch bản, điều phối hội thảo online', 1200000, 'buổi', 240),
          o('mc-online', 'MC online', 'Dẫn chương trình họp mặt / ra mắt online', 800000, 'buổi', 120),
          o('ho-tro-ky-thuat-hop-truc-tuyen', 'Hỗ trợ kỹ thuật họp trực tuyến', 'Trực Zoom / Meet, chia phòng, ghi hình', 500000, 'buổi', 180),
          o('livestream-operator-tu-xa', 'Livestream Operator từ xa', 'Điều khiển OBS, scene, chat moderation từ xa', 700000, 'buổi', 180),
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
    description: 'PT / yoga / coach chạy online; PT gym và môn tại chỗ',
    icon: 'dumbbell',
    sortOrder: 14,
    isFeatured: false,
    categories: [
      {
        slug: 'pt-the-thao',
        name: 'Huấn luyện tại chỗ',
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
          o('pt-online', 'PT online 1 kèm 1', 'Tập theo camera, sửa động tác trực tiếp', 200000, 'buổi', 60),
          o('yoga-online', 'Yoga online', 'Lớp yoga cá nhân hoặc nhóm nhỏ qua video', 150000, 'buổi', 60),
          o('giao-an-tap-ca-nhan', 'Giáo án tập cá nhân hóa', 'Lịch tập và dinh dưỡng theo mục tiêu', 500000, 'gói', 120),
          o('coach-chay-bo-online', 'Coach chạy bộ online', 'Theo dõi cự ly, nhịp tim, điều chỉnh lịch', 400000, 'tháng', 90),
        ],
      },
    ],
  },
  {
    slug: 'doanh-nghiep',
    name: 'Doanh nghiệp - văn phòng',
    description: 'CSKH / tuyển dụng / đào tạo từ xa; dọn VP và lễ tân tại chỗ',
    icon: 'briefcase',
    sortOrder: 15,
    isFeatured: false,
    categories: [
      {
        slug: 'van-phong',
        name: 'Văn phòng tại chỗ',
        services: [
          s('don-van-phong', 'Dọn văn phòng', 'Vệ sinh định kỳ văn phòng, khu làm việc', 500000, 'lần', 180),
          s('ve-sinh-cong-nghiep', 'Vệ sinh công nghiệp', 'Vệ sinh nhà xưởng / mặt bằng lớn', 2000000, 'gói', 480),
          s('le-tan-thoi-vu', 'Lễ tân thời vụ', 'Nhân sự lễ tân theo ca / sự kiện', 300000, 'ca', 240),
          s('tea-break', 'Phục vụ tea-break', 'Chuẩn bị đồ uống / bánh cho họp', 400000, 'buổi', 120),
        ],
      },
      {
        slug: 'van-hanh-tu-xa',
        name: 'Vận hành từ xa',
        services: [
          o('cham-soc-khach-hang-tu-xa', 'Chăm sóc khách hàng từ xa', 'Trực hotline / chat theo ca', 200000, 'giờ', 120),
          o('ho-tro-tuyen-dung', 'Hỗ trợ tuyển dụng', 'Đăng tin, lọc CV, hẹn lịch phỏng vấn', 1500000, 'vị trí', 240),
          o('soan-quy-trinh-noi-bo', 'Soạn quy trình nội bộ', 'Chuẩn hóa quy trình, biểu mẫu làm việc', 1200000, 'gói', 240),
          o('dao-tao-nhan-vien-online', 'Đào tạo nhân viên online', 'Buổi đào tạo kỹ năng theo chủ đề', 800000, 'buổi', 120),
          o('ke-toan-ho-kd', 'Kế toán hộ kinh doanh', 'Hỗ trợ sổ sách, kê khai cơ bản cho hộ KD', 800000, 'tháng', 240),
          o('tro-ly-hanh-chinh', 'Trợ lý hành chính theo giờ', 'Hỗ trợ giấy tờ, sắp xếp lịch VP từ xa', 180000, 'giờ', 120),
        ],
      },
    ],
  },
  {
    slug: 'tai-chinh',
    name: 'Tài chính – hành chính – pháp lý hỗ trợ',
    description:
      'Báo cáo TC, tư vấn thuế / luật / HR online (đối tác có phép khi pháp luật yêu cầu)',
    icon: 'scale',
    sortOrder: 16,
    isFeatured: false,
    categories: [
      {
        slug: 'tai-chinh-online',
        name: 'Tài chính - pháp lý online',
        services: [
          o('bao-cao-tai-chinh-don-gian', 'Báo cáo tài chính đơn giản', 'Tổng hợp thu chi, lãi lỗ cho hộ / shop nhỏ', 700000, 'gói', 180),
          o('tu-van-thue-online', 'Tư vấn thuế online', 'Tư vấn kê khai / tối ưu cơ bản (có phép)', 600000, 'buổi', 60),
          o('ke-khai-thue-co-ban', 'Kê khai thuế cơ bản', 'Hỗ trợ tờ khai định kỳ (đối tác có phép)', 500000, 'lần', 120),
          o('luat-su-tu-van-online', 'Luật sư tư vấn online', 'Tư vấn pháp lý cơ bản qua họp online (có phép)', 800000, 'buổi', 60),
          o('hr-tu-van-online', 'Tư vấn HR online', 'Hợp đồng LĐ, nội quy, quy trình nhân sự', 700000, 'buổi', 90),
          o('ra-soat-hop-dong-mau', 'Rà soát hợp đồng mẫu', 'Đọc và ghi chú rủi ro (đối tác có chuyên môn)', 600000, 'hồ sơ', 120),
          o('tu-van-thu-tuc', 'Tư vấn thủ tục cơ bản', 'Hướng dẫn checklist thủ tục thường gặp', 300000, 'buổi', 60),
          o('lap-ke-hoach-tai-chinh', 'Lập kế hoạch tài chính', 'Ngân sách hộ / cá nhân, mục tiêu dài hạn', 500000, 'buổi', 90),
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
    description: 'SEO, ads, SMM, vận hành Shopee / TikTok Shop / Lazada, inbox, listing',
    icon: 'chart',
    sortOrder: 18,
    isFeatured: true,
    categories: [
      {
        slug: 'quang-cao-so',
        name: 'Quảng cáo & SEO',
        services: [
          o('seo-specialist', 'SEO Specialist', 'SEO on-page / off-page, tăng traffic hữu cơ', 2000000, 'tháng', 240),
          o('chay-ads-facebook', 'Chạy ads Facebook', 'Lên chiến dịch, tối ưu ngân sách theo tháng', 1500000, 'tháng', 240),
          o('chay-ads-google', 'Chạy ads Google', 'Search / Shopping cho shop và dịch vụ nhỏ', 1800000, 'tháng', 240),
          o('chay-ads-tiktok', 'Chạy ads TikTok', 'Set up và tối ưu quảng cáo TikTok', 1500000, 'tháng', 240),
          o('email-marketing', 'Email / newsletter marketing', 'Chuỗi email nurture, template, đo mở', 800000, 'tháng', 180),
          o('affiliate-marketing', 'Affiliate marketing', 'Setup chương trình / theo dõi đối tác bán', 1000000, 'tháng', 180),
          o('nghien-cuu-tu-khoa', 'Nghiên cứu từ khóa', 'Bộ từ khóa và định hướng nội dung', 500000, 'gói', 120),
          o('toi-uu-ty-le-chuyen-doi', 'Tối ưu tỉ lệ chuyển đổi', 'Rà soát landing, phễu bán hàng', 900000, 'gói', 180),
        ],
      },
      {
        slug: 'van-hanh-kenh-ban',
        name: 'Vận hành kênh bán',
        services: [
          o('quan-ly-fanpage', 'Social Media Manager', 'Lên lịch bài, trả lời khách theo tháng', 1200000, 'tháng', 180),
          o('van-hanh-shopee', 'Shopee Operator', 'Đăng sản phẩm, chạy khuyến mãi, xử lý đơn', 1500000, 'tháng', 240),
          o('van-hanh-tiktok-shop', 'TikTok Shop Operator', 'Quản lý sản phẩm, chiến dịch, đơn hàng', 1500000, 'tháng', 240),
          o('van-hanh-lazada', 'Lazada Operator', 'Vận hành gian hàng Lazada theo tháng', 1500000, 'tháng', 240),
          o('cham-soc-inbox', 'Chăm sóc inbox / bình luận', 'Trực tin nhắn và bình luận theo khung giờ', 800000, 'tháng', 180),
          o('viet-mo-ta-san-pham', 'Product listing', 'Mô tả bán hàng chuẩn sàn TMĐT', 120000, 'sản phẩm', 45),
        ],
      },
    ],
  },
  {
    slug: 'ngon-ngu',
    name: 'Dịch thuật - ngôn ngữ',
    description: 'Biên dịch, hiệu đính, phiên dịch online, phụ đề, gỡ băng, chuẩn hóa CV',
    icon: 'book',
    sortOrder: 19,
    isFeatured: true,
    categories: [
      {
        slug: 'bien-dich',
        name: 'Biên dịch',
        services: [
          o('dich-anh-viet', 'Dịch Anh – Việt', 'Dịch tài liệu, email, hồ sơ hai chiều', 120000, 'trang', 60),
          o('dich-trung-viet', 'Dịch Trung – Việt', 'Dịch tài liệu thương mại, hợp đồng cơ bản', 140000, 'trang', 60),
          o('dich-nhat-viet', 'Dịch Nhật – Việt', 'Dịch tài liệu kỹ thuật, hồ sơ cá nhân', 160000, 'trang', 60),
          o('dich-han-viet', 'Dịch Hàn – Việt', 'Dịch tài liệu, nội dung marketing', 160000, 'trang', 60),
          o('hieu-dinh-van-ban', 'Hiệu đính văn bản', 'Soát lỗi, chuẩn hóa văn phong bản dịch', 80000, 'trang', 45),
        ],
      },
      {
        slug: 'phien-dich-phu-de',
        name: 'Phiên dịch - phụ đề',
        services: [
          o('phien-dich-online', 'Phiên dịch online', 'Phiên dịch họp qua Zoom / Google Meet', 400000, 'giờ', 60),
          o('lam-phu-de-video', 'Làm phụ đề video', 'Phụ đề song ngữ, canh timing', 150000, 'phút video', 60),
          o('go-bang-ghi-am', 'Gỡ băng ghi âm', 'Chuyển audio phỏng vấn thành văn bản', 100000, 'phút audio', 45),
          o('chuan-hoa-cv-tieng-anh', 'Chuẩn hóa CV tiếng Anh', 'Dịch và chuẩn hóa CV, thư xin việc', 300000, 'bộ', 90),
        ],
      },
    ],
  },
  {
    slug: 'tro-ly-tu-xa',
    name: 'Trợ lý từ xa - vận hành',
    description:
      'VA, appointment setter, live chat, data entry, research, sales online / lead gen',
    icon: 'clock',
    sortOrder: 20,
    isFeatured: true,
    categories: [
      {
        slug: 'tro-ly-ao',
        name: 'Trợ lý ảo',
        services: [
          o('tro-ly-ao-theo-gio', 'Virtual Assistant (VA)', 'Hỗ trợ việc hành chính từ xa theo ca', 150000, 'giờ', 120),
          o('quan-ly-email-lich', 'Quản lý email – lịch hẹn', 'Lọc email, sắp lịch, nhắc việc hàng ngày', 800000, 'tháng', 180),
          o('dat-lich-goi-khach', 'Appointment Setter', 'Gọi xác nhận lịch hẹn, nhắc khách', 180000, 'giờ', 120),
          o('live-chat-support', 'Live Chat Support', 'Trực chat web / MXH theo khung giờ', 160000, 'giờ', 120),
          o('project-coordinator', 'Project Coordinator', 'Theo dõi task, deadline, báo cáo tiến độ', 250000, 'giờ', 120),
          s('nop-ho-so-hanh-chinh', 'Nộp hồ sơ hành chính', 'Đi nộp / nhận kết quả hộ giấy tờ tại chỗ', 180000, 'hồ sơ', 120),
        ],
      },
      {
        slug: 'nhap-lieu-bao-cao',
        name: 'Nhập liệu - nghiên cứu',
        services: [
          o('nhap-lieu', 'Data Entry', 'Nhập đơn, danh sách khách, hóa đơn vào file', 100000, 'giờ', 120),
          o('lam-sach-du-lieu', 'Làm sạch dữ liệu', 'Chuẩn hóa, khử trùng lặp danh sách', 400000, 'gói', 180),
          o('excel-ppt-ho-tro', 'Excel / PowerPoint hỗ trợ', 'Làm bảng, slide theo mẫu khách gửi', 200000, 'gói', 90),
          o('nghien-cuu-thi-truong', 'Research', 'Thu thập giá, đối thủ, danh sách khách tiềm năng', 600000, 'gói', 240),
          o('lam-bao-cao-dinh-ky', 'Làm báo cáo định kỳ', 'Tổng hợp số liệu tuần / tháng theo mẫu', 500000, 'gói', 180),
        ],
      },
      {
        slug: 'sales-online',
        name: 'Sales online',
        services: [
          o('sales-online', 'Sales Online', 'Tư vấn bán hàng qua chat / call theo script', 200000, 'giờ', 120),
          o('telesales', 'Telesales', 'Gọi lạnh / follow-up theo danh sách khách', 180000, 'giờ', 120),
          o('lead-gen', 'Lead Generation', 'Thu thập & làm sạch lead theo ICP', 700000, 'gói', 180),
        ],
      },
    ],
  },
  {
    slug: 'tu-van-phat-trien',
    name: 'Tư vấn - phát triển cá nhân',
    description:
      'Hướng nghiệp, career coach, phỏng vấn, CV–LinkedIn, dinh dưỡng / tâm lý online (chứng chỉ)',
    icon: 'users',
    sortOrder: 21,
    isFeatured: true,
    categories: [
      {
        slug: 'huong-nghiep-su-nghiep',
        name: 'Hướng nghiệp - sự nghiệp',
        services: [
          o('tu-van-huong-nghiep', 'Tư vấn hướng nghiệp', 'Định hướng ngành học, nghề nghiệp', 400000, 'buổi', 60),
          o('coach-su-nghiep', 'Career Coach', 'Lộ trình thăng tiến, chuyển ngành', 600000, 'buổi', 60),
          o('luyen-phong-van', 'Luyện phỏng vấn', 'Phỏng vấn thử và nhận xét chi tiết', 350000, 'buổi', 60),
          o('toi-uu-cv-linkedin', 'Tối ưu CV – LinkedIn', 'Viết lại CV và hồ sơ LinkedIn', 400000, 'bộ', 90),
        ],
      },
      {
        slug: 'ky-nang-can-bang',
        name: 'Kỹ năng - cân bằng',
        services: [
          o('coach-quan-ly-thoi-gian', 'Coach quản lý thời gian', 'Sắp xếp công việc, thói quen làm việc', 350000, 'buổi', 60),
          o('tu-van-dinh-duong-online', 'Tư vấn dinh dưỡng online', 'Đồng hành thực đơn; không thay tư vấn y tế', 300000, 'buổi', 60),
          o('tham-van-tam-ly-online', 'Tham vấn tâm lý online', 'Người làm có chứng chỉ; không thay điều trị y khoa', 500000, 'buổi', 60),
          o('huong-dan-thien-chanh-niem', 'Hướng dẫn thiền chánh niệm', 'Thực hành thở, thiền theo buổi', 250000, 'buổi', 45),
        ],
      },
    ],
  },
  {
    slug: 'giai-tri',
    name: 'Giải trí',
    description:
      'Biểu diễn online, trò chơi, đồng hành xem phim / kể chuyện — không cày thuê game, không nội dung người lớn',
    icon: 'sparkles',
    sortOrder: 22,
    isFeatured: true,
    categories: [
      {
        slug: 'bieu-dien-online',
        name: 'Biểu diễn online',
        services: [
          o('hat-live-online', 'Hát live / karaoke đồng hành', 'Hát live hoặc hát cùng qua video call', 250000, 'buổi', 60),
          o('ao-thuat-online', 'Ảo thuật online', 'Biểu diễn ảo thuật / ảo giác trên camera', 350000, 'buổi', 45),
          o('dj-online', 'DJ / mix nhạc online', 'Mix set nhạc cho tiệc / họp mặt trực tuyến', 400000, 'buổi', 90),
          o('mc-tiec-online', 'MC tiệc / sinh nhật online', 'Dẫn chương trình tiệc riêng tư qua Meet / Zoom', 500000, 'buổi', 90),
        ],
      },
      {
        slug: 'tro-choi-giai-tri',
        name: 'Trò chơi giải trí',
        services: [
          o('dm-rpg-online', 'Game master RPG online', 'Dẫn phiên chơi nhập vai (D&D / tương tự)', 300000, 'buổi', 180),
          o('choi-board-game-online', 'Dẫn board game online', 'Hướng dẫn và chơi board / card game qua mạng', 200000, 'buổi', 120),
          o('coach-co-vua-online', 'Cờ vua / cờ tướng online', 'Chơi kèm hoặc chỉ kỹ thuật cơ bản', 180000, 'buổi', 60),
          o('to-chuc-quiz-online', 'Tổ chức quiz / mini game', 'Lên câu hỏi, dẫn đêm quiz cho nhóm bạn / team', 450000, 'buổi', 90),
        ],
      },
      {
        slug: 'dong-hanh-giai-tri',
        name: 'Đồng hành giải trí',
        services: [
          o('ke-chuyen-online', 'Kể chuyện / đọc sách online', 'Kể chuyện thiếu nhi hoặc đọc sách theo giờ', 150000, 'buổi', 45),
          o('xem-phim-dong-hanh', 'Xem phim đồng hành', 'Cùng xem / bình luận phim theo chủ đề (không phát lại bản quyền)', 180000, 'buổi', 120),
          o('tro-chuyen-giai-tri', 'Trò chuyện giải trí theo chủ đề', 'Trò chuyện thư giãn; không hẹn hò / nội dung người lớn', 120000, 'giờ', 60),
          o('goi-y-playlist', 'Gợi ý playlist theo mood', 'Curate playlist Spotify / YouTube theo không khí', 150000, 'gói', 45),
        ],
      },
    ],
  },
];

/** Category cũ đã gỡ / gộp — seed sẽ xóa nếu không còn service. */
export const obsoleteCategorySlugs = [
  'gia-su-suc-khoe',
  'gia-su-khoa-hoc',
  'day-lap-trinh',
  'day-ngoai-ngu',
  'cong-nghe',
  'tu-dong-hoa',
  'sang-tao',
  'content-kenh',
  'hanh-chinh',
];
