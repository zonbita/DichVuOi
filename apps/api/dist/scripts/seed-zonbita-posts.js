"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const EMAIL = 'zonbita96@gmail.com';
const SAMPLE_IMAGES = [
    '/uploads/service-posts/1786171005835-4ac2c9c4.jpg',
    '/uploads/service-posts/1786171011767-901087f1.jpg',
    '/uploads/service-posts/1786167707854-d54f7bd5.jpg',
    '/uploads/service-posts/1786134665865-f12c6953.jpg',
    '/uploads/service-posts/1786167716070-8aac525c.jpg',
    '/uploads/service-posts/1786171001346-150ddb99.jpg',
    '/uploads/service-posts/1786134661765-a1c37e46.jpg',
];
const FAKE_POSTS = [
    {
        serviceSlug: 'thiet-ke-banner-logo',
        title: 'Thiết kế logo & brand kit chuyên nghiệp',
        body: `<p>Thiết kế logo, bộ nhận diện thương hiệu gọn nhẹ cho startup và shop online.</p>
<ul><li>3 concept ban đầu</li><li>File AI / PNG / SVG</li><li>2 vòng chỉnh sửa</li></ul>
<p>Cam kết giao trong 3–5 ngày làm việc.</p>`,
        priceMin: 500_000,
        priceMax: 2_500_000,
        headline: 'Logo & brand kit — giao nhanh',
    },
    {
        serviceSlug: 'viet-content',
        title: 'Viết content bán hàng Facebook / Website',
        body: `<p>Viết bài bán hàng, landing page và caption social theo brief.</p>
<ul><li>Nghiên cứu góc bán</li><li>SEO cơ bản</li><li>Tone theo thương hiệu</li></ul>`,
        priceMin: 200_000,
        priceMax: 1_200_000,
        headline: 'Content bán hàng chuyển đổi tốt',
    },
    {
        serviceSlug: 'frontend-dev',
        title: 'Làm landing page React / Next.js',
        body: `<p>Landing page responsive, tối ưu tốc độ, gắn form / Pixel.</p>
<ul><li>UI theo Figma</li><li>Deploy Vercel/Netlify</li><li>Hỗ trợ 14 ngày</li></ul>`,
        priceMin: 2_000_000,
        priceMax: 8_000_000,
        headline: 'Landing page React nhanh – đẹp',
    },
    {
        serviceSlug: 'chay-ads-facebook',
        title: 'Setup & tối ưu quảng cáo Meta Ads',
        body: `<p>Thiết lập chiến dịch, audience, A/B creative và báo cáo tuần.</p>
<ul><li>Audit tài khoản</li><li>Setup pixel / CAPI</li><li>Tối ưu CPA</li></ul>`,
        priceMin: 1_500_000,
        priceMax: 5_000_000,
        headline: 'Meta Ads — tối ưu chi phí',
    },
    {
        serviceSlug: 'thiet-ke-ui-ux',
        title: 'Thiết kế UI app / dashboard Figma',
        body: `<p>UI kit + màn hình chính theo design system Dich Vụ Ơi / brand của bạn.</p>
<ul><li>Wireframe → hi-fi</li><li>Component library</li><li>Export sẵn cho dev</li></ul>`,
        priceMin: 1_800_000,
        priceMax: 6_000_000,
        headline: 'UI/UX Figma cho sản phẩm số',
    },
    {
        serviceSlug: 'sua-dien-nuoc',
        title: 'Sửa điện nước tại nhà — phản hồi nhanh',
        body: `<p>Khắc phục sự cố điện nước dân dụng, kiểm tra an toàn.</p>
<ul><li>Mang dụng cụ cơ bản</li><li>Báo giá trước khi làm</li><li>Bảo hành 30 ngày</li></ul>`,
        priceMin: 150_000,
        priceMax: 800_000,
        headline: 'Thợ điện nước gần bạn',
    },
];
function pickImages(seed, count = 3) {
    const out = [];
    for (let i = 0; i < count; i++) {
        out.push(SAMPLE_IMAGES[(seed + i) % SAMPLE_IMAGES.length]);
    }
    return out;
}
async function main() {
    let user = await prisma.user.findUnique({
        where: { email: EMAIL },
        include: { partnerProfile: true },
    });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: EMAIL,
                fullName: 'Admin Zonbita',
                role: client_1.Role.ADMIN,
                emailVerified: true,
                termsAcceptedAt: new Date(),
                partnerProfile: {
                    create: {
                        headline: 'Freelancer đa nghề — demo bài đăng',
                        bio: 'Tài khoản demo có bài đăng dịch vụ để test UI trang chủ / hồ sơ.',
                        city: 'Hồ Chí Minh',
                        acceptingJobs: true,
                        responseMinutes: 30,
                        level: 12,
                        isVerified: true,
                        phoneVerified: true,
                        bankVerified: true,
                        ratingAvg: 4.8,
                        ratingCount: 6,
                    },
                },
            },
            include: { partnerProfile: true },
        });
        console.log('Created user + partner profile');
    }
    else if (!user.partnerProfile) {
        await prisma.partnerProfile.create({
            data: {
                userId: user.id,
                headline: 'Freelancer đa nghề — demo bài đăng',
                bio: 'Tài khoản demo có bài đăng dịch vụ để test UI trang chủ / hồ sơ.',
                city: 'Hồ Chí Minh',
                acceptingJobs: true,
                responseMinutes: 30,
                level: 12,
                isVerified: true,
                phoneVerified: true,
                bankVerified: true,
                ratingAvg: 4.8,
                ratingCount: 6,
            },
        });
        user = await prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            include: { partnerProfile: true },
        });
        console.log('Created partner profile for existing user');
    }
    else {
        await prisma.partnerProfile.update({
            where: { userId: user.id },
            data: { acceptingJobs: true },
        });
    }
    const profileId = user.partnerProfile.id;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    for (let i = 0; i < FAKE_POSTS.length; i++) {
        const fake = FAKE_POSTS[i];
        const service = await prisma.service.findUnique({
            where: { slug: fake.serviceSlug },
            select: { id: true, name: true, slug: true, supportsOnline: true },
        });
        if (!service) {
            console.warn(`Skip — không có service slug: ${fake.serviceSlug}`);
            skipped++;
            continue;
        }
        await prisma.partnerService.upsert({
            where: {
                partnerProfileId_serviceId: {
                    partnerProfileId: profileId,
                    serviceId: service.id,
                },
            },
            create: {
                partnerProfileId: profileId,
                serviceId: service.id,
                price: fake.priceMin,
                priceMin: fake.priceMin,
                priceMax: fake.priceMax,
                headline: fake.headline,
                experienceYears: 3 + (i % 4),
                includes: 'Tư vấn brief, giao file đúng hạn',
                excludes: 'Hosting / domain / phí nền tảng quảng cáo',
                coverageNote: 'Online toàn quốc · Offline HCM (nếu nghề hỗ trợ)',
                isActive: true,
            },
            update: {
                price: fake.priceMin,
                priceMin: fake.priceMin,
                priceMax: fake.priceMax,
                headline: fake.headline,
                isActive: true,
            },
        });
        const images = pickImages(i, 3);
        const existing = await prisma.partnerServicePost.findUnique({
            where: {
                partnerProfileId_serviceId: {
                    partnerProfileId: profileId,
                    serviceId: service.id,
                },
            },
            select: { id: true },
        });
        if (existing) {
            await prisma.partnerServicePost.update({
                where: { id: existing.id },
                data: {
                    title: fake.title,
                    body: fake.body,
                    coverUrl: images[0],
                    imagesJson: JSON.stringify(images),
                    status: client_1.PartnerServicePostStatus.APPROVED,
                    rejectReason: null,
                    reviewedAt: new Date(),
                },
            });
            updated++;
            console.log(`Updated: ${service.slug} — ${fake.title}`);
        }
        else {
            await prisma.partnerServicePost.create({
                data: {
                    partnerProfileId: profileId,
                    serviceId: service.id,
                    title: fake.title,
                    body: fake.body,
                    coverUrl: images[0],
                    imagesJson: JSON.stringify(images),
                    status: client_1.PartnerServicePostStatus.APPROVED,
                    reviewedAt: new Date(),
                },
            });
            created++;
            console.log(`Created: ${service.slug} — ${fake.title}`);
        }
    }
    const posts = await prisma.partnerServicePost.findMany({
        where: { partnerProfileId: profileId },
        select: { id: true, title: true, status: true, service: { select: { slug: true } } },
    });
    console.log('\nDone.');
    console.log({ email: EMAIL, userId: user.id, created, updated, skipped, totalPosts: posts.length });
    for (const p of posts) {
        console.log(`  /user/${user.id}/dich-vu/${p.id}  [${p.status}] ${p.service.slug}`);
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
//# sourceMappingURL=seed-zonbita-posts.js.map