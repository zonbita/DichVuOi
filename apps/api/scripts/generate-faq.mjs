/**
 * Sinh ~2000 cặp hỏi–đáp sẵn cho chatbot Dịch Vụ Ơi.
 * Chạy: node scripts/generate-faq.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../src/modules/chatbot/data/faq-knowledge.json');

const topics = [
  {
    id: 'gioi-thieu',
    name: 'Giới thiệu',
    keywords: ['dich vu oi', 'la gi', 'gioi thieu', 'nen tang', 'app'],
    facts: [
      'Dịch Vụ Ơi là nền tảng kết nối khách hàng với người cung cấp dịch vụ đa ngành nghề tại Việt Nam.',
      'Bạn có thể đặt lịch dọn nhà, sửa chữa, gia sư, lập trình, coaching game và nhiều dịch vụ khác.',
      'Web Dịch Vụ Ơi dùng được trên điện thoại, tablet và máy tính (mobile responsive).',
    ],
  },
  {
    id: 'dat-lich',
    name: 'Đặt lịch',
    keywords: ['dat lich', 'booking', 'dat dich vu', 'tao don', 'chon gio'],
    facts: [
      'Chọn nhóm dịch vụ → chọn dịch vụ → điền địa chỉ, thời gian và thông tin liên hệ để đặt lịch.',
      'Sau khi đặt, bạn nhận mã đơn và theo dõi trạng thái trong mục Đơn của tôi.',
      'Có thể ghi chú yêu cầu đặc biệt khi đặt lịch để đối tác chuẩn bị tốt hơn.',
    ],
  },
  {
    id: 'thanh-toan',
    name: 'Thanh toán',
    keywords: ['thanh toan', 'gia', 'phi', 'coc', 'escrow', 'hoan tien'],
    facts: [
      'Giá dịch vụ hiển thị theo giờ, máy, gói hoặc lần tùy từng dịch vụ.',
      'Hệ thống hỗ trợ đặt cọc escrow: tiền tạm giữ đến khi hoàn thành công việc.',
      'Nếu đơn bị hủy theo chính sách, phần cọc có thể được hoàn theo quy định của đơn.',
    ],
  },
  {
    id: 'doi-tac',
    name: 'Đối tác / Tasker',
    keywords: ['doi tac', 'tasker', 'tho', 'nhan viec', 'lam viec'],
    facts: [
      'Đối tác đăng ký, bật nhận việc và đồng bộ dịch vụ mình cung cấp để nhận đơn.',
      'Đối tác có thể xem đơn mở, nhận việc và chat với khách trong đơn.',
      'Hồ sơ đối tác có kỹ năng, khu vực, giờ làm và đánh giá từ khách.',
    ],
  },
  {
    id: 'tai-khoan',
    name: 'Tài khoản',
    keywords: ['dang ky', 'dang nhap', 'tai khoan', 'mat khau', 'email'],
    facts: [
      'Đăng ký bằng email, mật khẩu và họ tên; số điện thoại là tuỳ chọn.',
      'Sau đăng ký bạn có thể đặt lịch ngay hoặc bật chế độ cung cấp dịch vụ.',
      'Đăng nhập để xem đơn, chat, đánh giá và quản lý hồ sơ đối tác.',
    ],
  },
  {
    id: 'nha-cua',
    name: 'Nhà cửa',
    keywords: ['don nha', 've sinh', 'sofa', 'khu khuan', 'tong ve sinh'],
    facts: [
      'Nhóm Nhà cửa gồm dọn nhà theo ca, tổng vệ sinh, vệ sinh sofa/rèm/thảm và khử khuẩn.',
      'Dọn nhà theo ca tính theo giờ; tổng vệ sinh thường tính theo gói.',
      'Nên dọn trước đồ cá nhân quan trọng và ghi rõ khu vực cần ưu tiên.',
    ],
  },
  {
    id: 'sua-chua',
    name: 'Sửa chữa',
    keywords: ['dien', 'nuoc', 'may lanh', 'sua chua', 'tho'],
    facts: [
      'Nhóm Sửa chữa gồm điện nước, vệ sinh máy lạnh và các dịch vụ kỹ thuật tại nhà.',
      'Vệ sinh máy lạnh thường tính theo máy; sửa điện nước có thể tính theo lần.',
      'Mô tả rõ hiện tượng lỗi và gửi ảnh (nếu có) giúp báo giá chính xác hơn.',
    ],
  },
  {
    id: 'cham-soc',
    name: 'Chăm sóc',
    keywords: ['trong tre', 'nguoi gia', 'cham soc', 'bao mau', 'nguoi benh'],
    facts: [
      'Nhóm Chăm sóc gồm trông trẻ, chăm sóc người cao tuổi và hỗ trợ tại nhà.',
      'Nên nêu rõ độ tuổi, tình trạng sức khỏe và khung giờ cần hỗ trợ.',
      'Đối tác chăm sóc được đánh giá sau mỗi ca để bạn chọn người phù hợp.',
    ],
  },
  {
    id: 'hoc-tap',
    name: 'Học tập',
    keywords: ['gia su', 'hoc', 'ielts', 'day kem', 'toan'],
    facts: [
      'Nhóm Học tập gồm gia sư các môn, ngoại ngữ và kỹ năng tin học.',
      'Có thể học tại nhà hoặc online tùy thỏa thuận với gia sư.',
      'Chọn trình độ và mục tiêu (luyện thi, phụ đạo) trong ghi chú đặt lịch.',
    ],
  },
  {
    id: 'cong-nghe',
    name: 'Công nghệ',
    keywords: ['lap trinh', 'sua may', 'website', 'fix bug', 'cai dat'],
    facts: [
      'Nhóm Lập trình & công nghệ gồm sửa máy, cài đặt, fix bug và freelance nhỏ.',
      'Mô tả rõ yêu cầu kỹ thuật, deadline và ngân sách dự kiến.',
      'Có thể đặt gói nhỏ như landing page, bot hoặc xử lý lỗi phần mềm.',
    ],
  },
  {
    id: 'game',
    name: 'Game',
    keywords: ['game', 'coaching', 'rank', 'esports', 'setup pc'],
    facts: [
      'Nhóm Game & eSports ưu tiên coaching, setup PC và edit stream; hạn chế cày thuê.',
      'Coaching giúp review replay và hướng dẫn leo rank đúng cách.',
      'Setup/tối ưu PC gaming giúp tăng FPS và ổn định hệ thống.',
    ],
  },
  {
    id: 'thiet-ke',
    name: 'Thiết kế',
    keywords: ['thiet ke', 'logo', 'banner', 'edit video', 'content'],
    facts: [
      'Nhóm Thiết kế gồm logo, banner, edit video ngắn và sáng tạo nội dung.',
      'Cung cấp brief, màu thương hiệu và ví dụ tham khảo để nhận đúng sản phẩm.',
      'Edit video TikTok/Reels/Short phù hợp cho cá nhân và cửa hàng nhỏ.',
    ],
  },
  {
    id: 'chat-danh-gia',
    name: 'Chat & đánh giá',
    keywords: ['chat', 'danh gia', 'review', 'sao', 'phan hoi'],
    facts: [
      'Chat trong đơn chỉ diễn ra trên Dịch Vụ Ơi; hệ thống ẩn SĐT/Zalo nếu phát hiện.',
      'Sau khi hoàn thành, khách có thể đánh giá sao và để lại nhận xét.',
      'Đánh giá giúp cộng đồng chọn đối tác uy tín hơn.',
    ],
  },
  {
    id: 'huy-khieu-nai',
    name: 'Hủy & khiếu nại',
    keywords: ['huy', 'khieu nai', 'hoan', 'loi', 'bao cao'],
    facts: [
      'Bạn có thể hủy đơn theo trạng thái hiện tại; chính sách hoàn cọc phụ thuộc thời điểm hủy.',
      'Nếu có vấn đề chất lượng, hãy báo cáo trong đơn để admin/hỗ trợ xử lý.',
      'Giữ lịch sử chat và ảnh minh chứng giúp giải quyết khiếu nại nhanh hơn.',
    ],
  },
  {
    id: 'khu-vuc',
    name: 'Khu vực',
    keywords: ['khu vuc', 'thanh pho', 'quan', 'hcm', 'ha noi'],
    facts: [
      'Dịch vụ phụ thuộc khu vực đối tác đang nhận việc và khoảng cách di chuyển.',
      'Khi đặt lịch, nhập đúng địa chỉ để hệ thống/đối tác ước lượng thời gian đến.',
      'Một số dịch vụ số (gia sư online, thiết kế, lập trình) có thể làm từ xa.',
    ],
  },
  {
    id: 'bao-mat',
    name: 'Bảo mật',
    keywords: ['bao mat', 'rieng tu', 'du lieu', 'an toan', 'otp'],
    facts: [
      'Thông tin tài khoản và đơn hàng được bảo vệ theo chính sách riêng tư của nền tảng.',
      'Không chia sẻ mật khẩu hay mã OTP với bất kỳ ai, kể cả người xưng hỗ trợ.',
      'Giao tiếp qua chat trong đơn giúp giảm rủi ro lộ thông tin liên hệ cá nhân.',
    ],
  },
];

const questionPrefixes = [
  'Làm sao để',
  'Tôi muốn biết',
  'Cho hỏi',
  'Xin hỏi',
  'Hướng dẫn',
  'Giải thích giúp',
  'Dịch Vụ Ơi có',
  'Có thể',
  'Khi nào',
  'Vì sao',
  'Cần gì để',
  'Phí',
  'Giá',
  'Cách',
  'Quy trình',
  'Chính sách',
  'Tôi bị',
  'Nếu',
  'Bao lâu thì',
  'Ai có thể',
];

const questionStems = [
  '{topic} hoạt động thế nào',
  'sử dụng {topic} trên Dịch Vụ Ơi',
  '{topic} dành cho người mới',
  'thông tin cơ bản về {topic}',
  '{topic} khác gì so với tự thuê ngoài',
  'bắt đầu với {topic}',
  'lưu ý khi dùng {topic}',
  '{topic} có an toàn không',
  'chi phí liên quan {topic}',
  'thời gian xử lý {topic}',
  'hỗ trợ khách hàng về {topic}',
  'đối tác liên quan {topic}',
  'đặt dịch vụ thuộc nhóm {topic}',
  'hủy hoặc đổi lịch liên quan {topic}',
  'đánh giá sau khi dùng {topic}',
  'chat hỗ trợ về {topic}',
  'thanh toán khi dùng {topic}',
  'khu vực áp dụng {topic}',
  'yêu cầu khi đăng ký {topic}',
  'các bước chi tiết của {topic}',
  '{topic} trên điện thoại',
  '{topic} cho doanh nghiệp nhỏ',
  'lỗi thường gặp với {topic}',
  'mẹo tiết kiệm khi dùng {topic}',
  'so sánh các gói trong {topic}',
];

const cities = [
  'TP.HCM',
  'Hà Nội',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
  'Bình Dương',
  'Đồng Nai',
  'Nha Trang',
  'Huế',
  'Vũng Tàu',
];

const roles = ['khách hàng', 'đối tác', 'người mới', 'sinh viên', 'gia đình', 'cửa hàng nhỏ'];

const faq = [];
let id = 1;

function pushFaq(question, answer, topic, keywords) {
  faq.push({
    id: `faq-${String(id).padStart(4, '0')}`,
    topic,
    question,
    answer,
    keywords,
  });
  id += 1;
}

for (const topic of topics) {
  for (const fact of topic.facts) {
    pushFaq(
      `${topic.name} trên Dịch Vụ Ơi là gì?`,
      fact,
      topic.id,
      topic.keywords,
    );
  }

  for (const prefix of questionPrefixes) {
    for (const stem of questionStems) {
      if (faq.length >= 2000) break;
      const q = `${prefix} ${stem.replaceAll('{topic}', topic.name.toLowerCase())}?`;
      const fact = topic.facts[faq.length % topic.facts.length];
      const extra =
        faq.length % 3 === 0
          ? ` Nếu cần thêm hỗ trợ, hãy mở chat trong đơn hoặc liên hệ chăm sóc khách hàng của Dịch Vụ Ơi.`
          : faq.length % 3 === 1
            ? ` Bạn có thể thao tác ngay trên web điện thoại hoặc máy tính.`
            : ` Kiểm tra mục Đơn của tôi để theo dõi tiến độ.`;
      pushFaq(q, `${fact}${extra}`, topic.id, [
        ...topic.keywords,
        ...prefix.toLowerCase().split(/\s+/),
      ]);
    }
    if (faq.length >= 2000) break;
  }
  if (faq.length >= 2000) break;
}

// Bổ sung biến thể theo thành phố / đối tượng cho đủ ~2000 nếu thiếu
let cityIdx = 0;
while (faq.length < 2000) {
  const topic = topics[faq.length % topics.length];
  const city = cities[cityIdx % cities.length];
  const role = roles[cityIdx % roles.length];
  const fact = topic.facts[cityIdx % topic.facts.length];
  pushFaq(
    `Ở ${city}, ${role} dùng ${topic.name.toLowerCase()} trên Dịch Vụ Ơi như thế nào?`,
    `${fact} Tại ${city}, hãy chọn đúng địa chỉ/khu vực và lọc đối tác phù hợp với ${role}.`,
    topic.id,
    [...topic.keywords, city.toLowerCase(), role],
  );
  cityIdx += 1;
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(faq.slice(0, 2000), null, 0), 'utf8');
console.log(`Wrote ${Math.min(faq.length, 2000)} FAQs to ${outPath}`);
