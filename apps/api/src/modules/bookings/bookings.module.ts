import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { BookingsPublicController } from './bookings-public.controller';
import { BookingsController } from './bookings.controller';
import { BookingsGateway } from './bookings.gateway';
import { BookingsService } from './bookings.service';
import { BookingSupportService } from './booking-support.service';
import { BookingSettlementService } from './booking-settlement.service';
import { BookingQueriesService } from './booking-queries.service';
import { BookingBoardService } from './booking-board.service';
import { BookingApplicationsService } from './booking-applications.service';
import { BookingStatusService } from './booking-status.service';
import { BookingMessagesService } from './booking-messages.service';
import { PartnerPresenceService } from './partner-presence.service';
import { PartnerRealtimeService } from './partner-realtime.service';
import { LobbyPresenceService } from '../home-lobby/lobby-presence.service';

@Module({
  imports: [AuthModule, FinanceModule],
  controllers: [BookingsPublicController, BookingsController],
  providers: [
    BookingsService,
    BookingSupportService,
    BookingSettlementService,
    BookingQueriesService,
    BookingBoardService,
    BookingApplicationsService,
    BookingStatusService,
    BookingMessagesService,
    PartnerRealtimeService,
    PartnerPresenceService,
    LobbyPresenceService,
    BookingsGateway,
  ],
  exports: [BookingsService, PartnerRealtimeService, LobbyPresenceService],
})
export class BookingsModule {}
