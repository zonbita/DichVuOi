import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { TopUpDto } from './dto/top-up.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('wallet')
  getWallet(@CurrentUser() user: AuthUser) {
    return this.finance.getWallet(user.id);
  }

  @Post('wallet/top-up')
  topUp(@CurrentUser() user: AuthUser, @Body() dto: TopUpDto) {
    return this.finance.topUp(user.id, dto.amount);
  }

  @Get('invoices')
  listInvoices(@CurrentUser() user: AuthUser) {
    return this.finance.listInvoices(user.id);
  }

  @Get('invoices/:id')
  getInvoice(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.finance.getInvoice(id, user.id, user.role === 'ADMIN');
  }
}
