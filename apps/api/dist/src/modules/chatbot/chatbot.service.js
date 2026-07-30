"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ChatbotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const openai_1 = __importDefault(require("openai"));
let ChatbotService = ChatbotService_1 = class ChatbotService {
    config;
    logger = new common_1.Logger(ChatbotService_1.name);
    faqs = [];
    openai = null;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        this.loadFaqs();
        const apiKey = this.config.get('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new openai_1.default({ apiKey });
            this.logger.log('ChatGPT enabled for chatbot fallback');
        }
        else {
            this.logger.warn('OPENAI_API_KEY missing — chatbot uses FAQ only');
        }
    }
    getStats() {
        return {
            faqCount: this.faqs.length,
            chatgptEnabled: Boolean(this.openai),
            model: this.config.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
        };
    }
    getSuggestions(limit = 8) {
        const topics = [
            'gioi-thieu',
            'dat-lich',
            'thanh-toan',
            'doi-tac',
            'nha-cua',
            'sua-chua',
            'cong-nghe',
            'game',
        ];
        const picks = [];
        for (const topic of topics) {
            const item = this.faqs.find((f) => f.topic === topic);
            if (item)
                picks.push(item.question);
            if (picks.length >= limit)
                break;
        }
        while (picks.length < limit && this.faqs.length > 0) {
            const item = this.faqs[picks.length * 37 % this.faqs.length];
            if (!picks.includes(item.question))
                picks.push(item.question);
            else
                break;
        }
        return picks.slice(0, limit);
    }
    async ask(message, _sessionId) {
        const trimmed = message.trim();
        const match = this.findBestFaq(trimmed);
        const suggestions = this.getSuggestions(6);
        if (match && match.score >= 0.28) {
            return {
                reply: match.item.answer,
                source: 'faq',
                faqId: match.item.id,
                matchedQuestion: match.item.question,
                score: Number(match.score.toFixed(3)),
                suggestions,
            };
        }
        if (this.openai) {
            try {
                const reply = await this.askChatGpt(trimmed, match?.item);
                return {
                    reply,
                    source: 'chatgpt',
                    faqId: match?.item.id,
                    matchedQuestion: match?.item.question,
                    score: match ? Number(match.score.toFixed(3)) : 0,
                    suggestions,
                };
            }
            catch (error) {
                this.logger.error('ChatGPT request failed', error);
            }
        }
        if (match) {
            return {
                reply: match.item.answer,
                source: 'faq',
                faqId: match.item.id,
                matchedQuestion: match.item.question,
                score: Number(match.score.toFixed(3)),
                suggestions,
            };
        }
        return {
            reply: 'Xin lỗi, mình chưa tìm thấy câu trả lời sẵn phù hợp. Bạn thử hỏi về đặt lịch, thanh toán, đối tác, dọn nhà, sửa chữa, gia sư, lập trình hoặc game — hoặc thêm OPENAI_API_KEY để bật ChatGPT.',
            source: 'fallback',
            suggestions,
        };
    }
    loadFaqs() {
        const candidates = [
            (0, node_path_1.join)(__dirname, 'data', 'faq-knowledge.json'),
            (0, node_path_1.join)(process.cwd(), 'src', 'modules', 'chatbot', 'data', 'faq-knowledge.json'),
            (0, node_path_1.join)(process.cwd(), 'dist', 'src', 'modules', 'chatbot', 'data', 'faq-knowledge.json'),
            (0, node_path_1.join)(process.cwd(), 'dist', 'modules', 'chatbot', 'data', 'faq-knowledge.json'),
        ];
        for (const path of candidates) {
            try {
                const raw = (0, node_fs_1.readFileSync)(path, 'utf8');
                this.faqs = JSON.parse(raw);
                this.logger.log(`Loaded ${this.faqs.length} FAQ items from ${path}`);
                return;
            }
            catch {
            }
        }
        this.logger.error('Could not load FAQ knowledge file');
        this.faqs = [];
    }
    findBestFaq(message) {
        const qNorm = this.normalize(message);
        const qTokens = this.tokenize(qNorm);
        if (!qTokens.length)
            return null;
        let best = null;
        for (const item of this.faqs) {
            const questionNorm = this.normalize(item.question);
            const answerNorm = this.normalize(item.answer);
            const kw = item.keywords.map((k) => this.normalize(k)).filter(Boolean);
            const qItemTokens = this.tokenize(questionNorm);
            let score = 0;
            if (questionNorm.includes(qNorm) || qNorm.includes(questionNorm)) {
                score += 0.55;
            }
            const overlap = qTokens.filter((t) => qItemTokens.includes(t)).length;
            score += (overlap / Math.max(qTokens.length, 1)) * 0.35;
            const kwHit = kw.filter((k) => qNorm.includes(k) || qTokens.some((t) => k.includes(t))).length;
            score += Math.min(kwHit * 0.08, 0.32);
            if (qTokens.some((t) => answerNorm.includes(t))) {
                score += 0.05;
            }
            if (!best || score > best.score) {
                best = { item, score };
            }
        }
        return best;
    }
    async askChatGpt(message, nearestFaq) {
        if (!this.openai) {
            throw new Error('OpenAI not configured');
        }
        const model = this.config.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
        const context = nearestFaq
            ? `Gợi ý từ FAQ gần nhất (${nearestFaq.id}):\nQ: ${nearestFaq.question}\nA: ${nearestFaq.answer}`
            : 'Không có FAQ gần khớp.';
        const completion = await this.openai.chat.completions.create({
            model,
            temperature: 0.4,
            max_tokens: 450,
            messages: [
                {
                    role: 'system',
                    content: [
                        'Bạn là trợ lý của nền tảng Dịch Vụ Ơi — kết nối khách với đối tác đa ngành nghề tại Việt Nam.',
                        'Trả lời ngắn gọn, tiếng Việt, thân thiện, chính xác theo sản phẩm: đặt lịch, thanh toán/escrow, đối tác, chat trong đơn, đánh giá.',
                        'Nhóm dịch vụ gồm nhà cửa, sửa chữa, chăm sóc, học tập, lập trình, game (ưu tiên coaching), thiết kế, xe...',
                        'Không bịa chính sách pháp lý. Nếu thiếu thông tin, hướng dẫn đặt lịch hoặc liên hệ hỗ trợ.',
                        'Không yêu cầu người dùng gửi mật khẩu/OTP.',
                    ].join(' '),
                },
                {
                    role: 'user',
                    content: `${context}\n\nCâu hỏi khách: ${message}`,
                },
            ],
        });
        return (completion.choices[0]?.message?.content?.trim() ||
            'Xin lỗi, hiện chưa tạo được câu trả lời. Bạn thử hỏi lại giúp mình.');
    }
    normalize(input) {
        return input
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    tokenize(normalized) {
        const stop = new Set([
            'toi',
            'ban',
            'cua',
            'va',
            'la',
            'co',
            'khong',
            'cho',
            'hoi',
            'giup',
            've',
            'tren',
            'voi',
            'mot',
            'cac',
            'nay',
            'the',
            'nao',
            'duoc',
            'hay',
            'de',
            'thi',
            'neu',
            'sao',
            'gi',
        ]);
        return normalized
            .split(' ')
            .filter((t) => t.length > 1 && !stop.has(t));
    }
};
exports.ChatbotService = ChatbotService;
exports.ChatbotService = ChatbotService = ChatbotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ChatbotService);
//# sourceMappingURL=chatbot.service.js.map