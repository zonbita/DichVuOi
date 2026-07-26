import {
  detectContactLeak,
  maskAddress,
  maskPhone,
  redactContactLeak,
  resolveContactPolicy,
  shapeBookingForViewer,
} from './contact-privacy';

describe('contact-privacy', () => {
  it('masks phone keeping head/tail', () => {
    expect(maskPhone('0901234567')).toBe('090****67');
  });

  it('masks address to area hint', () => {
    expect(maskAddress('12 Nguyễn Huệ, Quận 1, TP.HCM')).toContain('TP.HCM');
    expect(maskAddress('12 Nguyễn Huệ, Quận 1, TP.HCM')).toContain('sau khi nhận');
  });

  it('detects and redacts leaks', () => {
    expect(detectContactLeak('Gọi zalo 0901234567 nhé')).toBe(true);
    expect(detectContactLeak('Chỉ hỏi về giờ làm')).toBe(false);
    const { text, redacted } = redactContactLeak(
      'Inbox zalo.me/abc hoặc a@email.com',
    );
    expect(redacted).toBe(true);
    expect(text).not.toContain('zalo.me');
    expect(text).not.toContain('a@email.com');
  });

  it('open_queue never reveals phone/address', () => {
    const policy = resolveContactPolicy('PENDING', 'open_queue');
    expect(policy.phoneRevealed).toBe(false);
    expect(policy.addressRevealed).toBe(false);
  });

  it('partner gets phone only from IN_PROGRESS when funded', () => {
    expect(
      resolveContactPolicy('CONFIRMED', 'partner', 'HELD').phoneRevealed,
    ).toBe(false);
    expect(
      resolveContactPolicy('IN_PROGRESS', 'partner', 'HELD').phoneRevealed,
    ).toBe(true);
  });

  it('partner masks address until deposit held', () => {
    expect(
      resolveContactPolicy('CONFIRMED', 'partner', 'UNPAID').addressRevealed,
    ).toBe(false);
    expect(
      resolveContactPolicy('CONFIRMED', 'partner', 'HELD').addressRevealed,
    ).toBe(true);
  });

  it('shapes open booking without raw phone', () => {
    const shaped = shapeBookingForViewer(
      {
        status: 'PENDING',
        paymentStatus: 'HELD',
        customerName: 'A',
        customerPhone: '0901234567',
        address: '12 Nguyễn Huệ, Quận 1, TP.HCM',
        note: null,
        userId: 'u1',
        partnerId: null,
        partner: null,
        user: {
          id: 'u1',
          fullName: 'A',
          phone: '0901234567',
          email: 'a@x.com',
        },
      },
      'open_queue',
    );
    expect(shaped.customerPhone).toBe('090****67');
    expect(shaped.customerPhoneMasked).toBe(true);
    expect(shaped.addressMasked).toBe(true);
    expect(shaped.address).not.toContain('Nguyễn Huệ');
    expect(shaped.user?.email).toBe('');
  });

  it('hides partner phone from customer', () => {
    const shaped = shapeBookingForViewer(
      {
        status: 'CONFIRMED',
        paymentStatus: 'HELD',
        customerName: 'A',
        customerPhone: '0901234567',
        address: '12 Nguyễn Huệ',
        note: null,
        userId: 'u1',
        partnerId: 'p1',
        partner: {
          id: 'p1',
          fullName: 'Thợ B',
          phone: '0911111111',
          email: 'b@x.com',
        },
        user: {
          id: 'u1',
          fullName: 'A',
          phone: '0901234567',
          email: 'a@x.com',
        },
      },
      'customer',
    );
    expect(shaped.partner?.phone).toBeNull();
    expect(shaped.partner?.email).toBe('');
    expect(shaped.partner?.fullName).toBe('Thợ B');
    expect(shaped.customerPhone).toBe('0901234567');
  });
});
