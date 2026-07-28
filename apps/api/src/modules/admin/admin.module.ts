import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { FinanceModule } from '../finance/finance.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [FinanceModule, CatalogModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
