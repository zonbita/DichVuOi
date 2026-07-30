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
    const minutes = new Map();
    for (const row of rows) {
        const add = row.service.durationMin > 0 ? row.service.durationMin : 60;
        minutes.set(row.serviceId, (minutes.get(row.serviceId) ?? 0) + add);
    }
    const hours = new Map();
    for (const [serviceId, mins] of minutes) {
        hours.set(serviceId, minutesToWorkHours(mins));
    }
    return hours;
}
//# sourceMappingURL=partner-work-hours.js.map