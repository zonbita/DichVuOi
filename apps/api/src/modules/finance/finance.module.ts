import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinancePublicController } from './finance-public.controller';
import { FinanceService } from './finance.service';
import { FinanceWalletService } from './finance-wallet.service';
import { FinanceTopUpService } from './finance-topup.service';
import { FinanceInvoiceService } from './finance-invoice.service';
import { FinanceEscrowService } from './finance-escrow.service';
import { FinanceApplyDepositService } from './finance-apply-deposit.service';
import { FinanceReconciliationService } from './finance-reconciliation.service';
import { PayosService } from './payos.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [FinancePublicController, FinanceController],
  providers: [
    FinanceService,
    FinanceWalletService,
    FinanceTopUpService,
    FinanceInvoiceService,
    FinanceEscrowService,
    FinanceApplyDepositService,
    FinanceReconciliationService,
    PayosService,
  ],
  exports: [FinanceService],
})
export class FinanceModule {}
