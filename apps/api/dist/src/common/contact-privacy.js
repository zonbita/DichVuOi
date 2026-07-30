"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPhone = maskPhone;
exports.maskEmail = maskEmail;
exports.maskAddress = maskAddress;
exports.detectContactLeak = detectContactLeak;
exports.redactContactLeak = redactContactLeak;
exports.isDepositHeld = isDepositHeld;
exports.resolveContactPolicy = resolveContactPolicy;
exports.shapeBookingForViewer = shapeBookingForViewer;
const PHONE_RE = /(?:\+?84|0)[\s.\-_]*(?:\d[\s.\-_]*){8,10}|\b\d{3}[\s.\-]?\d{3}[\s.\-]?\d{3,4}\b/gi;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const HANDLE_RE = /(?:zalo|facebook|fb|telegram|tele|viber|whatsapp|discord|skype)\s*[:./\-]?\s*[\w.@/+\-]{3,}/gi;
const URL_CONTACT_RE = /(?:https?:\/\/)?(?:zalo\.me|fb\.com|facebook\.com|t\.me|wa\.me|discord\.gg)\/[\w/?=&%-]+/gi;
function maskPhone(phone) {
    const digits = (phone ?? '').replace(/\D/g, '');
    if (digits.length < 8)
        return '••••••••';
    const head = digits.slice(0, 3);
    const tail = digits.slice(-2);
    return `${head}****${tail}`;
}
function maskEmail(email) {
    if (!email || !email.includes('@'))
        return '•••@•••';
    const [local, domain] = email.split('@');
    const safeLocal = local.length <= 1 ? '*' : `${local[0]}***`;
    return `${safeLocal}@${domain}`;
}
function maskAddress(address) {
    const trimmed = address.trim();
    if (!trimmed)
        return 'Khu vực sẽ hiện sau khi nhận việc';
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
function resetRegexFlags() {
    PHONE_RE.lastIndex = 0;
    EMAIL_RE.lastIndex = 0;
    HANDLE_RE.lastIndex = 0;
    URL_CONTACT_RE.lastIndex = 0;
}
function detectContactLeak(text) {
    if (!text)
        return false;
    resetRegexFlags();
    const found = PHONE_RE.test(text) ||
        EMAIL_RE.test(text) ||
        HANDLE_RE.test(text) ||
        URL_CONTACT_RE.test(text);
    resetRegexFlags();
    return found;
}
function redactContactLeak(text) {
    if (!text)
        return { text: '', redacted: false };
    if (!detectContactLeak(text))
        return { text, redacted: false };
    resetRegexFlags();
    const cleaned = text
        .replace(URL_CONTACT_RE, '[đã ẩn liên hệ ngoài sàn]')
        .replace(HANDLE_RE, '[đã ẩn liên hệ ngoài sàn]')
        .replace(EMAIL_RE, '[đã ẩn email]')
        .replace(PHONE_RE, '[đã ẩn SĐT]');
    return { text: cleaned, redacted: true };
}
function isDepositHeld(paymentStatus) {
    return paymentStatus === 'HELD' || paymentStatus === 'RELEASED';
}
function resolveContactPolicy(status, viewer, paymentStatus = 'UNPAID') {
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
        if (status === 'CANCELLED') {
            return {
                channel: 'in_app',
                phoneRevealed: false,
                addressRevealed: true,
                hint: paymentStatus === 'REFUNDED'
                    ? 'Đơn đã hủy — cọc đã hoàn về ví.'
                    : 'Đơn đã hủy.',
            };
        }
        if (!funded) {
            return {
                channel: 'in_app',
                phoneRevealed: false,
                addressRevealed: true,
                hint: 'Bắt buộc đặt cọc giữ chỗ trước khi đơn vào hàng chờ / chat / lộ liên hệ cho người làm.',
            };
        }
        const active = status === 'CONFIRMED' ||
            status === 'IN_PROGRESS' ||
            status === 'AWAITING_CONFIRM' ||
            status === 'DISPUTED' ||
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
    if (!funded) {
        return {
            channel: 'in_app',
            phoneRevealed: false,
            addressRevealed: false,
            hint: 'Khách chưa đặt cọc — chưa lộ địa chỉ/SĐT, chưa mở chat. Nhắc khách thanh toán giữ chỗ trên sàn.',
        };
    }
    const phoneRevealed = status === 'IN_PROGRESS' ||
        status === 'AWAITING_CONFIRM' ||
        status === 'DISPUTED' ||
        status === 'COMPLETED';
    const addressRevealed = status === 'CONFIRMED' ||
        status === 'IN_PROGRESS' ||
        status === 'AWAITING_CONFIRM' ||
        status === 'DISPUTED' ||
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
function shapeBookingForViewer(booking, viewer) {
    const policy = resolveContactPolicy(booking.status, viewer, booking.paymentStatus ?? 'UNPAID');
    let customerPhone = booking.customerPhone;
    let address = booking.address;
    let customerPhoneMasked = false;
    let addressMasked = false;
    if (viewer === 'open_queue' || (viewer === 'partner' && !policy.phoneRevealed)) {
        customerPhone = maskPhone(booking.customerPhone);
        customerPhoneMasked = true;
    }
    else if (viewer === 'customer') {
        customerPhone = booking.customerPhone;
        customerPhoneMasked = false;
    }
    if (!policy.addressRevealed && viewer !== 'customer' && viewer !== 'admin') {
        address = maskAddress(booking.address);
        addressMasked = true;
    }
    const partner = booking.partner == null
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
                    id: booking.partner.id,
                    fullName: booking.partner.fullName,
                    phone: null,
                    email: '',
                };
    let user = null;
    if (booking.user) {
        if (viewer === 'admin' || viewer === 'customer') {
            user = booking.user;
        }
        else {
            user = {
                id: booking.user.id,
                fullName: booking.user.fullName,
                phone: policy.phoneRevealed ? booking.user.phone : null,
                email: '',
            };
        }
    }
    if (user &&
        (viewer === 'open_queue' || (viewer === 'partner' && !policy.phoneRevealed))) {
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
//# sourceMappingURL=contact-privacy.js.map