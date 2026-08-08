"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const posts = await prisma.partnerServicePost.findMany({
        orderBy: { updatedAt: 'desc' },
        select: { id: true, partnerProfileId: true, serviceId: true },
    });
    const seen = new Set();
    const remove = [];
    for (const p of posts) {
        const key = `${p.partnerProfileId}::${p.serviceId}`;
        if (seen.has(key))
            remove.push(p.id);
        else
            seen.add(key);
    }
    if (remove.length) {
        await prisma.partnerServicePost.deleteMany({ where: { id: { in: remove } } });
    }
    console.log(`kept ${seen.size}, removed ${remove.length}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=dedupe-service-posts.js.map