import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

/** Chặn thao tác sàn khi admin đã khóa tài khoản (vẫn cho khiếu nại / chat support). */
export async function assertUserNotBlocked(
  prisma: PrismaService,
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBlocked: true },
  });
  if (user?.isBlocked) {
    throw new ForbiddenException(
      'Tài khoản bị chặn. Bạn chỉ có thể khiếu nại hoặc chat hỗ trợ với admin.',
    );
  }
}
