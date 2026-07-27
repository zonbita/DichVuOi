import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from '../auth/auth.service';
import {
  EnablePartnerDto,
  SyncPartnerOfferingsDto,
  UpdatePartnerProfileDto,
} from './dto/update-partner-profile.dto';
import { PartnersService } from './partners.service';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(
    private readonly partnersService: PartnersService,
    private readonly authService: AuthService,
  ) {}

  /** Hồ sơ công khai người làm — không trả SĐT/email. */
  @Get('public/:userId')
  getPublic(@Param('userId') userId: string) {
    return this.partnersService.getPublicProfile(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('favorites/ids')
  listFavoriteIds(@CurrentUser() user: AuthUser) {
    return this.partnersService.listFavoriteIds(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  listFavorites(@CurrentUser() user: AuthUser) {
    return this.partnersService.listFavorites(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('favorites/:partnerUserId')
  addFavorite(
    @CurrentUser() user: AuthUser,
    @Param('partnerUserId') partnerUserId: string,
  ) {
    return this.partnersService.addFavorite(user.id, partnerUserId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('favorites/:partnerUserId')
  removeFavorite(
    @CurrentUser() user: AuthUser,
    @Param('partnerUserId') partnerUserId: string,
  ) {
    return this.partnersService.removeFavorite(user.id, partnerUserId);
  }

  /** Dual-role: bật nhận việc trên cùng account → trả session mới (JWT cập nhật role). */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('enable')
  async enable(@CurrentUser() user: AuthUser, @Body() dto: EnablePartnerDto) {
    await this.partnersService.enableOffering(user.id, dto);
    return this.authService.sessionFor(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Get('me')
  getMine(@CurrentUser() user: AuthUser) {
    return this.partnersService.getMine(user.id);
  }

  /** Chi tiết điểm cấp (giờ nghề + điểm khác). */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Get('me/level')
  getLevel(@CurrentUser() user: AuthUser) {
    return this.partnersService.getLevelBreakdown(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Patch('me')
  updateMine(@CurrentUser() user: AuthUser, @Body() dto: UpdatePartnerProfileDto) {
    return this.partnersService.updateMine(user.id, dto);
  }

  /** Chọn nhiều nghề (Service) — đồng bộ PartnerService như tags. */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Put('me/offerings')
  syncOfferings(
    @CurrentUser() user: AuthUser,
    @Body() dto: SyncPartnerOfferingsDto,
  ) {
    return this.partnersService.syncOfferings(user.id, dto);
  }
}
