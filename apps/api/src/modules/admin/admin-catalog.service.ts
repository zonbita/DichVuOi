import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { defaultMarketRangeFromBase } from '../../common/market-price';
import { slugify } from '../../common/slug';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import {
  AdminCreateServiceDto,
  AdminServiceQueryDto,
  AdminUpdateGroupDto,
  AdminUpdateServiceDto,
} from './dto';
import { paginated, resolvePage } from './admin-pagination';

/** Catalog management (groups, categories, services). */
@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

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

    const created = await this.prisma.service.create({
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
    this.catalog.invalidateCache();
    return created;
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

    const updated = await this.prisma.service.update({
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
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
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
    this.catalog.invalidateCache();
    return updated;
  }

  async updateGroup(id: string, dto: AdminUpdateGroupDto) {
    const group = await this.prisma.serviceGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');

    const updated = await this.prisma.serviceGroup.update({
      where: { id },
      data: {
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      },
      select: { id: true, slug: true, name: true, isFeatured: true },
    });
    this.catalog.invalidateCache();
    return updated;
  }
}
