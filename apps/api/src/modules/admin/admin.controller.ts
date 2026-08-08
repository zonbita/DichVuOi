import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import {
  AdminBookingQueryDto,
  AdminCreateServiceDto,
  AdminAdjustWalletDto,
  AdminFinanceTxQueryDto,
  AdminFinanceWalletQueryDto,
  AdminPageQueryDto,
  AdminPartnerQueryDto,
  AdminReviewServicePostDto,
  AdminServicePostQueryDto,
  AdminServiceQueryDto,
  AdminUpdateBookingDto,
  AdminUpdateGroupDto,
  AdminUpdatePartnerDto,
  AdminUpdateServiceDto,
  AdminUpdateUserDto,
  AdminUserQueryDto,
} from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('stats/gmv-series')
  gmvSeries(@Query('days') days?: string) {
    const n = days ? Number(days) : 30;
    return this.adminService.gmvSeries(Number.isFinite(n) ? n : 30);
  }

  @Get('audit-logs')
  listAuditLogs(@Query() query: AdminPageQueryDto) {
    return this.adminService.listAuditLogs(query);
  }

  @Get('finance/overview')
  financeOverview() {
    return this.adminService.financeOverview();
  }

  @Get('finance/wallets')
  listFinanceWallets(@Query() query: AdminFinanceWalletQueryDto) {
    return this.adminService.listFinanceWallets(query);
  }

  @Get('finance/transactions')
  listFinanceTransactions(@Query() query: AdminFinanceTxQueryDto) {
    return this.adminService.listFinanceTransactions(query);
  }

  @Post('finance/wallets/:userId/adjust')
  adjustWallet(
    @Param('userId') userId: string,
    @Body() dto: AdminAdjustWalletDto,
  ) {
    return this.adminService.adjustWallet(userId, dto);
  }

  @Get('users')
  listUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto).then(async (user) => {
      await this.adminService.writeAudit({
        actorId: actor.id,
        action:
          dto.chatBanned === true
            ? 'user.chat_ban'
            : dto.chatBanned === false
              ? 'user.chat_unban'
              : 'user.update_role',
        targetType: 'User',
        targetId: id,
        meta: { ...dto },
      });
      return user;
    });
  }

  @Get('partners')
  listPartners(@Query() query: AdminPartnerQueryDto) {
    return this.adminService.listPartners(query);
  }

  @Patch('partners/:userId')
  updatePartner(
    @Param('userId') userId: string,
    @Body() dto: AdminUpdatePartnerDto,
  ) {
    return this.adminService.updatePartner(userId, dto);
  }

  @Get('bookings')
  listBookings(@Query() query: AdminBookingQueryDto) {
    return this.adminService.listBookings(query);
  }

  @Get('bookings/:id')
  getBooking(@Param('id') id: string) {
    return this.adminService.getBooking(id);
  }

  @Patch('bookings/:id')
  updateBooking(@Param('id') id: string, @Body() dto: AdminUpdateBookingDto) {
    return this.adminService.updateBooking(id, dto);
  }

  @Get('reviews')
  listReviews(@Query() query: AdminPageQueryDto) {
    return this.adminService.listReviews(query);
  }

  /** Hàng chờ: người làm đang có bài PENDING. */
  @Get('service-posts/queue')
  listServicePostQueue(@Query() query: AdminPageQueryDto) {
    return this.adminService.listServicePostQueue(query);
  }

  @Get('service-posts')
  listServicePosts(@Query() query: AdminServicePostQueryDto) {
    return this.adminService.listServicePosts(query);
  }

  /** Chi tiết bài (kể cả PENDING) — trang duyệt kiểu gig. */
  @Get('service-posts/:id')
  getServicePost(@Param('id') id: string) {
    return this.adminService.getServicePostDetail(id);
  }

  @Patch('service-posts/:id')
  reviewServicePost(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminReviewServicePostDto,
  ) {
    return this.adminService.reviewServicePost(id, user.id, dto);
  }

  @Get('messages/flagged')
  listFlagged(@Query() query: AdminPageQueryDto) {
    return this.adminService.listFlaggedMessages(query);
  }

  @Get('catalog')
  catalog() {
    return this.adminService.listCatalogSummary();
  }

  @Get('categories')
  categories() {
    return this.adminService.listCategoryOptions();
  }

  @Get('services')
  listServices(@Query() query: AdminServiceQueryDto) {
    return this.adminService.listServices(query);
  }

  @Post('services')
  createService(@Body() dto: AdminCreateServiceDto) {
    return this.adminService.createService(dto);
  }

  @Patch('services/:id')
  updateService(
    @Param('id') id: string,
    @Body() dto: AdminUpdateServiceDto,
  ) {
    return this.adminService.updateService(id, dto);
  }

  @Patch('groups/:id')
  updateGroup(@Param('id') id: string, @Body() dto: AdminUpdateGroupDto) {
    return this.adminService.updateGroup(id, dto);
  }
}
