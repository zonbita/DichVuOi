import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { catalogGroups, obsoleteCategorySlugs } from './catalog-data';

const prisma = new PrismaClient();

type SeedPartner = {
  email: string;
  fullName: string;
  phone: string;
  headline: string;
  bio: string;
  city: string;
  districts: string;
  skills: string[];
  workModes: string;
  acceptingJobs: boolean;
  responseMinutes: number;
  experienceYears: number;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  phoneVerified: boolean;
  bankVerified: boolean;
  priceFactor: number;
  /** Cấp 1–100 (chỉ người làm). */
  level: number;
  avatarUrl: string;
  /** Chỉ nhận dịch vụ thuộc nhóm catalog này. */
  specialtyGroupSlug: string;
};

/** Mỗi dịch vụ lấy tối đa N người đúng chuyên môn nhóm ngành. */
const PROVIDERS_PER_SERVICE = 5;
/** Số hồ sơ partner seed. */
const PARTNER_COUNT = 45;

/** Chuyên môn theo slug nhóm catalog — headline / skills khớp nghề. */
const SPECIALTIES: Array<{
  groupSlug: string;
  headline: string;
  skills: string[];
  bio: string;
}> = [
  {
    groupSlug: 'nha-cua',
    headline: 'Giúp việc · dọn dẹp · vệ sinh nhà cửa',
    skills: ['dọn nhà', 'tổng vệ sinh', 'sofa'],
    bio: 'Nhận dọn theo ca, tổng vệ sinh và giặt sofa. Đúng giờ, sạch sẽ.',
  },
  {
    groupSlug: 'sua-chua',
    headline: 'Thợ điện nước · camera · điện lạnh',
    skills: ['điện nước', 'lắp camera', 'điều hòa'],
    bio: 'Sửa chữa điện nước, lắp camera/mạng và bảo trì điện lạnh tại nhà.',
  },
  {
    groupSlug: 'xay-dung',
    headline: 'Thợ xây · sơn · hoàn thiện nhà',
    skills: ['sơn nhà', 'ốp lát', 'sửa chữa'],
    bio: 'Nhận việc hoàn thiện, sơn và sửa chữa nhỏ trong nhà.',
  },
  {
    groupSlug: 'cham-soc',
    headline: 'Chăm sóc người già · trẻ nhỏ tại nhà',
    skills: ['chăm sóc', 'trông trẻ', 'người già'],
    bio: 'Chăm sóc tận tâm, giao tiếp rõ ràng với gia đình.',
  },
  {
    groupSlug: 'lam-dep',
    headline: 'Makeup · chăm sóc da · tóc tại nhà',
    skills: ['makeup', 'spa', 'tóc'],
    bio: 'Trang điểm và chăm sóc sắc đẹp tại nhà theo lịch hẹn.',
  },
  {
    groupSlug: 'bep-doi-song',
    headline: 'Nấu ăn theo yêu cầu · tiệc tại nhà',
    skills: ['nấu ăn', 'tiệc', 'bếp'],
    bio: 'Nấu theo thực đơn gia đình hoặc đãi tiệc nhỏ tại nhà.',
  },
  {
    groupSlug: 'xe',
    headline: 'Thợ sửa xe · hỗ trợ vận chuyển',
    skills: ['sửa xe', 'ô tô', 'vận chuyển'],
    bio: 'Sửa xe máy/ô tô cơ bản và hỗ trợ vận chuyển theo yêu cầu.',
  },
  {
    groupSlug: 'hoc-tap',
    headline: 'Gia sư Toán · Lý · tiếng Anh',
    skills: ['gia sư', 'Toán', 'tiếng Anh'],
    bio: 'Dạy kèm tại nhà hoặc online, lộ trình theo học lực học sinh.',
  },
  {
    groupSlug: 'game',
    headline: 'Coaching game · setup PC',
    skills: ['coaching game', 'Liên Quân', 'setup PC'],
    bio: 'Huấn luyện leo rank và hỗ trợ dựng máy chơi game.',
  },
  {
    groupSlug: 'lap-trinh',
    headline: 'Lập trình viên · hỗ trợ IT',
    skills: ['lập trình', 'web', 'Excel'],
    bio: 'Nhận việc code, sửa lỗi và hỗ trợ tin học văn phòng.',
  },
  {
    groupSlug: 'thiet-ke',
    headline: 'Thiết kế đồ họa · UI/UX',
    skills: ['thiết kế', 'banner', 'UI'],
    bio: 'Thiết kế nhận diện, banner và giao diện theo brief.',
  },
  {
    groupSlug: 'su-kien',
    headline: 'Chụp ảnh · quay · hỗ trợ sự kiện',
    skills: ['chụp ảnh', 'quay video', 'sự kiện'],
    bio: 'Phục vụ tiệc cưới, sự kiện công ty và họp mặt gia đình.',
  },
  {
    groupSlug: 'thu-cung',
    headline: 'Chăm sóc thú cưng tại nhà',
    skills: ['thú cưng', 'pet sitting', 'tắm cắt'],
    bio: 'Trông giữ và chăm sóc thú cưng khi chủ vắng nhà.',
  },
  {
    groupSlug: 'the-thao',
    headline: 'PT thể hình · yoga tại nhà',
    skills: ['PT', 'yoga', 'fitness'],
    bio: 'Luyện tập cá nhân theo mục tiêu sức khỏe của bạn.',
  },
  {
    groupSlug: 'doanh-nghiep',
    headline: 'Hỗ trợ văn phòng · hành chính',
    skills: ['văn phòng', 'hành chính', 'Excel'],
    bio: 'Hỗ trợ nghiệp vụ văn phòng và công việc hành chính theo giờ.',
  },
  {
    groupSlug: 'tai-chinh',
    headline: 'Tư vấn thủ tục · hỗ trợ tài chính cơ bản',
    skills: ['kế toán', 'thuế', 'thủ tục'],
    bio: 'Hỗ trợ giấy tờ, sổ sách đơn giản cho hộ kinh doanh.',
  },
  {
    groupSlug: 'san-vuon',
    headline: 'Chăm sóc sân vườn · cây cảnh',
    skills: ['cây cảnh', 'cắt tỉa', 'sân vườn'],
    bio: 'Chăm sóc cây, cắt tỉa và dọn sân vườn theo lịch.',
  },
  {
    groupSlug: 'marketing-online',
    headline: 'Chạy quảng cáo · vận hành kênh bán',
    skills: ['Facebook Ads', 'TikTok Shop', 'fanpage'],
    bio: 'Lên chiến dịch, tối ưu ngân sách và vận hành gian hàng online.',
  },
  {
    groupSlug: 'ngon-ngu',
    headline: 'Biên dịch · phiên dịch online',
    skills: ['dịch thuật', 'phụ đề', 'hiệu đính'],
    bio: 'Dịch tài liệu, làm phụ đề và phiên dịch họp trực tuyến.',
  },
  {
    groupSlug: 'tro-ly-tu-xa',
    headline: 'Trợ lý từ xa · nhập liệu · báo cáo',
    skills: ['trợ lý ảo', 'nhập liệu', 'báo cáo'],
    bio: 'Hỗ trợ hành chính, dữ liệu và lịch hẹn hoàn toàn từ xa.',
  },
  {
    groupSlug: 'tu-van-phat-trien',
    headline: 'Coach sự nghiệp · kỹ năng cá nhân',
    skills: ['hướng nghiệp', 'coaching', 'kỹ năng'],
    bio: 'Đồng hành định hướng nghề nghiệp và xây thói quen làm việc.',
  },
  {
    groupSlug: 'giai-tri',
    headline: 'MC tiệc online · trò chơi · đồng hành giải trí',
    skills: ['MC online', 'board game', 'hát live'],
    bio: 'Tổ chức buổi giải trí trực tuyến: biểu diễn, trò chơi và đồng hành thư giãn.',
  },
];

const FIRST_NAMES = [
  'An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Hùng', 'Khánh', 'Lan', 'Linh', 'Minh',
  'Nam', 'Nga', 'Phúc', 'Quân', 'Sơn', 'Thảo', 'Trang', 'Tuấn', 'Vy', 'Yến',
];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Hoàng', 'Ngọc', 'Đức', 'Thanh', 'Quốc', 'Kim'];
const LAST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi',
  'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý',
];
const CITIES = [
  'Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
  'Biên Hòa',
  'Nha Trang',
  'Huế',
];
const BIOS = [
  'Làm việc đúng giờ, cẩn thận, sẵn sàng hỗ trợ ngoài giờ khi cần.',
  'Kinh nghiệm thực tế nhiều năm, nhận việc trong ngày nếu lịch trống.',
  'Ưu tiên chất lượng và sự hài lòng của khách hàng.',
  'Có dụng cụ chuyên nghiệp, báo giá rõ ràng trước khi làm.',
  'Phục vụ khu vực nội thành và các quận lân cận.',
  'Tận tâm, sạch sẽ, giao tiếp lịch sự.',
  'Nhận cả việc ngắn hạn và gói dài hạn theo tháng.',
  'Đã hoàn thành nhiều đơn trên sàn, đánh giá ổn định.',
];

const DISTRICTS_BY_CITY: Record<string, string[]> = {
  'Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Bình Thạnh', 'Phú Nhuận', 'Thủ Đức'],
  'Hà Nội': ['Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Ba Đình', 'Long Biên'],
  'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Sơn Trà'],
  'Cần Thơ': ['Ninh Kiều', 'Cái Răng'],
  'Hải Phòng': ['Ngô Quyền', 'Lê Chân', 'Hồng Bàng'],
  'Biên Hòa': ['Tam Hiệp', 'Tân Phong'],
  'Nha Trang': ['Lộc Thọ', 'Vĩnh Hải'],
  Huế: ['Phú Hội', 'Vỹ Dạ'],
};

/** Ảnh chân dung người Việt 200×200 trong `apps/web/public/avatars`, ổn định theo seed. */
const PORTRAIT_COUNT = 9;

function partnerAvatar(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const index = (hash % PORTRAIT_COUNT) + 1;
  return `/avatars/vn-avatar-${String(index).padStart(2, '0')}.jpg`;
}
function buildSeedPartners(): SeedPartner[] {
  const suaChua = SPECIALTIES.find((s) => s.groupSlug === 'sua-chua')!;
  const partners: SeedPartner[] = [
    {
      email: 'partner@dichvuoi.vn',
      fullName: 'Freelancer Demo',
      phone: '0911111111',
      headline: suaChua.headline,
      bio: suaChua.bio,
      city: 'Hồ Chí Minh',
      districts: 'Quận 1, Quận 3, Bình Thạnh',
      skills: suaChua.skills,
      workModes: 'onsite,online',
      acceptingJobs: true,
      responseMinutes: 15,
      experienceYears: 6,
      ratingAvg: 4.9,
      ratingCount: 214,
      isVerified: true,
      phoneVerified: true,
      bankVerified: true,
      priceFactor: 1,
      level: 42,
      avatarUrl: partnerAvatar('partner@dichvuoi.vn'),
      specialtyGroupSlug: 'sua-chua',
    },
  ];

  for (let i = 1; i < PARTNER_COUNT; i += 1) {
    const specialty = SPECIALTIES[i % SPECIALTIES.length];
    const last = LAST_NAMES[i % LAST_NAMES.length];
    const middle = MIDDLE_NAMES[i % MIDDLE_NAMES.length];
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const fullName = `${last} ${middle} ${first}`;
    const email = `partner${String(i).padStart(2, '0')}@dichvuoi.vn`;
    const phone = `09${String(10000000 + i * 137).slice(0, 8)}`;
    const ratingAvg = Math.round((4.2 + (i % 8) * 0.1) * 10) / 10;
    const priceFactor = Math.round((0.85 + (i % 10) * 0.04) * 100) / 100;
    const level = Math.min(100, Math.max(1, 1 + ((i * 17 + 3) % 100)));
    const city = CITIES[i % CITIES.length];
    const districtPool = DISTRICTS_BY_CITY[city] ?? ['Nội thành'];
    const districts = districtPool.slice(0, 2 + (i % 3)).join(', ');
    const workModes =
      i % 5 === 0 ? 'online' : i % 3 === 0 ? 'onsite,online' : 'onsite';

    partners.push({
      email,
      fullName,
      phone,
      headline: specialty.headline,
      bio: `${specialty.bio} ${BIOS[i % BIOS.length]}`,
      city,
      districts,
      skills: specialty.skills,
      workModes,
      acceptingJobs: i % 7 !== 0,
      responseMinutes: [15, 30, 45, 60][i % 4],
      experienceYears: 1 + (i % 12),
      ratingAvg: Math.min(5, ratingAvg),
      ratingCount: 20 + i * 17,
      isVerified: i % 3 !== 0,
      phoneVerified: i % 2 !== 0,
      bankVerified: i % 4 === 0,
      priceFactor,
      level,
      avatarUrl: partnerAvatar(email),
      specialtyGroupSlug: specialty.groupSlug,
    });
  }

  return partners;
}

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 10);

  /** Nick khách thuê demo — cùng mật khẩu demo1234, ví đủ để đặt đơn. */
  const demoCustomers: Array<{
    email: string;
    fullName: string;
    phone: string;
    walletBalance: number;
  }> = [
    {
      email: 'demo@dichvuoi.vn',
      fullName: 'Khách Demo',
      phone: '0900000000',
      walletBalance: 5_000_000,
    },
    {
      email: 'demo02@dichvuoi.vn',
      fullName: 'Khách Demo 02',
      phone: '0900000002',
      walletBalance: 3_000_000,
    },
    {
      email: 'demo03@dichvuoi.vn',
      fullName: 'Khách Demo 03',
      phone: '0900000003',
      walletBalance: 2_000_000,
    },
    {
      email: 'demo04@dichvuoi.vn',
      fullName: 'Khách Demo 04',
      phone: '0900000004',
      walletBalance: 2_500_000,
    },
    {
      email: 'lan@dichvuoi.vn',
      fullName: 'Nguyễn Thị Lan',
      phone: '0901234567',
      walletBalance: 4_000_000,
    },
    {
      email: 'minh@dichvuoi.vn',
      fullName: 'Trần Văn Minh',
      phone: '0907654321',
      walletBalance: 4_000_000,
    },
  ];

  for (const customer of demoCustomers) {
    await prisma.user.upsert({
      where: { email: customer.email },
      update: {
        passwordHash,
        fullName: customer.fullName,
        phone: customer.phone,
        walletBalance: customer.walletBalance,
        role: Role.CUSTOMER,
        termsAcceptedAt: new Date(),
      },
      create: {
        email: customer.email,
        passwordHash,
        fullName: customer.fullName,
        phone: customer.phone,
        role: Role.CUSTOMER,
        walletBalance: customer.walletBalance,
        termsAcceptedAt: new Date(),
      },
    });
  }

  await prisma.user.upsert({
    where: { email: 'admin@dichvuoi.vn' },
    update: {
      passwordHash,
      fullName: 'Admin DichVuOi',
      role: Role.ADMIN,
      termsAcceptedAt: new Date(),
    },
    create: {
      email: 'admin@dichvuoi.vn',
      passwordHash,
      fullName: 'Admin DichVuOi',
      phone: '0900999999',
      role: Role.ADMIN,
      termsAcceptedAt: new Date(),
    },
  });

  // Admin production / Google: zonbita96@gmail.com
  await prisma.user.upsert({
    where: { email: 'zonbita96@gmail.com' },
    update: { role: Role.ADMIN, termsAcceptedAt: new Date() },
    create: {
      email: 'zonbita96@gmail.com',
      fullName: 'Admin Zonbita',
      role: Role.ADMIN,
      emailVerified: true,
      termsAcceptedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: 'moderator@dichvuoi.vn' },
    update: {
      passwordHash,
      fullName: 'Moderator DichVuOi',
      role: Role.MODERATOR,
      termsAcceptedAt: new Date(),
    },
    create: {
      email: 'moderator@dichvuoi.vn',
      passwordHash,
      fullName: 'Moderator DichVuOi',
      phone: '0900888888',
      role: Role.MODERATOR,
      termsAcceptedAt: new Date(),
    },
  });

  const seedPartners = buildSeedPartners();
  const partnerProfiles: {
    id: string;
    priceFactor: number;
    headline: string;
    experienceYears: number;
    specialtyGroupSlug: string;
  }[] = [];

  for (const p of seedPartners) {
    const startingWallet = p.email === 'partner@dichvuoi.vn' ? 1_000_000 : 0;
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        passwordHash,
        fullName: p.fullName,
        phone: p.phone,
        role: Role.PARTNER,
        termsAcceptedAt: new Date(),
        ...(p.email === 'partner@dichvuoi.vn'
          ? { walletBalance: startingWallet }
          : {}),
      },
      create: {
        email: p.email,
        passwordHash,
        fullName: p.fullName,
        phone: p.phone,
        role: Role.PARTNER,
        walletBalance: startingWallet,
        termsAcceptedAt: new Date(),
      },
    });

    const profile = await prisma.partnerProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: p.headline,
        bio: p.bio,
        city: p.city,
        districts: p.districts,
        skillsJson: JSON.stringify(p.skills),
        workModes: p.workModes,
        acceptingJobs: p.acceptingJobs,
        responseMinutes: p.responseMinutes,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        isVerified: p.isVerified,
        phoneVerified: p.phoneVerified,
        bankVerified: p.bankVerified,
        level: p.level,
        avatarUrl: p.avatarUrl,
      },
      create: {
        userId: user.id,
        headline: p.headline,
        bio: p.bio,
        city: p.city,
        districts: p.districts,
        skillsJson: JSON.stringify(p.skills),
        workModes: p.workModes,
        acceptingJobs: p.acceptingJobs,
        responseMinutes: p.responseMinutes,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        isVerified: p.isVerified,
        phoneVerified: p.phoneVerified,
        bankVerified: p.bankVerified,
        level: p.level,
        avatarUrl: p.avatarUrl,
      },
    });

    partnerProfiles.push({
      id: profile.id,
      priceFactor: p.priceFactor,
      headline: p.headline,
      experienceYears: p.experienceYears,
      specialtyGroupSlug: p.specialtyGroupSlug,
    });
  }

  const groups = catalogGroups;

  for (const group of groups) {
    const { categories, ...groupData } = group;
    const supportsOnline = categories.some((category) =>
      category.services.some((service) => service.supportsOnline),
    );
    const createdGroup = await prisma.serviceGroup.upsert({
      where: { slug: group.slug },
      update: {
        name: groupData.name,
        description: groupData.description,
        icon: groupData.icon,
        sortOrder: groupData.sortOrder,
        isFeatured: groupData.isFeatured,
        supportsOnline,
      },
      create: { ...groupData, supportsOnline },
    });

    for (const category of categories) {
      const { services, ...categoryData } = category;
      const createdCategory = await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: categoryData.name,
          groupId: createdGroup.id,
        },
        create: {
          ...categoryData,
          groupId: createdGroup.id,
        },
      });

      for (const service of services) {
        await prisma.service.upsert({
          where: { slug: service.slug },
          update: {
            name: service.name,
            description: service.description,
            basePrice: service.basePrice,
            priceMin: service.priceMin,
            priceMax: service.priceMax,
            unit: service.unit,
            durationMin: service.durationMin,
            supportsOnline: service.supportsOnline,
            categoryId: createdCategory.id,
          },
          create: {
            ...service,
            categoryId: createdCategory.id,
          },
        });
      }
    }
  }

  // Dọn category cũ / gộp (service đã chuyển sang category mới qua upsert).
  await prisma.category.deleteMany({
    where: {
      slug: { in: obsoleteCategorySlugs },
      services: { none: {} },
    },
  });

  // Gộp coaching theo game → chỉ giữ «Coaching game».
  const mergedCoachingSlugs = [
    'coaching-lien-quan',
    'coaching-lmht',
    'coaching-valorant',
    'coaching-pubg',
    'coaching-fc-online',
  ];
  await prisma.service.updateMany({
    where: { slug: { in: mergedCoachingSlugs } },
    data: { isActive: false, supportsOnline: false },
  });

  const allServices = await prisma.service.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      basePrice: true,
      category: { select: { group: { select: { slug: true } } } },
    },
    orderBy: { slug: 'asc' },
  });

  const bySpecialty = new Map<string, typeof partnerProfiles>();
  for (const profile of partnerProfiles) {
    const list = bySpecialty.get(profile.specialtyGroupSlug) ?? [];
    list.push(profile);
    bySpecialty.set(profile.specialtyGroupSlug, list);
  }

  // Xóa offering cũ — chỉ gắn partner đúng nhóm ngành của dịch vụ.
  await prisma.partnerService.deleteMany();

  let offeringCount = 0;
  for (let i = 0; i < allServices.length; i += 1) {
    const service = allServices[i];
    const groupSlug = service.category.group.slug;
    const pool = bySpecialty.get(groupSlug) ?? [];
    if (pool.length === 0) {
      console.warn(`Không có partner cho nhóm ${groupSlug} (service ${service.name})`);
      continue;
    }

    const pickCount = Math.min(PROVIDERS_PER_SERVICE, pool.length);
    for (let offset = 0; offset < pickCount; offset += 1) {
      const provider = pool[(i + offset) % pool.length];
      const price =
        Math.round((service.basePrice * provider.priceFactor) / 1000) * 1000;
      const offeringHeadline = `${service.name} · ${provider.headline}`;
      await prisma.partnerService.upsert({
        where: {
          partnerProfileId_serviceId: {
            partnerProfileId: provider.id,
            serviceId: service.id,
          },
        },
        update: {
          price,
          headline: offeringHeadline,
          experienceYears: provider.experienceYears,
          includes: 'Đúng giờ · báo giá trước · mang dụng cụ cơ bản',
          excludes: 'Không bao gồm vật tư / linh kiện (trừ khi thỏa thuận)',
          coverageNote: 'Theo khu vực hồ sơ · liên hệ sau khi đặt',
          isActive: true,
        },
        create: {
          partnerProfileId: provider.id,
          serviceId: service.id,
          price,
          headline: offeringHeadline,
          experienceYears: provider.experienceYears,
          includes: 'Đúng giờ · báo giá trước · mang dụng cụ cơ bản',
          excludes: 'Không bao gồm vật tư / linh kiện (trừ khi thỏa thuận)',
          coverageNote: 'Theo khu vực hồ sơ · liên hệ sau khi đặt',
          isActive: true,
        },
      });
      offeringCount += 1;
    }
  }

  console.log(
    `Seeded ${partnerProfiles.length} partners · ${offeringCount} offerings · tối đa ${PROVIDERS_PER_SERVICE} người / dịch vụ (${allServices.length} services)`,
  );

  // --- Không seed đơn COMPLETED gán sẵn cho partner (làm bẩn «Việc của tôi»).
  // Chỉ dọn dữ liệu seed cũ nếu còn sót.
  const demoCustomer = await prisma.user.findUnique({
    where: { email: 'demo@dichvuoi.vn' },
  });
  if (!demoCustomer) {
    console.warn('Bỏ qua seed booking: không tìm thấy demo@dichvuoi.vn');
    return;
  }

  const removedCompleted = await prisma.booking.deleteMany({
    where: {
      note: { startsWith: '[seed-completed]' },
    },
  });
  if (removedCompleted.count > 0) {
    console.log(
      `Removed ${removedCompleted.count} legacy [seed-completed] bookings`,
    );
  }

  const addresses = [
    'Online · Google Meet',
    'Online · Zoom',
    'Online · Discord',
    'Online · Zalo Video',
    'Online · Microsoft Teams',
  ];

  // --- Demo: đơn PENDING mở (HELD, chưa có partner) cho bảng tin trang chủ ---
  await prisma.booking.deleteMany({
    where: {
      userId: demoCustomer.id,
      note: { startsWith: '[seed-open]' },
    },
  });

  const openServices = await prisma.service.findMany({
    where: { isActive: true, supportsOnline: true },
    select: {
      id: true,
      name: true,
      unit: true,
      durationMin: true,
      basePrice: true,
    },
    orderBy: { slug: 'asc' },
    take: 40,
  });
  openServices.sort(
    (a, b) =>
      a.id.charCodeAt(0) +
      a.name.length -
      (b.id.charCodeAt(0) + b.name.length),
  );
  const openPicks = openServices.slice(0, 8);
  const matchingMs = 7 * 24 * 60 * 60 * 1000;

  let openSeed = 0;
  for (let i = 0; i < openPicks.length; i += 1) {
    const service = openPicks[i];
    const price = service.basePrice;
    const commissionBps = 1500;
    const commissionAmount = Math.round((price * commissionBps) / 10000);
    const partnerPayout = price - commissionAmount;
    const hoursAhead = 12 + i * 6;
    const scheduledAt = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    const paidAt = new Date(Date.now() - (i + 1) * 45 * 60 * 1000);
    const matchingDeadlineAt = new Date(paidAt.getTime() + matchingMs);

    await prisma.booking.create({
      data: {
        userId: demoCustomer.id,
        partnerId: null,
        serviceId: service.id,
        address: addresses[i % addresses.length],
        scheduledAt,
        note: `[seed-open] Demo đơn mở · ${service.name}`,
        status: 'PENDING',
        totalPrice: price,
        customerName: demoCustomer.fullName,
        customerPhone: demoCustomer.phone ?? '0900000000',
        paymentStatus: 'HELD',
        commissionBps,
        commissionAmount,
        partnerPayout,
        paidAt,
        matchingDeadlineAt,
        budgetMin: Math.round(price * 0.9),
        budgetMax: Math.round(price * 1.15),
      },
    });
    openSeed += 1;
  }

  console.log(
    `Seeded ${openSeed} OPEN PENDING bookings for homepage board (demo@dichvuoi.vn)`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
