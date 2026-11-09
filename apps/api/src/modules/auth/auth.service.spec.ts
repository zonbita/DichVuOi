import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { createFakePrisma, FakePrisma } from '../../testing/fake-prisma';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { AuthService, buildOneTimePhoneKey, otpNameSlug } from './auth.service';

const verifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken })),
}));

describe('AuthService', () => {
  let prisma: FakePrisma;
  let jwt: JwtService;
  let sms: { isLive: jest.Mock; sendOtpSms: jest.Mock };
  let mail: { isConfigured: jest.Mock; send: jest.Mock };
  let service: AuthService;
  const SECRET = 'test-secret';

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createFakePrisma();
    jwt = new JwtService({ secret: SECRET });
    sms = {
      isLive: jest.fn().mockReturnValue(false),
      sendOtpSms: jest.fn().mockResolvedValue({ sandbox: false }),
    };
    mail = {
      isConfigured: jest.fn().mockReturnValue(false),
      send: jest.fn().mockResolvedValue({ provider: 'mock' }),
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt,
      sms as unknown as SmsService,
      mail as unknown as MailService,
    );
  });

  const registerDto = {
    email: '  Alice@Example.COM ',
    password: 'S3cret!pass',
    fullName: ' Alice ',
    acceptedTerms: true,
  } as any;

  describe('register', () => {
    it('hashes password, lowercases email, issues JWT', async () => {
      const res = await service.register(registerDto);
      const row = prisma.user.rows[0];
      expect(row.email).toBe('alice@example.com');
      expect(row.fullName).toBe('Alice');
      expect(row.role).toBe('CUSTOMER');
      expect(row.passwordHash).not.toBe('S3cret!pass');
      expect(await bcrypt.compare('S3cret!pass', row.passwordHash)).toBe(true);
      expect(res.user).not.toHaveProperty('passwordHash');
      const payload = jwt.verify(res.accessToken, { secret: SECRET });
      expect(payload).toMatchObject({
        sub: row.id,
        email: 'alice@example.com',
        role: 'CUSTOMER',
      });
    });

    it('creates PARTNER when enableOffering', async () => {
      await service.register({ ...registerDto, enableOffering: true });
      expect(prisma.user.rows[0].role).toBe('PARTNER');
      expect(prisma.user.rows[0].partnerProfile).toBeDefined();
    });

    it('rejects without terms and duplicate email', async () => {
      await expect(
        service.register({ ...registerDto, acceptedTerms: false }),
      ).rejects.toThrow(BadRequestException);
      await service.register(registerDto);
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.register(registerDto);
    });

    it('accepts correct password (case-insensitive email)', async () => {
      const res = await service.login({
        email: 'ALICE@example.com',
        password: 'S3cret!pass',
      });
      expect(res.user.email).toBe('alice@example.com');
      expect(jwt.verify(res.accessToken, { secret: SECRET }).sub).toBe(
        prisma.user.rows[0].id,
      );
    });

    it('rejects wrong password and unknown email', async () => {
      await expect(
        service.login({ email: 'alice@example.com', password: 'x' } as any),
      ).rejects.toThrow('Email hoặc mật khẩu không đúng');
      await expect(
        service.login({ email: 'bob@example.com', password: 'x' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('tells Google-only accounts to use Google', async () => {
      prisma.user.rows[0].passwordHash = null;
      await expect(
        service.login({
          email: 'alice@example.com',
          password: 'S3cret!pass',
        } as any),
      ).rejects.toThrow(/Google/);
    });
  });

  describe('loginWithGoogle', () => {
    const OLD = process.env.GOOGLE_CLIENT_ID;
    beforeEach(() => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
    });
    afterAll(() => {
      if (OLD === undefined) delete process.env.GOOGLE_CLIENT_ID;
      else process.env.GOOGLE_CLIENT_ID = OLD;
    });

    const ticket = (payload: object) => ({ getPayload: () => payload });

    it('creates CUSTOMER with no password for new Google user', async () => {
      verifyIdToken.mockResolvedValue(
        ticket({ sub: 'g1', email: 'G@x.com', name: 'Gina' }),
      );
      const res = await service.loginWithGoogle({ idToken: 't' });
      expect(prisma.user.rows[0]).toMatchObject({
        email: 'g@x.com',
        googleId: 'g1',
        passwordHash: null,
        emailVerified: true,
        termsAcceptedAt: null,
      });
      expect(res.accessToken).toEqual(expect.any(String));
    });

    it('links existing email account', async () => {
      await service.register({ ...registerDto, email: 'g@x.com' });
      verifyIdToken.mockResolvedValue(ticket({ sub: 'g1', email: 'g@x.com' }));
      await service.loginWithGoogle({ idToken: 't' });
      expect(prisma.user.rows).toHaveLength(1);
      expect(prisma.user.rows[0].googleId).toBe('g1');
    });

    it('rejects invalid token, unverified email, other google id', async () => {
      verifyIdToken.mockRejectedValueOnce(new Error('bad'));
      await expect(
        service.loginWithGoogle({ idToken: 't' } as any),
      ).rejects.toThrow(UnauthorizedException);

      verifyIdToken.mockResolvedValueOnce(
        ticket({ sub: 'g1', email: 'g@x.com', email_verified: false }),
      );
      await expect(
        service.loginWithGoogle({ idToken: 't' } as any),
      ).rejects.toThrow('Email Google chưa được xác minh');

      prisma.user.seed({
        email: 'g@x.com',
        googleId: 'other',
        role: 'CUSTOMER',
      });
      verifyIdToken.mockResolvedValueOnce(
        ticket({ sub: 'g1', email: 'g@x.com' }),
      );
      await expect(
        service.loginWithGoogle({ idToken: 't' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('requires GOOGLE_CLIENT_ID', async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      await expect(
        service.loginWithGoogle({ idToken: 't' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('phone OTP', () => {
    beforeEach(() => {
      prisma.user.seed({ id: 'u1', fullName: 'Nguyễn Đức', email: 'u@x.com' });
    });

    it('slug/key helpers strip diacritics', () => {
      expect(otpNameSlug('Nguyễn Đức')).toBe('NguyenDuc');
      expect(otpNameSlug('!!!')).toBe('User');
      expect(buildOneTimePhoneKey('An', '123456')).toBe('An-123456');
    });

    it('mock channel returns key; confirming verifies and burns it', async () => {
      const res: any = await service.requestPhoneOtp('u1', {
        phone: '0901234567',
      });
      expect(res.channel).toBe('web_key_mock');
      expect(res.key).toMatch(/^NguyenDuc-\d{6}$/);

      await expect(
        service.confirmPhoneOtp('u1', { key: 'wrong' } as any),
      ).rejects.toThrow(BadRequestException);

      const me = await service.confirmPhoneOtp('u1', { key: res.key });
      expect(me.phoneVerified).toBe(true);
      expect(prisma.user.rows[0].phoneOtpKey).toBeNull();
      await expect(
        service.confirmPhoneOtp('u1', { key: res.key } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('live SMS does not leak key', async () => {
      sms.isLive.mockReturnValue(true);
      const res: any = await service.requestPhoneOtp('u1', {
        phone: '0901234567',
      });
      expect(res.key).toBeUndefined();
      expect(sms.sendOtpSms).toHaveBeenCalled();
    });

    it('locks out after 5 wrong attempts', async () => {
      await service.requestPhoneOtp('u1', { phone: '0901234567' });
      for (let i = 0; i < 5; i++) {
        await expect(
          service.confirmPhoneOtp('u1', { key: 'nope' } as any),
        ).rejects.toThrow('Key không đúng');
      }
      await expect(
        service.confirmPhoneOtp('u1', { key: 'nope' } as any),
      ).rejects.toThrow('Quá nhiều lần nhập sai');
      expect(prisma.user.rows[0].phoneOtpKey).toBeNull();
    });
  });
});
