import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PartnerServicePostStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CreatePartnerServicePostDto,
  UpdatePartnerServicePostDto,
} from './dto/partner-service-post.dto';
import {
  servicePostServiceSelect,
  serializePostImages,
  normalizePostBody,
  offeringPriceRange,
  assertPriceRange,
  shapeServicePost,
} from './partners.shared';

@Injectable()
export class PartnerServicePostsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyServicePosts(userId: string, serviceId?: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Chưa có hồ sơ đối tác');

    const posts = await this.prisma.partnerServicePost.findMany({
      where: {
        partnerProfileId: profile.id,
        ...(serviceId ? { serviceId } : {}),
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      include: { service: { select: servicePostServiceSelect } },
    });

    const offerings = await this.prisma.partnerService.findMany({
      where: {
        partnerProfileId: profile.id,
        serviceId: { in: posts.map((p) => p.serviceId) },
      },
      select: { serviceId: true, price: true, priceMin: true, priceMax: true },
    });
    const priceByService = new Map(
      offerings.map((o) => [o.serviceId, offeringPriceRange(o)] as const),
    );

    return posts.map((p) =>
      shapeServicePost(p, priceByService.get(p.serviceId) ?? null),
    );
  }

  async createServicePost(userId: string, dto: CreatePartnerServicePostDto) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Chưa có hồ sơ đối tác');

    const offering = await this.prisma.partnerService.findFirst({
      where: {
        partnerProfileId: profile.id,
        serviceId: dto.serviceId,
        isActive: true,
      },
    });
    if (!offering) {
      throw new BadRequestException(
        'Chỉ đăng bài cho nghề đang gắn trên hồ sơ. Cập nhật nghề ở Hồ sơ trước.',
      );
    }

    const existingForService = await this.prisma.partnerServicePost.findFirst({
      where: {
        partnerProfileId: profile.id,
        serviceId: dto.serviceId,
      },
      select: { id: true },
    });
    if (existingForService) {
      throw new ConflictException(
        'Nghề này đã có bài đăng. Chỉ được sửa bài hiện có, không tạo mới.',
      );
    }

    const { imagesJson, coverUrl } = serializePostImages(dto.images);
    const body = normalizePostBody(dto.body);
    const priceMin = Math.round(dto.priceMin);
    const priceMax = Math.round(dto.priceMax);
    assertPriceRange(priceMin, priceMax);

    const post = await this.prisma.$transaction(async (tx) => {
      await tx.partnerService.update({
        where: { id: offering.id },
        data: { price: priceMin, priceMin, priceMax },
      });
      return tx.partnerServicePost.create({
        data: {
          partnerProfileId: profile.id,
          serviceId: dto.serviceId,
          title: dto.title.trim(),
          body,
          coverUrl,
          imagesJson,
          status: PartnerServicePostStatus.PENDING,
          rejectReason: null,
          reviewedAt: null,
          reviewedById: null,
        },
        include: { service: { select: servicePostServiceSelect } },
      });
    });
    return shapeServicePost(post, { price: priceMin, priceMin, priceMax });
  }

  async updateServicePost(
    userId: string,
    postId: string,
    dto: UpdatePartnerServicePostDto,
  ) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Chưa có hồ sơ đối tác');

    const existing = await this.prisma.partnerServicePost.findFirst({
      where: { id: postId, partnerProfileId: profile.id },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy bài đăng');

    // Nghề gắn cố định với bài — không đổi serviceId khi sửa.
    const imageFields =
      dto.images !== undefined ? serializePostImages(dto.images) : null;

    const hasPriceUpdate =
      dto.priceMin !== undefined || dto.priceMax !== undefined;
    let nextRange:
      { price: number; priceMin: number; priceMax: number } | undefined;

    if (hasPriceUpdate) {
      const current = await this.prisma.partnerService.findFirst({
        where: {
          partnerProfileId: profile.id,
          serviceId: existing.serviceId,
        },
        select: { price: true, priceMin: true, priceMax: true },
      });
      const fallback = offeringPriceRange(current);
      const priceMin = Math.round(
        dto.priceMin ?? fallback.priceMin ?? fallback.price ?? 0,
      );
      const priceMax = Math.round(
        dto.priceMax ?? fallback.priceMax ?? priceMin,
      );
      if (priceMin < 1000) {
        throw new BadRequestException('Giá min tối thiểu 1.000 VNĐ');
      }
      assertPriceRange(priceMin, priceMax);
      nextRange = { price: priceMin, priceMin, priceMax };
    }

    const post = await this.prisma.$transaction(async (tx) => {
      if (nextRange) {
        await tx.partnerService.updateMany({
          where: {
            partnerProfileId: profile.id,
            serviceId: existing.serviceId,
          },
          data: {
            price: nextRange.price,
            priceMin: nextRange.priceMin,
            priceMax: nextRange.priceMax,
          },
        });
      }
      return tx.partnerServicePost.update({
        where: { id: postId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.body !== undefined
            ? { body: normalizePostBody(dto.body) }
            : {}),
          ...(imageFields
            ? {
                coverUrl: imageFields.coverUrl,
                imagesJson: imageFields.imagesJson,
              }
            : {}),
          status: PartnerServicePostStatus.PENDING,
          rejectReason: null,
          reviewedAt: null,
          reviewedById: null,
        },
        include: { service: { select: servicePostServiceSelect } },
      });
    });

    const offering = await this.prisma.partnerService.findFirst({
      where: {
        partnerProfileId: profile.id,
        serviceId: existing.serviceId,
      },
      select: { price: true, priceMin: true, priceMax: true },
    });
    return shapeServicePost(post, nextRange ?? offeringPriceRange(offering));
  }

  async deleteServicePost(userId: string, postId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Chưa có hồ sơ đối tác');

    const existing = await this.prisma.partnerServicePost.findFirst({
      where: { id: postId, partnerProfileId: profile.id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy bài đăng');

    await this.prisma.partnerServicePost.delete({ where: { id: postId } });
    return { ok: true };
  }
}
