"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculatePartnerLevel = recalculatePartnerLevel;
const partner_level_1 = require("./partner-level");
async function recalculatePartnerLevel(prisma, partnerUserId) {
    const profile = await prisma.partnerProfile.findUnique({
        where: { userId: partnerUserId },
        select: {
            id: true,
            ratingAvg: true,
            ratingCount: true,
            isVerified: true,
            onlineSeconds: true,
        },
    });
    if (!profile)
        return null;
    const [completedJobs, activeOfferings] = await Promise.all([
        prisma.booking.count({
            where: { partnerId: partnerUserId, status: 'COMPLETED' },
        }),
        prisma.partnerService.count({
            where: { partnerProfileId: profile.id, isActive: true },
        }),
    ]);
    const breakdown = (0, partner_level_1.computePartnerLevel)({
        onlineHours: profile.onlineSeconds / 3600,
        completedJobs,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
        isVerified: profile.isVerified,
        activeOfferings,
    });
    await prisma.partnerProfile.update({
        where: { userId: partnerUserId },
        data: { level: breakdown.level },
    });
    return breakdown;
}
//# sourceMappingURL=recalculate-partner-level.js.map