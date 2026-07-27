import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReputationService } from '../../common/reputation.service';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';

@Module({
  imports: [AuthModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ReputationService],
  exports: [ComplaintsService, ReputationService],
})
export class ComplaintsModule {}
