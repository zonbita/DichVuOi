"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUserNotBlocked = assertUserNotBlocked;
const common_1 = require("@nestjs/common");
async function assertUserNotBlocked(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isBlocked: true },
    });
    if (user?.isBlocked) {
        throw new common_1.ForbiddenException('Tài khoản bị chặn. Bạn chỉ có thể khiếu nại hoặc chat hỗ trợ với admin.');
    }
}
//# sourceMappingURL=assert-not-blocked.js.map