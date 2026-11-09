import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

/** Hóa đơn (đọc). */
@Injectable()
export class FinanceInvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async listInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: {
        OR: [{ customerId: userId }, { partnerId: userId }],
      },
      orderBy: { issuedAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
          },
        },
        customer: { select: { id: true, fullName: true } },
        partner: { select: { id: true, fullName: true } },
      },
    });
  }

  async getInvoice(invoiceId: string, userId: string, isAdmin = false) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            scheduledAt: true,
          },
        },
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        partner: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');
    if (
      !isAdmin &&
      invoice.customerId !== userId &&
      invoice.partnerId !== userId
    ) {
      throw new ForbiddenException('Không xem được hóa đơn này');
    }
    return invoice;
  }
}
