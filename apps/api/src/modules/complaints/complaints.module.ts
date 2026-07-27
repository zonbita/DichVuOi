import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { ReputationService } from '../../common/reputation.service';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';

@Module({
  imports: [AuthModule, FinanceModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ReputationService],
  exports: [ComplaintsService, ReputationService],
})
export class ComplaintsModule {}
