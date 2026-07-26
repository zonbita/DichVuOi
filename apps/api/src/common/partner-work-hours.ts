import type { PrismaClient } from '@prisma/client';

/** Phút → giờ (1 chữ số thập phân). */
export function minutesToWorkHours(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.round((minutes / 60) * 10) / 10;
}

/**
 * Tổng giờ làm trên sàn theo từng serviceId (đơn COMPLETED × Service.durationMin).
 */
export async function hoursWorkedByServiceIds(
  prisma: Pick<PrismaClient, 'booking'>,
  partnerUserId: string,
  serviceIds?: string[],
): Promise<Map<string, number>> {
  const rows = await prisma.booking.findMany({
    where: {
      partnerId: partnerUserId,
      status: 'COMPLETED',
      ...(serviceIds?.length ? { serviceId: { in: serviceIds } } : {}),
    },
    select: {
      serviceId: true,
      service: { select: { durationMin: true } },
    },
  });

  const minutes = new Map<string, number>();
  for (const row of rows) {
    const add = row.service.durationMin > 0 ? row.service.durationMin : 60;
    minutes.set(row.serviceId, (minutes.get(row.serviceId) ?? 0) + add);
  }

  const hours = new Map<string, number>();
  for (const [serviceId, mins] of minutes) {
    hours.set(serviceId, minutesToWorkHours(mins));
  }
  return hours;
}
