import { Injectable } from '@nestjs/common';
import { AdminBookingsService } from './admin-bookings.service';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminFinanceService } from './admin-finance.service';
import { AdminPartnersService } from './admin-partners.service';
import { AdminServicePostsService } from './admin-service-posts.service';
import { AdminStatsService } from './admin-stats.service';
import { AdminUsersService } from './admin-users.service';
import {
  AdminAdjustWalletDto,
  AdminBookingQueryDto,
  AdminCreateServiceDto,
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
} from './dto';

/**
 * Thin facade over the per-area admin services. Keeps the public API that
 * AdminController depends on; all logic lives in the delegated services.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly statsSvc: AdminStatsService,
    private readonly financeSvc: AdminFinanceService,
    private readonly usersSvc: AdminUsersService,
    private readonly partnersSvc: AdminPartnersService,
    private readonly bookingsSvc: AdminBookingsService,
    private readonly catalogSvc: AdminCatalogService,
    private readonly servicePostsSvc: AdminServicePostsService,
  ) {}

  // Dashboard
  stats() {
    return this.statsSvc.stats();
  }

  /** GMV theo ngày (đơn COMPLETED) — biểu đồ Tổng quan. */
  gmvSeries(days = 30) {
    return this.statsSvc.gmvSeries(days);
  }

  // Finance
  financeOverview() {
    return this.financeSvc.financeOverview();
  }

  listFinanceWallets(query: AdminFinanceWalletQueryDto) {
    return this.financeSvc.listFinanceWallets(query);
  }

  listFinanceTransactions(query: AdminFinanceTxQueryDto) {
    return this.financeSvc.listFinanceTransactions(query);
  }

  adjustWallet(userId: string, dto: AdminAdjustWalletDto) {
    return this.financeSvc.adjustWallet(userId, dto);
  }

  // Users / moderation / audit
  listUsers(query: AdminUserQueryDto) {
    return this.usersSvc.listUsers(query);
  }

  updateUser(id: string, dto: AdminUpdateUserDto) {
    return this.usersSvc.updateUser(id, dto);
  }

  writeAudit(input: {
    actorId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
  }) {
    return this.usersSvc.writeAudit(input);
  }

  listAuditLogs(query: AdminPageQueryDto) {
    return this.usersSvc.listAuditLogs(query);
  }

  listReviews(query: AdminPageQueryDto) {
    return this.usersSvc.listReviews(query);
  }

  listFlaggedMessages(query: AdminPageQueryDto) {
    return this.usersSvc.listFlaggedMessages(query);
  }

  // Partners
  listPartners(query: AdminPartnerQueryDto) {
    return this.partnersSvc.listPartners(query);
  }

  updatePartner(userId: string, dto: AdminUpdatePartnerDto) {
    return this.partnersSvc.updatePartner(userId, dto);
  }

  // Bookings / disputes
  listBookings(query: AdminBookingQueryDto) {
    return this.bookingsSvc.listBookings(query);
  }

  /** Chi tiết một đơn cho trang điều tra / xử lý tranh chấp. */
  getBooking(id: string) {
    return this.bookingsSvc.getBooking(id);
  }

  updateBooking(id: string, dto: AdminUpdateBookingDto) {
    return this.bookingsSvc.updateBooking(id, dto);
  }

  // Catalog
  listCatalogSummary() {
    return this.catalogSvc.listCatalogSummary();
  }

  /** Danh mục phẳng (kèm tên nhóm) — đổ vào select khi tạo / sửa dịch vụ. */
  listCategoryOptions() {
    return this.catalogSvc.listCategoryOptions();
  }

  listServices(query: AdminServiceQueryDto) {
    return this.catalogSvc.listServices(query);
  }

  createService(dto: AdminCreateServiceDto) {
    return this.catalogSvc.createService(dto);
  }

  updateService(id: string, dto: AdminUpdateServiceDto) {
    return this.catalogSvc.updateService(id, dto);
  }

  updateGroup(id: string, dto: AdminUpdateGroupDto) {
    return this.catalogSvc.updateGroup(id, dto);
  }

  // Partner service posts
  /** Người làm đang có ≥1 bài chờ duyệt — hàng chờ admin. */
  listServicePostQueue(query: AdminPageQueryDto) {
    return this.servicePostsSvc.listServicePostQueue(query);
  }

  /** Chi tiết bài cho admin duyệt (mọi status). */
  getServicePostDetail(id: string) {
    return this.servicePostsSvc.getServicePostDetail(id);
  }

  listServicePosts(query: AdminServicePostQueryDto) {
    return this.servicePostsSvc.listServicePosts(query);
  }

  reviewServicePost(
    id: string,
    adminUserId: string,
    dto: AdminReviewServicePostDto,
  ) {
    return this.servicePostsSvc.reviewServicePost(id, adminUserId, dto);
  }
}
