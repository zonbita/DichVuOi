export type ChatbotSource = 'faq' | 'chatgpt' | 'fallback';

export type ChatbotReply = {
  reply: string;
  source: ChatbotSource;
  faqId?: string;
  matchedQuestion?: string;
  score?: number;
  suggestions: string[];
};

export type ChatbotStats = {
  faqCount: number;
  chatgptEnabled: boolean;
  model: string;
};
