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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
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
import {
  ConfirmBankVerifyDto,
  ConfirmPhoneOtpDto,
  LinkBankAccountDto,
  RequestPhoneOtpDto,
} from './dto/partner-verify.dto';
import { PartnersService } from './partners.service';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(
    private readonly partnersService: PartnersService,
    private readonly authService: AuthService,
  ) {}

  /** Tìm người làm theo tên / nghề (công khai). */
  @Get('search')
  @ApiQuery({ name: 'q', required: true, example: 'gia su toan' })
  @ApiQuery({ name: 'limit', required: false, example: 24 })
  searchPublic(
    @Query('q') q = '',
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? Number(limit) : 24;
    return this.partnersService.searchPublic(
      q,
      Number.isFinite(parsed) ? parsed : 24,
    );
  }

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Post('me/verify-phone/request')
  requestPhoneOtp(
    @CurrentUser() user: AuthUser,
    @Body() dto: RequestPhoneOtpDto,
  ) {
    return this.partnersService.requestPhoneOtp(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Post('me/verify-phone/confirm')
  confirmPhoneOtp(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmPhoneOtpDto,
  ) {
    return this.partnersService.confirmPhoneOtp(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Post('me/verify-bank/link')
  linkBank(@CurrentUser() user: AuthUser, @Body() dto: LinkBankAccountDto) {
    return this.partnersService.linkBankAccount(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Post('me/verify-bank/mock-confirm')
  confirmBank(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmBankVerifyDto,
  ) {
    return this.partnersService.confirmBankVerify(user.id, dto);
  }
}
