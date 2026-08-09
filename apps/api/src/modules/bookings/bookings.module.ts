import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { BookingsPublicController } from './bookings-public.controller';
import { BookingsController } from './bookings.controller';
import { BookingsGateway } from './bookings.gateway';
import { BookingsService } from './bookings.service';
import { PartnerPresenceService } from './partner-presence.service';
import { PartnerRealtimeService } from './partner-realtime.service';
import { LobbyPresenceService } from '../home-lobby/lobby-presence.service';

@Module({
  imports: [AuthModule, FinanceModule],
  controllers: [BookingsPublicController, BookingsController],
  providers: [
    BookingsService,
    PartnerRealtimeService,
    PartnerPresenceService,
    LobbyPresenceService,
    BookingsGateway,
  ],
  exports: [BookingsService, PartnerRealtimeService, LobbyPresenceService],
})
export class BookingsModule {}
