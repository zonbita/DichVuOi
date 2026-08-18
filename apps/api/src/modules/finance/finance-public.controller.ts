import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { FinanceService } from './finance.service';
import type { PayosWebhookPayload } from './payos.service';

/** Webhook cổng payOS — không JWT. */
@ApiTags('webhooks')
@Controller()
export class FinancePublicController {
  constructor(private readonly finance: FinanceService) {}

  @Post('webhooks/payos')
  @HttpCode(200)
  @SkipThrottle()
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: false,
    }),
  )
  async handlePayosWebhook(@Body() body: PayosWebhookPayload) {
    const result = await this.finance.handlePayosWebhook(body ?? {});
    if (!result.ok) {
      throw new UnauthorizedException('Chữ ký payOS không hợp lệ');
    }
    return result;
  }
}
