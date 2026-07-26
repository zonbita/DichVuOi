import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingsController } from './bookings.controller';
import { BookingsGateway } from './bookings.gateway';
import { BookingsService } from './bookings.service';
import { PartnerRealtimeService } from './partner-realtime.service';

@Module({
  imports: [AuthModule],
  controllers: [BookingsController],
  providers: [BookingsService, PartnerRealtimeService, BookingsGateway],
  exports: [BookingsService, PartnerRealtimeService],
})
export class BookingsModule {}
