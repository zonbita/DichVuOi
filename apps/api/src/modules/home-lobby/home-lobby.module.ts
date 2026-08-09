import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';
import { HomeLobbyController } from './home-lobby.controller';
import { HomeLobbyService } from './home-lobby.service';

@Module({
  imports: [AuthModule, BookingsModule],
  controllers: [HomeLobbyController],
  providers: [HomeLobbyService],
})
export class HomeLobbyModule {}
