"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minutesToWorkHours = minutesToWorkHours;
exports.hoursWorkedByServiceIds = hoursWorkedByServiceIds;
function minutesToWorkHours(minutes) {
    if (minutes <= 0)
        return 0;
    return Math.round((minutes / 60) * 10) / 10;
}
async function hoursWorkedByServiceIds(prisma, partnerUserId, serviceIds) {
    if (serviceIds && serviceIds.length === 0)
        return new Map();
    const groups = await prisma.booking.groupBy({
        by: ['serviceId'],
        where: {
            partnerId: partnerUserId,
            status: 'COMPLETED',
            ...(serviceIds?.length ? { serviceId: { in: serviceIds } } : {}),
        },
        _count: { _all: true },
    });
    if (!groups.length)
        return new Map();
    const services = await prisma.service.findMany({
        where: { id: { in: groups.map((g) => g.serviceId) } },
        select: { id: true, durationMin: true },
    });
    const durationById = new Map(services.map((s) => [s.id, s.durationMin > 0 ? s.durationMin : 60]));
    const hours = new Map();
    for (const g of groups) {
        const perJob = durationById.get(g.serviceId) ?? 60;
        hours.set(g.serviceId, minutesToWorkHours(perJob * g._count._all));
    }
    return hours;
}
//# sourceMappingURL=partner-work-hours.js.map