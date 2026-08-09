import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateHomeReactionDto } from './dto/create-home-reaction.dto';
import { CreateHomeShoutDto } from './dto/create-home-shout.dto';
import { HomeLobbyService } from './home-lobby.service';
import { LobbyPresenceService } from './lobby-presence.service';

@ApiTags('home-lobby')
@Controller('home/lobby')
export class HomeLobbyController {
  constructor(
    private readonly homeLobby: HomeLobbyService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly lobbyPresence: LobbyPresenceService,
  ) {}

  /** Feed sảnh — công khai, guest chỉ xem. */
  @Get()
  @ApiQuery({ name: 'limit', required: false, example: 24 })
  list(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 24;
    return this.homeLobby.listFeed(Number.isFinite(parsed) ? parsed : 24);
  }

  /** Ai đang online trong sảnh (HTTP fallback). */
  @Get('presence')
  presence() {
    return this.lobbyPresence.snapshot();
  }

  /** Hô / quảng cáo 1 bài dịch vụ của mình — bắt buộc login. */
  @Post('shouts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateHomeShoutDto) {
    return this.homeLobby.create(user.id, dto);
  }

  /**
   * Smile livestream — mọi người bấm được.
   * Login: gắn tên; guest: cần guestId.
   */
  @Post('reactions')
  async react(
    @Body() dto: CreateHomeReactionDto,
    @Headers('authorization') authorization?: string,
  ) {
    let userId: string | undefined;
    let displayName: string | undefined;

    if (authorization?.startsWith('Bearer ')) {
      try {
        const payload = this.jwt.verify<{ sub: string }>(authorization.slice(7));
        userId = payload.sub;
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true },
        });
        displayName = user?.fullName;
      } catch {
        // Token lỗi → xử lý như guest (cần guestId)
      }
    }

    return this.homeLobby.react(dto, { userId, displayName });
  }
}
