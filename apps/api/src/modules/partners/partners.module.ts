import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

@Module({
  imports: [AuthModule, ComplaintsModule],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
