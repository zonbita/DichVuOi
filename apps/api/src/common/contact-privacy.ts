/**
 * Chống bỏ sàn (disintermediation): che SĐT / email / địa chỉ theo vai trò + trạng thái đơn.
 * Tham khảo Upwork/Fiverr (ẩn liên hệ + chat in-app) và Airbnb (mask phone).
 */

export type ContactViewerRole = 'customer' | 'partner' | 'open_queue' | 'admin';

export type ContactPolicy = {
  /** Liên hệ chính thức chỉ qua web / chat đơn. */
  channel: 'in_app';
  phoneRevealed: boolean;
  addressRevealed: boolean;
  /** Gợi ý UI khi chưa lộ SĐT. */
  hint: string;
};

const PHONE_RE =
  /(?:\+?84|0)[\s.\-_]*(?:\d[\s.\-_]*){8,10}|\b\d{3}[\s.\-]?\d{3}[\s.\-]?\d{3,4}\b/gi;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const HANDLE_RE =
  /(?:zalo|facebook|fb|telegram|tele|viber|whatsapp|discord|skype)\s*[:./\-]?\s*[\w.@/+\-]{3,}/gi;
const URL_CONTACT_RE =
  /(?:https?:\/\/)?(?:zalo\.me|fb\.com|facebook\.com|t\.me|wa\.me|discord\.gg)\/[\w/?=&%-]+/gi;

export function maskPhone(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 8) return '••••••••';
  const head = digits.slice(0, 3);
  const tail = digits.slice(-2);
  return `${head}****${tail}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '•••@•••';
  const [local, domain] = email.split('@');
  const safeLocal = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${safeLocal}@${domain}`;
}

/** Che địa chỉ trước khi nhận việc — chỉ gợi ý khu vực. */
export function maskAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return 'Khu vực sẽ hiện sau khi nhận việc';

  const parts = trimmed
    .split(/[,|–—-]/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `Khu vực: ${parts[parts.length - 1]} (địa chỉ đầy đủ sau khi nhận việc)`;
  }

  if (trimmed.length <= 12) {
    return 'Khu vực gần bạn (địa chỉ đầy đủ sau khi nhận việc)';
  }

  return `${trimmed.slice(0, 10)}… (địa chỉ đầy đủ sau khi nhận việc)`;
}

/** Reset lastIndex vì regex global. */
function resetRegexFlags() {
  PHONE_RE.lastIndex = 0;
  EMAIL_RE.lastIndex = 0;
  HANDLE_RE.lastIndex = 0;
  URL_CONTACT_RE.lastIndex = 0;
}

export function detectContactLeak(text: string): boolean {
  if (!text) return false;
  resetRegexFlags();
  const found =
    PHONE_RE.test(text) ||
    EMAIL_RE.test(text) ||
    HANDLE_RE.test(text) ||
    URL_CONTACT_RE.test(text);
  resetRegexFlags();
  return found;
}

export function redactContactLeak(text: string): {
  text: string;
  redacted: boolean;
} {
  if (!text) return { text: '', redacted: false };
  if (!detectContactLeak(text)) return { text, redacted: false };

  resetRegexFlags();
  const cleaned = text
    .replace(URL_CONTACT_RE, '[đã ẩn liên hệ ngoài sàn]')
    .replace(HANDLE_RE, '[đã ẩn liên hệ ngoài sàn]')
    .replace(EMAIL_RE, '[đã ẩn email]')
    .replace(PHONE_RE, '[đã ẩn SĐT]');

  return { text: cleaned, redacted: true };
}

/** Đã đặt cọc / đã giải ngân — đủ điều kiện lộ liên hệ theo trạng thái đơn. */
export function isDepositHeld(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === 'HELD' || paymentStatus === 'RELEASED';
}

/**
 * Quy tắc lộ liên hệ:
 * - open_queue: không SĐT, địa chỉ che (tránh partner «săn» SĐT rồi bỏ sàn)
 * - partner sau nhận việc + đã cọc: địa chỉ đủ; SĐT chỉ từ IN_PROGRESS
 * - chưa cọc (UNPAID): không lộ địa chỉ / SĐT cho partner; không chat
 * - customer: không bao giờ thấy SĐT/email partner
 * - admin: full
 */
export function resolveContactPolicy(
  status: string,
  viewer: ContactViewerRole,
  paymentStatus: string | null | undefined = 'UNPAID',
): ContactPolicy {
  const funded = isDepositHeld(paymentStatus);

  if (viewer === 'admin') {
    return {
      channel: 'in_app',
      phoneRevealed: true,
      addressRevealed: true,
      hint: '',
    };
  }

  if (viewer === 'open_queue') {
    return {
      channel: 'in_app',
      phoneRevealed: false,
      addressRevealed: false,
      hint: 'Chỉ hiện đơn đã đặt cọc. SĐT/địa chỉ đủ sau khi nhận việc — chat trên Dich Vụ Ơi.',
    };
  }

  if (viewer === 'customer') {
    if (!funded && status !== 'CANCELLED') {
      return {
        channel: 'in_app',
        phoneRevealed: false,
        addressRevealed: true,
        hint: 'Bắt buộc đặt cọc giữ chỗ trước khi đơn vào hàng chờ / chat / lộ liên hệ cho người làm.',
      };
    }
    const active =
      status === 'CONFIRMED' ||
      status === 'IN_PROGRESS' ||
      status === 'COMPLETED';
    return {
      channel: 'in_app',
      phoneRevealed: false,
      addressRevealed: true,
      hint: active
        ? 'Không hiện SĐT người làm — nhắn qua chat đơn. Khiếu nại / hoàn tiền qua sàn.'
        : 'Đã đặt cọc — đang chờ người nhận. Liên hệ chỉ qua Dich Vụ Ơi.',
    };
  }

  // partner đã nhận việc
  if (!funded) {
    return {
      channel: 'in_app',
      phoneRevealed: false,
      addressRevealed: false,
      hint: 'Khách chưa đặt cọc — chưa lộ địa chỉ/SĐT, chưa mở chat. Nhắc khách thanh toán giữ chỗ trên sàn.',
    };
  }

  const phoneRevealed =
    status === 'IN_PROGRESS' || status === 'COMPLETED';
  const addressRevealed =
    status === 'CONFIRMED' ||
    status === 'IN_PROGRESS' ||
    status === 'COMPLETED';

  return {
    channel: 'in_app',
    phoneRevealed,
    addressRevealed,
    hint: phoneRevealed
      ? 'SĐT lộ để phối hợp tại chỗ. Cấm thanh toán / nhận việc ngoài sàn (ToS).'
      : 'Ưu tiên chat đơn. SĐT khách lộ khi bắt đầu làm (IN_PROGRESS).',
  };
}

type BookingParty = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
};

export type RawBookingForPrivacy = {
  status: string;
  paymentStatus?: string | null;
  customerName: string;
  customerPhone: string;
  address: string;
  note: string | null;
  userId: string;
  partnerId: string | null;
  partner?: BookingParty | null;
  user?: BookingParty | null;
  [key: string]: unknown;
};

export function shapeBookingForViewer<T extends RawBookingForPrivacy>(
  booking: T,
  viewer: ContactViewerRole,
): T & {
  contactPolicy: ContactPolicy;
  customerPhoneMasked: boolean;
  addressMasked: boolean;
} {
  const policy = resolveContactPolicy(
    booking.status,
    viewer,
    booking.paymentStatus ?? 'UNPAID',
  );

  let customerPhone = booking.customerPhone;
  let address = booking.address;
  let customerPhoneMasked = false;
  let addressMasked = false;

  if (viewer === 'open_queue' || (viewer === 'partner' && !policy.phoneRevealed)) {
    customerPhone = maskPhone(booking.customerPhone);
    customerPhoneMasked = true;
  } else if (viewer === 'customer') {
    // Khách xem đơn của mình: hiện SĐT mình đã nhập
    customerPhone = booking.customerPhone;
    customerPhoneMasked = false;
  }

  if (!policy.addressRevealed && viewer !== 'customer' && viewer !== 'admin') {
    address = maskAddress(booking.address);
    addressMasked = true;
  }

  const partner =
    booking.partner == null
      ? null
      : viewer === 'admin'
        ? {
            id: booking.partner.id,
            fullName: booking.partner.fullName,
            phone: booking.partner.phone,
            email: booking.partner.email,
          }
        : viewer === 'partner'
          ? {
              id: booking.partner.id,
              fullName: booking.partner.fullName,
              phone: null,
              email: '',
            }
          : {
              // customer / open_queue: không lộ SĐT / email partner
              id: booking.partner.id,
              fullName: booking.partner.fullName,
              phone: null,
              email: '',
            };

  let user: BookingParty | null = null;
  if (booking.user) {
    if (viewer === 'admin' || viewer === 'customer') {
      user = booking.user;
    } else {
      user = {
        id: booking.user.id,
        fullName: booking.user.fullName,
        phone: policy.phoneRevealed ? booking.user.phone : null,
        email: '',
      };
    }
  }

  if (
    user &&
    (viewer === 'open_queue' || (viewer === 'partner' && !policy.phoneRevealed))
  ) {
    user = { ...user, phone: null, email: '' };
  }

  return {
    ...booking,
    customerPhone,
    address,
    partner,
    user,
    contactPolicy: policy,
    customerPhoneMasked,
    addressMasked,
  };
}
