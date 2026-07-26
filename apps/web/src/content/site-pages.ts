import type { DocContent } from '../components/content/static-doc';

export const aboutPage: DocContent = {
  title: 'Giới thiệu',
  subtitle:
    'Dịch Vụ Ơi là nền tảng kết nối khách thuê với người làm trên cùng một tài khoản — đặt lịch dễ, thanh toán qua sàn, hồ sơ rõ ràng.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: 'Chúng tôi làm gì?',
      paragraphs: [
        'Dịch Vụ Ơi không trực tiếp cung cấp thợ hay gia sư và không tuyển dụng người làm như nhân viên. Chúng tôi vận hành sàn trung gian: khách đặt dịch vụ, đặt cọc giữ chỗ; đối tác độc lập nhận việc; hai bên chat và đánh giá trong hệ thống.',
      ],
      bullets: [
        'Đa ngành: nhà cửa, sửa chữa, chăm sóc, học tập, lập trình, thiết kế, game…',
        'Một tài khoản vừa là khách thuê vừa là người làm.',
        'Dịch vụ tại chỗ và online.',
      ],
    },
    {
      heading: 'Vì sao chọn Dịch Vụ Ơi?',
      bullets: [
        'Đặt cọc escrow — giảm rủi ro “đặt rồi bỏ” hoặc không nhận được dịch vụ.',
        'Che thông tin liên hệ trước khi cọc; chat trong app sau khi giữ chỗ.',
        'Cấp độ đối tác, đánh giá hai chiều sau khi hoàn thành.',
        'Hỗ trợ khiếu nại theo quy trình công bố.',
      ],
    },
    {
      heading: 'Đối tượng sử dụng',
      bullets: [
        'Khách hàng cần thuê dịch vụ theo giờ / theo buổi.',
        'Thợ, kỹ thuật viên, gia sư, freelancer muốn nhận việc online.',
        'Doanh nghiệp nhỏ muốn mở kênh đặt lịch số.',
      ],
    },
  ],
};

export const termsPage: DocContent = {
  title: 'Điều khoản sử dụng',
  subtitle:
    'Khi tạo tài khoản hoặc sử dụng Dịch Vụ Ơi, bạn đồng ý với các điều khoản dưới đây.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: '1. Định nghĩa',
      bullets: [
        'Nền tảng: website / ứng dụng Dịch Vụ Ơi.',
        'Người dùng: tài khoản đã đăng ký (có thể vừa là khách thuê vừa là người làm).',
        'Khách thuê: người đặt / thuê dịch vụ.',
        'Người làm (đối tác độc lập): người nhận việc / cung cấp dịch vụ.',
        'Đơn thuê: yêu cầu đặt dịch vụ có lịch, giá và trạng thái trên hệ thống.',
      ],
    },
    {
      heading: '2. Tài khoản',
      paragraphs: [
        'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình. Thông tin đăng ký phải chính xác; chúng tôi có quyền tạm khóa tài khoản gian lận hoặc vi phạm.',
      ],
    },
    {
      heading: '3. Vai trò trung gian (marketplace)',
      paragraphs: [
        'Dịch Vụ Ơi là sàn kết nối thương mại điện tử. Người làm là đối tác độc lập, không phải nhân viên của công ty vận hành sàn. Sàn không tuyển dụng, không trả lương và không điều hành trực tiếp việc thực hiện dịch vụ tại hiện trường.',
        'Việc thực hiện dịch vụ và mọi thiệt hại phát sinh trong quá trình làm việc thuộc trách nhiệm của các bên trên đơn (khách thuê và người làm), trừ khi pháp luật hoặc cam kết vận hành đã công bố quy định khác. Badge «Đã xác thực» phản ánh bước xác minh vận hành của sàn (khi có), không phải bảo lãnh tuyệt đối mọi hành vi của người làm.',
        'Chúng tôi hỗ trợ khiếu nại theo chính sách, giữ escrow theo quy trình, và hợp tác với cơ quan có thẩm quyền khi có yêu cầu hợp pháp. Sàn không quảng cáo «đảm bảo an toàn 100%» hay «thợ uy tín tuyệt đối».',
      ],
    },
    {
      heading: '4. Thanh toán & đặt cọc',
      bullets: [
        'Khách đặt cọc theo quy định dịch vụ để giữ chỗ.',
        'Số tiền được giữ trên sàn và giải ngân / hoàn theo trạng thái đơn và chính sách hoàn tiền.',
        'Hoa hồng nền tảng được trừ theo tỷ lệ công bố với đối tác.',
      ],
    },
    {
      heading: '5. Hành vi bị cấm',
      bullets: [
        'Gian lận đánh giá, spam, lừa đảo, đe dọa.',
        'Đưa giao dịch ra ngoài sàn nhằm tránh phí / né bảo vệ escrow (trừ khi hai bên đã hoàn tất đúng quy trình và được phép).',
        'Đăng nội dung bất hợp pháp, khiêu dâm trẻ em, hoặc xâm phạm quyền người khác.',
      ],
    },
    {
      heading: '6. Thay đổi điều khoản',
      paragraphs: [
        'Chúng tôi có thể cập nhật điều khoản; bản mới có hiệu lực khi đăng trên trang này. Việc tiếp tục sử dụng sau cập nhật đồng nghĩa với việc chấp nhận bản mới.',
      ],
    },
  ],
};

export const privacyPage: DocContent = {
  title: 'Chính sách bảo mật',
  subtitle: 'Cách Dịch Vụ Ơi thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: '1. Dữ liệu chúng tôi thu thập',
      bullets: [
        'Thông tin tài khoản: họ tên, email, số điện thoại, ảnh đại diện.',
        'Thông tin giao dịch: đơn thuê, lịch, địa chỉ giao dịch, lịch sử thanh toán.',
        'Nội dung chat / đánh giá trên nền tảng.',
        'Dữ liệu kỹ thuật: IP, thiết bị, nhật ký truy cập (để bảo mật và cải thiện dịch vụ).',
      ],
    },
    {
      heading: '2. Mục đích sử dụng',
      bullets: [
        'Vận hành đặt lịch, thanh toán escrow, thông báo trạng thái đơn.',
        'Xác minh đối tác, tính cấp độ, xử lý khiếu nại.',
        'Cải thiện sản phẩm, chống gian lận.',
        'Gửi thông báo dịch vụ (có thể tắt marketing nếu có tùy chọn).',
      ],
    },
    {
      heading: '3. Chia sẻ dữ liệu',
      paragraphs: [
        'Chúng tôi không bán dữ liệu cá nhân. Dữ liệu có thể chia sẻ với: đối tác thanh toán / cổng thanh toán; bên xử lý khiếu nại; cơ quan nhà nước khi có yêu cầu hợp pháp; và giữa khách – đối tác trong phạm vi cần thiết để thực hiện đơn (sau khi đặt cọc).',
      ],
    },
    {
      heading: '4. Bảo mật & lưu trữ',
      paragraphs: [
        'Áp dụng biện pháp kỹ thuật và tổ chức phù hợp (mã hóa kênh, phân quyền, nhật ký). Thời gian lưu tùy loại dữ liệu và nghĩa vụ pháp lý; bạn có thể yêu cầu xem / chỉnh / xóa trong phạm vi luật cho phép qua email hỗ trợ.',
      ],
    },
    {
      heading: '5. Liên hệ',
      paragraphs: [
        'Câu hỏi về dữ liệu cá nhân: support@dichvuoi.vn hoặc hotline 1900 2888.',
      ],
    },
  ],
};

export const helpCenterPage: DocContent = {
  title: 'Trung tâm trợ giúp',
  subtitle: 'Câu trả lời nhanh cho các vấn đề thường gặp khi thuê hoặc nhận việc trên Dịch Vụ Ơi.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: 'Tài khoản',
      bullets: [
        'Quên mật khẩu: dùng chức năng khôi phục trên trang đăng nhập (hoặc liên hệ support nếu chưa có).',
        'Một tài khoản dùng được cả chế độ khách thuê và người làm.',
        'Cập nhật hồ sơ người làm tại mục Đối tác sau khi đăng nhập.',
      ],
    },
    {
      heading: 'Đặt dịch vụ',
      bullets: [
        'Chọn nhóm → dịch vụ → điền lịch / địa chỉ → đặt cọc để giữ chỗ.',
        'Sau khi cọc, đơn vào hàng chờ đối tác hoặc gắn trực tiếp nếu thuê thẳng.',
        'Theo dõi đơn tại “Đơn của tôi”.',
      ],
    },
    {
      heading: 'Đối tác nhận việc',
      bullets: [
        'Mở bảng Đối tác để xem đơn mở và lịch tháng.',
        'Nhận việc kịp thời; cập nhật trạng thái khi bắt đầu / hoàn thành.',
        'Đánh giá khách sau khi hoàn tất để tăng uy tín hai chiều.',
      ],
    },
    {
      heading: 'Thanh toán & hoàn tiền',
      paragraphs: [
        'Xem chi tiết tại trang Chính sách hoàn tiền. Mọi thắc mắc về số tiền giữ / giải ngân: gửi khiếu nại kèm mã đơn.',
      ],
    },
    {
      heading: 'Liên hệ hỗ trợ',
      bullets: [
        'Hotline: 1900 2888 (8:00 – 22:00, T2 – CN)',
        'Email: support@dichvuoi.vn',
        'Zalo OA / Messenger: Dịch Vụ Ơi',
      ],
    },
  ],
};

export const bookingGuidePage: DocContent = {
  title: 'Hướng dẫn đặt dịch vụ',
  subtitle: 'Các bước đặt lịch trên Dịch Vụ Ơi từ chọn dịch vụ đến hoàn tất.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: 'Quy trình đặt lịch',
      steps: [
        'Đăng nhập hoặc tạo tài khoản.',
        'Chọn nhóm ngành nghề → danh mục → dịch vụ phù hợp (hoặc tìm theo từ khóa).',
        'Xem mô tả, giá, thời lượng; chọn người làm nếu có tùy chọn thuê thẳng.',
        'Điền thời gian, địa chỉ / ghi chú, xác nhận đơn.',
        'Đặt cọc giữ chỗ theo hướng dẫn thanh toán.',
        'Theo dõi trạng thái: chờ nhận → xác nhận → đang làm → hoàn thành; chat với đối tác trong app.',
        'Đánh giá sau khi hoàn tất để giúp cộng đồng chọn đúng người.',
      ],
    },
    {
      heading: 'Mẹo đặt thành công',
      bullets: [
        'Ghi rõ địa chỉ / liên hệ dự phòng trong ghi chú sau khi đã cọc.',
        'Chọn khung giờ thực tế; tránh đặt sát giờ nếu cần di chuyển xa.',
        'Kiểm tra đánh giá và cấp độ đối tác trước khi thuê thẳng.',
      ],
    },
  ],
};

export const warrantyPage: DocContent = {
  title: 'Chính sách bảo hành',
  subtitle:
    'Phạm vi hỗ trợ khi dịch vụ hoàn thành nhưng chưa đạt thỏa thuận ban đầu trên đơn.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: 'Phạm vi',
      paragraphs: [
        'Dịch Vụ Ơi không thay thế bảo hành sản phẩm của hãng. “Bảo hành dịch vụ” trên sàn nghĩa là hỗ trợ xử lý khi kết quả công việc không đúng mô tả đơn đã thống nhất (trong thời hạn khiếu nại).',
      ],
    },
    {
      heading: 'Thời hạn khiếu nại',
      bullets: [
        'Trong vòng 24 giờ sau khi đơn chuyển trạng thái Hoàn thành (hoặc theo ghi chú dịch vụ cụ thể nếu có).',
        'Cần cung cấp bằng chứng: ảnh / video / mô tả lệch so với thỏa thuận.',
      ],
    },
    {
      heading: 'Hướng xử lý',
      bullets: [
        'Đối tác quay lại khắc phục (nếu phù hợp loại dịch vụ).',
        'Hoặc hỗ trợ hoàn một phần / toàn bộ theo chính sách hoàn tiền sau khi CSKH xác minh.',
        'Trường hợp hai bên đã đồng thuận ngoài mô tả đơn — ưu tiên thỏa thuận đã ghi trong chat / ghi chú đơn.',
      ],
    },
    {
      heading: 'Không thuộc bảo hành',
      bullets: [
        'Hư hỏng do sử dụng sai / tự ý sửa sau khi đối tác bàn giao.',
        'Yêu cầu vượt phạm vi dịch vụ đã đặt (không ghi trong đơn).',
        'Thiệt hại gián tiếp ngoài thỏa thuận (mất mát kinh doanh…) trừ khi có quy định riêng.',
      ],
    },
  ],
};

export const refundPage: DocContent = {
  title: 'Chính sách hoàn tiền',
  subtitle: 'Khi nào được hoàn cọc / hoàn thanh toán và thời gian xử lý trên Dịch Vụ Ơi.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: 'Nguyên tắc',
      paragraphs: [
        'Tiền đặt cọc được giữ trên sàn (escrow) đến khi đơn hoàn thành hoặc bị hủy theo quy tắc. Mức hoàn phụ thuộc bên hủy, thời điểm hủy và kết quả xác minh khiếu nại.',
      ],
    },
    {
      heading: 'Các trường hợp thường gặp',
      bullets: [
        'Khách hủy trước khi đối tác nhận việc: hoàn toàn bộ cọc (trừ phí cổng thanh toán nếu có).',
        'Khách hủy sau khi đã xác nhận lịch sát giờ: có thể trừ phí giữ chỗ theo tỷ lệ công bố trên đơn.',
        'Đối tác không đến / không thực hiện: khách được hoàn theo xác minh CSKH.',
        'Hai bên đồng ý hủy: hoàn theo thỏa thuận ghi nhận trên hệ thống.',
        'Khiếu nại chất lượng được chấp nhận: hoàn một phần hoặc toàn bộ tùy mức độ.',
      ],
    },
    {
      heading: 'Thời gian hoàn',
      paragraphs: [
        'Sau khi duyệt hoàn, số tiền được hoàn về phương thức thanh toán gốc trong 3–10 ngày làm việc (tùy ngân hàng / ví). Trạng thái hoàn hiển thị trên đơn.',
      ],
    },
    {
      heading: 'Cách gửi yêu cầu',
      steps: [
        'Vào Đơn của tôi → chọn đơn → Khiếu nại / yêu cầu hoàn.',
        'Hoặc gửi form tại trang Khiếu nại — Góp ý kèm mã đơn.',
        'Chờ CSKH phản hồi trong khung giờ hỗ trợ.',
      ],
    },
  ],
};

export const complaintPage: DocContent = {
  title: 'Khiếu nại — Góp ý',
  subtitle:
    'Tiếp nhận phản ánh về đơn thuê, thanh toán, thái độ phục vụ hoặc góp ý cải thiện sản phẩm.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: 'Cách gửi khiếu nại',
      steps: [
        'Chuẩn bị mã đơn, thời gian sự việc, mô tả ngắn và bằng chứng (ảnh, đoạn chat).',
        'Gửi email tới support@dichvuoi.vn với tiêu đề [Khiếu nại] + mã đơn.',
        'Hoặc gọi hotline 1900 2888 / nhắn Zalo OA — Dịch Vụ Ơi.',
        'CSKH xác nhận tiếp nhận trong giờ hỗ trợ và cập nhật kết quả trên đơn hoặc email.',
      ],
    },
    {
      heading: 'Thời hạn xử lý',
      bullets: [
        'Xác nhận tiếp nhận: trong ngày làm việc (hoặc phiên hỗ trợ gần nhất).',
        'Phản hồi kết quả sơ bộ: thường 1–3 ngày làm việc với khiếu nại có đủ bằng chứng.',
        'Vụ việc phức tạp có thể kéo dài hơn; chúng tôi thông báo tiến độ.',
      ],
    },
    {
      heading: 'Góp ý sản phẩm',
      paragraphs: [
        'Mọi ý tưởng cải thiện UX, danh mục dịch vụ, tính năng đối tác: gửi email với tiêu đề [Góp ý]. Chúng tôi ghi nhận và ưu tiên theo lộ trình sản phẩm.',
      ],
    },
  ],
};

export const partnerProcessPage: DocContent = {
  title: 'Quy trình đối tác',
  subtitle: 'Từ đăng ký nhận việc đến hoàn thành đơn và nhận thanh toán trên Dịch Vụ Ơi.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: 'Các bước trở thành đối tác',
      steps: [
        'Đăng ký / đăng nhập tài khoản Dịch Vụ Ơi.',
        'Vào mục Đối tác, hoàn thiện hồ sơ (giới thiệu, khu vực, dịch vụ nhận).',
        'Chọn dịch vụ muốn nhận việc; chờ duyệt nếu dịch vụ yêu cầu xác minh.',
        'Theo dõi đơn mở realtime và lịch tháng trên bảng Đối tác.',
        'Nhận việc → cập nhật trạng thái → hoàn thành → nhận giải ngân (sau hoa hồng sàn).',
      ],
    },
    {
      heading: 'Trong lúc làm việc',
      bullets: [
        'Chỉ chat và trao đổi qua kênh trên nền tảng khi đơn đang hiệu lực.',
        'Đúng giờ theo lịch đã nhận; báo sớm nếu sự cố để khách được hỗ trợ.',
        'Không yêu cầu thanh toán ngoài escrow cho phần đã cọc trên đơn.',
      ],
    },
    {
      heading: 'Uy tín & cấp độ',
      paragraphs: [
        'Hoàn thành đúng hạn, đánh giá tốt và ít khiếu nại sẽ giúp tăng cấp độ đối tác — ảnh hưởng thứ hạng và cơ hội nhận việc. Xem chi tiết cấp độ trên bảng Đối tác.',
      ],
    },
  ],
};

export const partnerPolicyPage: DocContent = {
  title: 'Chính sách đối tác',
  subtitle: 'Quyền, nghĩa vụ và quy định dành cho người làm trên Dịch Vụ Ơi.',
  updatedAt: '07/2026',
  sections: [
    {
      heading: 'Điều kiện',
      bullets: [
        'Đủ năng lực hành vi dân sự; cung cấp thông tin hồ sơ trung thực.',
        'Có kỹ năng / giấy tờ phù hợp với ngành nghề đăng ký (khi được yêu cầu).',
        'Tuân thủ pháp luật Việt Nam khi thực hiện dịch vụ.',
      ],
    },
    {
      heading: 'Hoa hồng & thanh toán',
      paragraphs: [
        'Mỗi đơn hoàn thành, nền tảng trừ hoa hồng theo tỷ lệ công bố tại thời điểm nhận việc. Số còn lại được giải ngân theo chu kỳ / phương thức đã cấu hình. Chi tiết hiển thị trên đơn và bảng Đối tác.',
      ],
    },
    {
      heading: 'Nghĩa vụ',
      bullets: [
        'Thực hiện đúng mô tả dịch vụ và lịch đã nhận.',
        'Không spam đơn, không hủy liên tục không lý do chính đáng.',
        'Bảo mật thông tin khách hàng có được từ đơn.',
        'Hợp tác khi CSKH xác minh khiếu nại.',
      ],
    },
    {
      heading: 'Xử lý vi phạm',
      bullets: [
        'Cảnh cáo → hạn chế nhận việc → khóa tài khoản tùy mức độ.',
        'Gian lận thanh toán / đánh giá có thể khóa vĩnh viễn và từ chối giải ngân khoản tranh chấp.',
      ],
    },
  ],
};
