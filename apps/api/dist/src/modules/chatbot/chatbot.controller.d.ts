import { AskChatbotDto } from './dto/ask-chatbot.dto';
import { ChatbotService } from './chatbot.service';
export declare class ChatbotController {
    private readonly chatbotService;
    constructor(chatbotService: ChatbotService);
    suggestions(limit?: string): string[];
    stats(): {
        faqCount: number;
        chatgptEnabled: boolean;
        model: string;
    };
    ask(dto: AskChatbotDto): Promise<import("./chatbot.service").ChatbotReply>;
}
