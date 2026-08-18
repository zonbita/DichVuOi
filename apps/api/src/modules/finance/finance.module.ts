import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinancePublicController } from './finance-public.controller';
import { FinanceService } from './finance.service';
import { PayosService } from './payos.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [FinancePublicController, FinanceController],
  providers: [FinanceService, PayosService],
  exports: [FinanceService],
})
export class FinanceModule {}
