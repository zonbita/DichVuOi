import { env, validateEnv } from './env';

describe('env', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('parses boolean flags and leaves unknown values undefined', () => {
    process.env.ALLOW_MOCK_PAYMENTS = 'yes';
    expect(env.allowMockPayments).toBe(true);
    process.env.ALLOW_MOCK_PAYMENTS = 'false';
    expect(env.allowMockPayments).toBe(false);
    process.env.ALLOW_MOCK_PAYMENTS = 'maybe';
    expect(env.allowMockPayments).toBeUndefined();
  });

  it('treats blank strings as missing and applies defaults', () => {
    process.env.PORT = '   ';
    process.env.SMS_PROVIDER = '';
    expect(env.port).toBe(3001);
    expect(env.smsProvider).toBe('mock');
  });

  it('strips whitespace from the Gmail app password', () => {
    process.env.GMAIL_APP_PASSWORD = 'abcd efgh ijkl mnop';
    expect(env.gmailAppPassword).toBe('abcdefghijklmnop');
  });

  it('detects production-like environments', () => {
    process.env.NODE_ENV = 'development';
    process.env.VERCEL_ENV = 'production';
    expect(env.isProductionLike).toBe(true);
  });
});

describe('validateEnv', () => {
  it('accepts an empty development env', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('requires core secrets in production', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(
      /DATABASE_URL.*\n.*JWT_SECRET.*\n.*CORS_ORIGIN/,
    );
  });

  it('rejects malformed PORT and SMS_PROVIDER', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => validateEnv({ SMS_PROVIDER: 'twilio' })).toThrow(
      /SMS_PROVIDER/,
    );
  });
});
