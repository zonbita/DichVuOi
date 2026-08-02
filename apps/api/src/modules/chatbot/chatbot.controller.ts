import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AskChatbotDto } from './dto/ask-chatbot.dto';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('suggestions')
  suggestions(@Query('limit') limit?: string) {
    const n = Math.min(Math.max(Number(limit) || 8, 1), 20);
    return this.chatbotService.getSuggestions(n);
  }

  @Get('stats')
  stats() {
    return this.chatbotService.getStats();
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('ask')
  ask(@Body() dto: AskChatbotDto) {
    return this.chatbotService.ask(dto.message, dto.sessionId);
  }
}
