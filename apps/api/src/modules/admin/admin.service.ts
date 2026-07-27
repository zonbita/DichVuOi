import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, ComplaintStatus, PaymentStatus, Prisma } from '@prisma/client';
import {
  computeEscrowSplit,
  DEFAULT_COMMISSION_BPS,
} from '../../common/escrow';
import { defaultMarketRangeFromBase } from '../../common/market-price';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { slugify } from '../../common/slug';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import {
  AdminBookingQueryDto,
  AdminCreateServiceDto,
  AdminPageQueryDto,
  AdminPartnerQueryDto,
  AdminServiceQueryDto,
  AdminUpdateBookingDto,
  AdminUpdateGroupDto,
  AdminUpdatePartnerDto,
  AdminUpdateServiceDto,
  AdminUpdateUserDto,
  AdminUserQueryDto,
} from './dto/admin.dto';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type Page = { skip: number; take: number; page: number; pageSize: number };

function resolvePage(query: AdminPageQueryDto): Page {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

function paginated<T>(items: T[], total: number, page: Page) {
  return {
    items,
    total,
    page: page.page,
    pageSize: page.pageSize,
    pageCount: Math.max(1, Math.ceil(total / page.pageSize)),
  };
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly finance: FinanceService,
  ) {}

  async stats() {
    const [
      users,
      partners,
      partnersPendingVerify,
      bookings,
      held,
      released,
      completed,
      cancelled,
      reviews,
      redactedMessages,
      openJobs,
      complaintsPending,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.partnerProfile.count(),
      this.prisma.partnerProfile.count({ where: { isVerified: false } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: { paymentStatus: PaymentStatus.HELD },
      }),
      this.prisma.booking.count({
        where: { paymentStatus: PaymentStatus.RELEASED },
      }),
      this.prisma.booking.count({
        where: { status: BookingStatus.COMPLETED },
      }),
      this.prisma.booking.count({
        where: { status: BookingStatus.CANCELLED },
      }),
      this.prisma.review.count(),
      this.prisma.bookingMessage.count({ where: { redacted: true } }),
      this.prisma.booking.count({
        where: { status: BookingStatus.PENDING, partnerId: null },
      }),
      this.prisma.complaint.count({
        where: {
          status: { in: [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW] },
        },
      }),
    ]);

    const escrowAgg = await this.prisma.booking.aggregate({
      where: { paymentStatus: PaymentStatus.HELD },
      _sum: { totalPrice: true },
    });
    const commissionAgg = await this.prisma.booking.aggregate({
      where: { paymentStatus: PaymentStatus.RELEASED },
      _sum: { commissionAmount: true },
    });
    const gmvAgg = await this.prisma.booking.aggregate({
      where: { status: BookingStatus.COMPLETED },
      _sum: { totalPrice: true },
    });

    return {
      users,
      partners,
      partnersPendingVerify,
      bookings,
      openJobs,
      completed,
      cancelled,
      escrowHeldCount: held,
      escrowHeldAmount: escrowAgg._sum.totalPrice ?? 0,
      escrowReleasedCount: released,
      commissionEarned: commissionAgg._sum.commissionAmount ?? 0,
      gmvCompleted: gmvAgg._sum.totalPrice ?? 0,
      reviews,
      redactedMessages,
      complaintsPending,
    };
  }

  async listUsers(query: AdminUserQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
          partnerProfile: {
            select: {
              id: true,
              isVerified: true,
              ratingAvg: true,
              ratingCount: true,
              acceptingJobs: true,
              level: true,
            },
          },
          _count: {
            select: {
              customerBookings: true,
              partnerBookings: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy user');
    if (!dto.role) throw new BadRequestException('Thiếu role');

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async listPartners(query: AdminPartnerQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const where: Prisma.PartnerProfileWhereInput = {
      ...(query.verified !== undefined ? { isVerified: query.verified } : {}),
      ...(query.acceptingJobs !== undefined
        ? { acceptingJobs: query.acceptingJobs }
        : {}),
      ...(query.city ? { city: query.city } : {}),
      ...(q
        ? {
            OR: [
              { headline: { contains: q } },
              { city: { contains: q } },
              { user: { fullName: { contains: q } } },
              { user: { email: { contains: q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.partnerProfile.findMany({
        where,
        skip: page.skip,
        take: page.take,
        // Hồ sơ chờ duyệt lên đầu để admin xử lý hàng đợi verify.
        orderBy: [{ isVerified: 'asc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              role: true,
            },
          },
          _count: { select: { offerings: true } },
        },
      }),
      this.prisma.partnerProfile.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  async updatePartner(userId: string, dto: AdminUpdatePartnerDto) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ partner');

    const updated = await this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        ...(dto.isVerified !== undefined
          ? { isVerified: dto.isVerified }
          : {}),
        ...(dto.acceptingJobs !== undefined
          ? { acceptingJobs: dto.acceptingJobs }
          : {}),
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, role: true },
        },
        _count: { select: { offerings: true } },
      },
    });

    if (dto.isVerified !== undefined) {
      await recalculatePartnerLevel(this.prisma, userId);
      const refreshed = await this.prisma.partnerProfile.findUnique({
        where: { userId },
        select: { level: true },
      });
      return { ...updated, level: refreshed?.level ?? updated.level };
    }

    return updated;
  }

  async listBookings(query: AdminBookingQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = new Date(query.from);
    if (query.to) createdAt.lte = new Date(query.to);

    const where: Prisma.BookingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      ...(query.from || query.to ? { createdAt } : {}),
      ...(q
        ? {
            OR: [
              { customerName: { contains: q } },
              { service: { name: { contains: q } } },
              { user: { fullName: { contains: q } } },
              { user: { email: { contains: q } } },
              { partner: { fullName: { contains: q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, fullName: true, email: true } },
          partner: { select: { id: true, fullName: true, email: true } },
          _count: { select: { messages: true, reviews: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  /** Chi tiết một đơn cho trang điều tra / xử lý tranh chấp. */
  async getBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            unit: true,
          },
        },
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        partner: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, fullName: true, email: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromUser: { select: { id: true, fullName: true } },
            toUser: { select: { id: true, fullName: true } },
          },
        },
        requirements: {
          orderBy: { sortOrder: 'asc' },
        },
        complaints: {
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: { select: { id: true, fullName: true } },
            against: { select: { id: true, fullName: true } },
            resolvedBy: { select: { id: true, fullName: true } },
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    return booking;
  }

  async updateBooking(id: string, dto: AdminUpdateBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');

    const data: Prisma.BookingUpdateInput = {};
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.status) data.status = dto.status;

    if (dto.paymentStatus) {
      data.paymentStatus = dto.paymentStatus;
      if (dto.paymentStatus === PaymentStatus.HELD && !booking.paidAt) {
        data.paidAt = new Date();
      }
      if (dto.paymentStatus === PaymentStatus.RELEASED) {
        const split = computeEscrowSplit(
          booking.totalPrice,
          booking.commissionBps || DEFAULT_COMMISSION_BPS,
        );
        data.commissionAmount = split.commissionAmount;
        data.partnerPayout = split.partnerPayout;
        data.releasedAt = new Date();
      }
      if (dto.paymentStatus === PaymentStatus.REFUNDED) {
        data.refundedAt = new Date();
      }
    }

    // Admin force COMPLETED + auto-release if HELD
    if (
      dto.status === BookingStatus.COMPLETED &&
      (dto.paymentStatus === PaymentStatus.RELEASED ||
        booking.paymentStatus === PaymentStatus.HELD)
    ) {
      if (
        !dto.paymentStatus &&
        booking.paymentStatus === PaymentStatus.HELD
      ) {
        const split = computeEscrowSplit(
          booking.totalPrice,
          booking.commissionBps || DEFAULT_COMMISSION_BPS,
        );
        data.paymentStatus = PaymentStatus.RELEASED;
        data.commissionAmount = split.commissionAmount;
        data.partnerPayout = split.partnerPayout;
        data.releasedAt = new Date();
      }
    }

    if (
      dto.status === BookingStatus.CANCELLED &&
      booking.paymentStatus === PaymentStatus.HELD &&
      !dto.paymentStatus
    ) {
      data.paymentStatus = PaymentStatus.REFUNDED;
      data.refundedAt = new Date();
    }

    return this.prisma.booking.update({
      where: { id },
      data,
      include: {
        service: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, fullName: true, email: true } },
        partner: { select: { id: true, fullName: true, email: true } },
        _count: { select: { messages: true, reviews: true } },
      },
    });
  }

  async listReviews(query: AdminPageQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const where: Prisma.ReviewWhereInput = q
      ? {
          OR: [
            { comment: { contains: q } },
            { fromUser: { fullName: { contains: q } } },
            { toUser: { fullName: { contains: q } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: { select: { id: true, fullName: true, email: true } },
          toUser: { select: { id: true, fullName: true, email: true } },
          booking: {
            select: {
              id: true,
              status: true,
              service: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  async listFlaggedMessages(query: AdminPageQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const where: Prisma.BookingMessageWhereInput = {
      redacted: true,
      ...(q
        ? {
            OR: [
              { body: { contains: q } },
              { sender: { fullName: { contains: q } } },
              { sender: { email: { contains: q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.bookingMessage.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, fullName: true, email: true } },
          booking: {
            select: {
              id: true,
              status: true,
              service: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.bookingMessage.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  listCatalogSummary() {
    return this.prisma.serviceGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        isFeatured: true,
        _count: { select: { categories: true } },
        categories: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            _count: { select: { services: true } },
          },
        },
      },
    });
  }

  /** Danh mục phẳng (kèm tên nhóm) — đổ vào select khi tạo / sửa dịch vụ. */
  async listCategoryOptions() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ group: { sortOrder: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        group: { select: { id: true, name: true, slug: true } },
      },
    });
    return categories;
  }

  async listServices(query: AdminServiceQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const where: Prisma.ServiceWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.groupId ? { category: { groupId: query.groupId } } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { slug: { contains: q } },
              { category: { name: { contains: q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              group: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: { select: { bookings: true, partners: true } },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  async createService(dto: AdminCreateServiceDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');

    const slug = slugify(dto.slug?.trim() || dto.name);
    if (!slug) throw new BadRequestException('Slug không hợp lệ');

    const existing = await this.prisma.service.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Slug «${slug}» đã tồn tại`);

    const defaults = defaultMarketRangeFromBase(dto.basePrice);
    let priceMin = dto.priceMin ?? defaults.priceMin;
    let priceMax = dto.priceMax ?? defaults.priceMax;
    if (priceMin > priceMax) {
      const t = priceMin;
      priceMin = priceMax;
      priceMax = t;
    }

    return this.prisma.service.create({
      data: {
        slug,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        basePrice: dto.basePrice,
        priceMin,
        priceMax,
        unit: dto.unit?.trim() || 'giờ',
        supportsOnline: dto.supportsOnline ?? false,
        durationMin: dto.durationMin ?? 60,
        isActive: dto.isActive ?? true,
        categoryId: dto.categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            group: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: { select: { bookings: true, partners: true } },
      },
    });
  }

  async updateService(id: string, dto: AdminUpdateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Không tìm thấy dịch vụ');

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    }

    let slug: string | undefined;
    if (dto.slug !== undefined) {
      slug = slugify(dto.slug);
      if (!slug) throw new BadRequestException('Slug không hợp lệ');
      const clash = await this.prisma.service.findUnique({ where: { slug } });
      if (clash && clash.id !== id) {
        throw new ConflictException(`Slug «${slug}» đã tồn tại`);
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.basePrice !== undefined ? { basePrice: dto.basePrice } : {}),
        ...(dto.priceMin !== undefined ? { priceMin: dto.priceMin } : {}),
        ...(dto.priceMax !== undefined ? { priceMax: dto.priceMax } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit.trim() || 'giờ' } : {}),
        ...(dto.supportsOnline !== undefined
          ? { supportsOnline: dto.supportsOnline }
          : {}),
        ...(dto.durationMin !== undefined
          ? { durationMin: dto.durationMin }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.categoryId !== undefined
          ? { categoryId: dto.categoryId }
          : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            group: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: { select: { bookings: true, partners: true } },
      },
    });
  }

  async updateGroup(id: string, dto: AdminUpdateGroupDto) {
    const group = await this.prisma.serviceGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');

    return this.prisma.serviceGroup.update({
      where: { id },
      data: {
        ...(dto.isFeatured !== undefined
          ? { isFeatured: dto.isFeatured }
          : {}),
      },
      select: { id: true, slug: true, name: true, isFeatured: true },
    });
  }
}
