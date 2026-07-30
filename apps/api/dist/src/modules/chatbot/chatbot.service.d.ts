import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type ChatSource = 'faq' | 'chatgpt' | 'fallback';
export type ChatbotReply = {
    reply: string;
    source: ChatSource;
    faqId?: string;
    matchedQuestion?: string;
    score?: number;
    suggestions: string[];
};
export declare class ChatbotService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private faqs;
    private openai;
    constructor(config: ConfigService);
    onModuleInit(): void;
    getStats(): {
        faqCount: number;
        chatgptEnabled: boolean;
        model: string;
    };
    getSuggestions(limit?: number): string[];
    ask(message: string, _sessionId?: string): Promise<ChatbotReply>;
    private loadFaqs;
    private findBestFaq;
    private askChatGpt;
    private normalize;
    private tokenize;
}
export {};
