"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';
async function main() {
    const u = await prisma.user.findUnique({
        where: { email: 'zonbita96@gmail.com' },
        include: {
            partnerProfile: {
                include: {
                    servicePosts: {
                        include: { service: true },
                        orderBy: { updatedAt: 'desc' },
                    },
                },
            },
        },
    });
    if (!u?.partnerProfile) {
        console.log('Không tìm thấy user/profile');
        return;
    }
    console.log(`PROFILE\t${BASE}/user/${u.id}`);
    for (const post of u.partnerProfile.servicePosts) {
        console.log(`${post.status}\t${post.service.slug}\t${post.title}\t${BASE}/user/${u.id}/dich-vu/${post.id}`);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=list-zonbita-posts.js.map