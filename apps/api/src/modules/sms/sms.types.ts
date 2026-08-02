export type SmsSendResult = {
  ok: true;
  provider: 'esms' | 'mock';
  /** ID tin phía gateway (nếu có). */
  messageId?: string;
  sandbox?: boolean;
};

export type SmsProviderName = 'esms' | 'mock';
