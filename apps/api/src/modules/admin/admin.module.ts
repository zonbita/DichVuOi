import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { FinanceModule } from '../finance/finance.module';
import { AdminBookingsService } from './admin-bookings.service';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminController } from './admin.controller';
import { AdminFinanceService } from './admin-finance.service';
import { AdminPartnersService } from './admin-partners.service';
import { AdminService } from './admin.service';
import { AdminServicePostsService } from './admin-service-posts.service';
import { AdminStatsService } from './admin-stats.service';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [FinanceModule, CatalogModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminStatsService,
    AdminFinanceService,
    AdminUsersService,
    AdminPartnersService,
    AdminBookingsService,
    AdminCatalogService,
    AdminServicePostsService,
  ],
})
export class AdminModule {}
