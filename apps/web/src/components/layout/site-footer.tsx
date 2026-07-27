import { Link } from 'react-router-dom';
import logo from '../../assets/logo-icon.png';
import { Icon } from '../ui/icon';
import type { IconName } from '../ui/icon';

const supportChannels: Array<{ icon: IconName; label: string; value: string }> = [
  { icon: 'phone', label: 'Gọi ngay', value: '1900 2888' },
  { icon: 'message', label: 'Nhắn tin', value: 'Messenger' },
  { icon: 'headset', label: 'Zalo OA', value: 'Dịch Vụ Ơi' },
  { icon: 'mail', label: 'Email', value: 'support@dichvuoi.vn' },
];

const linkColumns: Array<{
  title: string;
  links: Array<{ label: string; to: string }>;
}> = [
  {
    title: 'Về Dịch Vụ Ơi',
    links: [
      { label: 'Thông tin công ty', to: '/thong-tin-cong-ty' },
      { label: 'Giới thiệu', to: '/gioi-thieu' },
      { label: 'Điều khoản sử dụng', to: '/dieu-khoan' },
      { label: 'Chính sách bảo mật', to: '/chinh-sach-bao-mat' },
    ],
  },
  {
    title: 'Hỗ trợ khách hàng',
    links: [
      { label: 'Trung tâm trợ giúp', to: '/tro-giup' },
      { label: 'Hướng dẫn đặt dịch vụ', to: '/huong-dan-dat-dich-vu' },
      { label: 'Chính sách bảo hành', to: '/chinh-sach-bao-hanh' },
      { label: 'Chính sách hoàn tiền', to: '/chinh-sach-hoan-tien' },
      { label: 'Khiếu nại — Góp ý', to: '/khieu-nai' },
    ],
  },
  {
    title: 'Hợp tác với chúng tôi',
    links: [
      { label: 'Đăng ký làm đối tác', to: '/doi-tac' },
      { label: 'Quy trình đối tác', to: '/quy-trinh-doi-tac' },
      { label: 'Chính sách đối tác', to: '/chinh-sach-doi-tac' },
    ],
  },
];

function SocialLogo({ network }: { network: string }) {
  const common = 'h-5 w-5';

  if (network === 'Facebook') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden="true">
        <path d="M13.7 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5H17V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.5V13h2.8v8h3.4Z" />
      </svg>
    );
  }
  if (network === 'YouTube') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden="true">
        <path d="M21.6 7.1a2.8 2.8 0 0 0-2-2C17.9 4.6 12 4.6 12 4.6s-5.9 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.9 2.8 2.8 0 0 0 2 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.9ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z" />
      </svg>
    );
  }
  if (network === 'TikTok') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden="true">
        <path d="M16.6 3c.3 2.2 1.6 3.6 3.7 3.8v3.1a8 8 0 0 1-3.7-.9v6.2a5.8 5.8 0 1 1-5-5.7v3.2a2.7 2.7 0 1 0 1.8 2.5V3h3.2Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function StoreBadge({ store }: { store: 'App Store' | 'Google Play' }) {
  const isApple = store === 'App Store';
  return (
    <span className="flex min-w-[132px] items-center gap-2 rounded-lg bg-[var(--color-ink)] px-3 py-2 text-white shadow-sm">
      {isApple ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M16.8 12.7c0-2.3 1.9-3.4 2-3.5a4.4 4.4 0 0 0-3.5-1.9c-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.9A4.6 4.6 0 0 0 4.7 9.6c-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 3 2.3 1.1 0 1.6-.7 3.1-.7s1.9.7 3.1.7c1.3 0 2.1-1.1 2.9-2.3a10 10 0 0 0 1.3-2.7 4.1 4.1 0 0 1-2.5-3.7ZM14.3 5.8A4.2 4.2 0 0 0 15.4 3a4.5 4.5 0 0 0-2.9 1.5 3.9 3.9 0 0 0-1.1 2.8 3.8 3.8 0 0 0 2.9-1.5Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
          <path fill="#34A853" d="M3 2.8v18.4l10.8-9.2L3 2.8Z" />
          <path fill="#4285F4" d="m13.8 12 3.1-2.6L5.2 2.8 13.8 12Z" />
          <path fill="#FBBC04" d="m13.8 12-8.6 9.2 11.7-6.6-3.1-2.6Z" />
          <path fill="#EA4335" d="m16.9 9.4 3.3 1.9c.7.4.7 1 0 1.4l-3.3 1.9-3.1-2.6 3.1-2.6Z" />
        </svg>
      )}
      <span className="leading-tight">
        <span className="block text-[9px] uppercase tracking-wide text-white/70">
          {isApple ? 'Tải về trên' : 'Tải ứng dụng trên'}
        </span>
        <span className="block text-sm font-bold">{store}</span>
      </span>
    </span>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12">
      <div className="page-shell">
        <div className="chrome-container">
          <div className="grid gap-6 rounded-[14px] bg-[var(--color-navy)] px-6 py-7 text-white lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex items-center gap-4">
              <Icon name="headset" className="h-10 w-10 shrink-0" />
              <div>
                <p className="text-xl font-extrabold">Bạn cần hỗ trợ?</p>
                <p className="text-base text-white/85">Đội ngũ Dịch Vụ Ơi luôn sẵn sàng</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {supportChannels.map((channel) => (
                <div key={channel.label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center bg-white/15">
                    <Icon name={channel.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-sm leading-tight">
                    <span className="block text-white/75">{channel.label}</span>
                    <span className="font-semibold">{channel.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white">
        <div className="page-shell">
          <div className="chrome-container grid gap-8 py-10 lg:grid-cols-[repeat(3,1fr)_auto]">
            {linkColumns.map((column) => (
              <div key={column.title}>
                <p className="text-base font-bold">{column.title}</p>
                <ul className="mt-3 space-y-2.5 text-[15px] text-[var(--color-muted)]">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to} className="hover:text-[var(--color-brand)]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="text-base font-bold">Kết nối với chúng tôi</p>
              <div className="mt-3 flex gap-2">
                {['Facebook', 'YouTube', 'TikTok', 'Instagram'].map((network) => (
                  <a
                    key={network}
                    title={network}
                    href="#"
                    aria-label={network}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)] transition hover:-translate-y-0.5 hover:bg-[var(--color-brand)] hover:text-white"
                  >
                    <SocialLogo network={network} />
                  </a>
                ))}
              </div>
              <p className="mt-5 text-base font-bold">Tải ứng dụng</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StoreBadge store="App Store" />
                <StoreBadge store="Google Play" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-line)]">
          <div className="page-shell">
            <div className="chrome-container flex flex-wrap items-center justify-between gap-2 py-4 text-sm text-[var(--color-muted)]">
              <span className="flex items-center gap-2">
                <img src={logo} alt="Dịch Vụ Ơi" className="h-6 w-6" />
                © {new Date().getFullYear()} Dịch Vụ Ơi. Nền tảng kết nối dịch vụ đa ngành.
              </span>
              <span className="flex items-center gap-1">
                <Icon name="pin" className="h-4 w-4" />
                Hồ Chí Minh
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
