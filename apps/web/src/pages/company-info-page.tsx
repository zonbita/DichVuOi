import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/icon';
import type { IconName } from '../components/ui/icon';

const legalRows: Array<{ label: string; value: string }> = [
  { label: 'Tên công ty', value: 'CÔNG TY TNHH DỊCH VỤ ƠI' },
  { label: 'Tên tiếng Anh', value: 'DichVuOi Co., Ltd.' },
  { label: 'Thương hiệu', value: 'Dịch Vụ Ơi · DichVuOi' },
  { label: 'Mã số thuế', value: '01xxxxxxxx' },
  { label: 'Ngày thành lập', value: 'dd/mm/yyyy' },
  { label: 'Người đại diện pháp luật', value: '—' },
  { label: 'Địa chỉ trụ sở', value: 'TP. Hồ Chí Minh, Việt Nam' },
  { label: 'Điện thoại', value: '1900 2888' },
  { label: 'Email', value: 'support@dichvuoi.vn' },
  { label: 'Website', value: 'https://dichvuoi.vn' },
];

const scopes: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'briefcase',
    title: 'Nền tảng trung gian',
    body: 'Kết nối cung – cầu dịch vụ đa ngành nghề: nhà cửa, sửa chữa, chăm sóc, học tập, lập trình, thiết kế, game…',
  },
  {
    icon: 'shield',
    title: 'Thanh toán an toàn',
    body: 'Đặt cọc giữ chỗ trên sàn, giải ngân theo trạng thái đơn; hoa hồng minh bạch theo đơn hoàn thành.',
  },
  {
    icon: 'headset',
    title: 'Hỗ trợ hai phía',
    body: 'Chăm sóc khách thuê và người làm, xử lý khiếu nại, đánh giá hai chiều sau khi hoàn thành dịch vụ.',
  },
];

const commitments = [
  'Trung gian minh bạch — Dịch Vụ Ơi không trực tiếp thực hiện dịch vụ; chỉ kết nối, giữ chỗ bằng đặt cọc và giải ngân theo trạng thái đơn.',
  'Bảo vệ hai bên — che thông tin liên hệ trước khi đặt cọc, chat trong ứng dụng, đánh giá sau khi hoàn thành.',
  'Tuân thủ — thu thập và xử lý dữ liệu theo Chính sách bảo mật; tiếp nhận và xử lý khiếu nại theo quy trình công bố.',
];

const supportRows: Array<{ icon: IconName; label: string; value: string }> = [
  { icon: 'phone', label: 'Hotline', value: '1900 2888' },
  { icon: 'mail', label: 'Email', value: 'support@dichvuoi.vn' },
  { icon: 'headset', label: 'Zalo OA / Messenger', value: 'Dịch Vụ Ơi' },
  { icon: 'calendar', label: 'Giờ hỗ trợ', value: '8:00 – 22:00 (T2 – CN)' },
];

export function CompanyInfoPage() {
  return (
    <div className="space-y-8 pb-6">
      <nav className="text-sm text-[var(--color-muted)]">
        <Link to="/" className="hover:text-[var(--color-brand-deep)]">
          Trang chủ
        </Link>{' '}
        / <span className="text-[var(--color-ink)]">Thông tin công ty</span>
      </nav>

      <header className="border border-[var(--color-line)] bg-white px-6 py-7 shadow-sm sm:px-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Thông tin công ty</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--color-muted)] sm:text-base">
          <strong className="text-[var(--color-ink)]">Dịch Vụ Ơi</strong> là nền tảng kết nối khách
          thuê với người làm (thợ, gia sư, freelancer…) tại Việt Nam — một tài khoản vừa là khách
          thuê vừa là người làm. Chúng tôi hỗ trợ dịch vụ tại chỗ và online, với mục tiêu đặt
          lịch dễ dàng, thanh toán qua sàn và hồ sơ rõ ràng.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {scopes.map((item) => (
          <div key={item.title} className="border border-[var(--color-line)] bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <p className="mt-3 text-lg font-extrabold">{item.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="border border-[var(--color-line)] bg-white shadow-sm">
        <div className="border-b border-[var(--color-line)] px-6 py-4">
          <h2 className="text-xl font-extrabold">Thông tin pháp lý</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Thông tin đăng ký doanh nghiệp — cập nhật theo giấy phép kinh doanh chính thức.
          </p>
        </div>
        <dl className="divide-y divide-[var(--color-line)]">
          {legalRows.map((row) => (
            <div key={row.label} className="grid gap-1 px-6 py-3 sm:grid-cols-[220px_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-[var(--color-muted)]">{row.label}</dt>
              <dd className="text-[15px] font-medium text-[var(--color-ink)]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border border-[var(--color-line)] bg-white px-6 py-6 shadow-sm">
        <h2 className="text-xl font-extrabold">Cam kết vận hành</h2>
        <ul className="mt-4 space-y-3">
          {commitments.map((text, index) => (
            <li key={index} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand-deep)]">
                {index + 1}
              </span>
              <span className="text-[var(--color-ink)]">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-[var(--color-line)] bg-white px-6 py-6 shadow-sm">
        <h2 className="text-xl font-extrabold">Liên hệ hỗ trợ</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {supportRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                <Icon name={row.icon} className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm text-[var(--color-muted)]">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-[var(--color-muted)]">
        Một số thông tin pháp lý đang chờ cập nhật theo giấy phép chính thức. Vui lòng thay giá trị
        thật trong <code className="font-semibold">company-info-page.tsx</code>.
      </p>
    </div>
  );
}
