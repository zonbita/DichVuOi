import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthModule } from './modules/health/health.module';
import { PartnersModule } from './modules/partners/partners.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { FinanceModule } from './modules/finance/finance.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    CatalogModule,
    BookingsModule,
    PartnersModule,
    AdminModule,
    ComplaintsModule,
    FinanceModule,
    ChatbotModule,
    UploadsModule,
  ],
})
export class AppModule {}
