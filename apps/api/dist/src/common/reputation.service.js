"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma/prisma.service");
const partner_reputation_1 = require("./partner-reputation");
let ReputationService = class ReputationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPartnerAnchorDate(partnerUserId) {
        const user = await this.prisma.user.findUnique({
            where: { id: partnerUserId },
            select: { createdAt: true, partnerProfile: { select: { createdAt: true } } },
        });
        if (!user?.partnerProfile) {
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ người làm');
        }
        return user.partnerProfile.createdAt ?? user.createdAt;
    }
    async ensureCurrentPeriod(partnerUserId) {
        const anchorDate = await this.getPartnerAnchorDate(partnerUserId);
        const periodIndex = (0, partner_reputation_1.getReputationPeriodIndex)(anchorDate);
        const bounds = (0, partner_reputation_1.getReputationPeriodBounds)(anchorDate, periodIndex);
        const period = await this.prisma.partnerReputationPeriod.upsert({
            where: {
                partnerUserId_periodIndex: { partnerUserId, periodIndex },
            },
            create: {
                partnerUserId,
                periodIndex,
                startingPoints: partner_reputation_1.REPUTATION_STARTING_POINTS,
                currentPoints: partner_reputation_1.REPUTATION_STARTING_POINTS,
            },
            update: {},
        });
        return { period, bounds, anchorDate };
    }
    async getSnapshot(partnerUserId) {
        const { period, bounds } = await this.ensureCurrentPeriod(partnerUserId);
        const deductedThisPeriod = Math.max(0, period.startingPoints - period.currentPoints);
        return {
            currentPoints: period.currentPoints,
            startingPoints: period.startingPoints,
            percent: (0, partner_reputation_1.reputationPercent)(period.currentPoints, period.startingPoints),
            periodIndex: period.periodIndex,
            periodStart: bounds.start.toISOString(),
            periodEnd: bounds.end.toISOString(),
            deductedThisPeriod,
        };
    }
    async applyDeduction(partnerUserId, deductionPoints, reason, complaintId) {
        const { period } = await this.ensureCurrentPeriod(partnerUserId);
        const nextPoints = Math.max(0, period.currentPoints - deductionPoints);
        await this.prisma.$transaction([
            this.prisma.partnerReputationPeriod.update({
                where: { id: period.id },
                data: { currentPoints: nextPoints },
            }),
            this.prisma.reputationLedgerEntry.create({
                data: {
                    periodId: period.id,
                    delta: -deductionPoints,
                    reason,
                    complaintId,
                },
            }),
        ]);
        if (nextPoints < partner_reputation_1.REPUTATION_SUSPEND_THRESHOLD) {
            await this.prisma.partnerProfile.updateMany({
                where: { userId: partnerUserId, acceptingJobs: true },
                data: { acceptingJobs: false },
            });
        }
        return this.getSnapshot(partnerUserId);
    }
    async getSnapshotsBatch(partnerUserIds) {
        const result = new Map();
        const uniqueIds = [...new Set(partnerUserIds)];
        if (!uniqueIds.length)
            return result;
        const profiles = await this.prisma.partnerProfile.findMany({
            where: { userId: { in: uniqueIds } },
            select: {
                userId: true,
                createdAt: true,
                user: { select: { createdAt: true } },
            },
        });
        const keyed = profiles.map((profile) => {
            const anchorDate = profile.createdAt ?? profile.user.createdAt;
            const periodIndex = (0, partner_reputation_1.getReputationPeriodIndex)(anchorDate);
            const bounds = (0, partner_reputation_1.getReputationPeriodBounds)(anchorDate, periodIndex);
            return { partnerUserId: profile.userId, periodIndex, bounds };
        });
        if (!keyed.length)
            return result;
        const existing = await this.prisma.partnerReputationPeriod.findMany({
            where: {
                OR: keyed.map((k) => ({
                    partnerUserId: k.partnerUserId,
                    periodIndex: k.periodIndex,
                })),
            },
        });
        const periodByKey = new Map(existing.map((p) => [`${p.partnerUserId}:${p.periodIndex}`, p]));
        const missing = keyed.filter((k) => !periodByKey.has(`${k.partnerUserId}:${k.periodIndex}`));
        for (const k of missing) {
            const period = await this.prisma.partnerReputationPeriod.upsert({
                where: {
                    partnerUserId_periodIndex: {
                        partnerUserId: k.partnerUserId,
                        periodIndex: k.periodIndex,
                    },
                },
                create: {
                    partnerUserId: k.partnerUserId,
                    periodIndex: k.periodIndex,
                    startingPoints: partner_reputation_1.REPUTATION_STARTING_POINTS,
                    currentPoints: partner_reputation_1.REPUTATION_STARTING_POINTS,
                },
                update: {},
            });
            periodByKey.set(`${k.partnerUserId}:${k.periodIndex}`, period);
        }
        for (const k of keyed) {
            const period = periodByKey.get(`${k.partnerUserId}:${k.periodIndex}`);
            if (!period)
                continue;
            const deductedThisPeriod = Math.max(0, period.startingPoints - period.currentPoints);
            result.set(k.partnerUserId, {
                currentPoints: period.currentPoints,
                startingPoints: period.startingPoints,
                percent: (0, partner_reputation_1.reputationPercent)(period.currentPoints, period.startingPoints),
                periodIndex: period.periodIndex,
                periodStart: k.bounds.start.toISOString(),
                periodEnd: k.bounds.end.toISOString(),
                deductedThisPeriod,
            });
        }
        return result;
    }
};
exports.ReputationService = ReputationService;
exports.ReputationService = ReputationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReputationService);
//# sourceMappingURL=reputation.service.js.map