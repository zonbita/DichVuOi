import { Injectable } from '@nestjs/common';
import { PartnerRankingService } from './partner-ranking.service';
import { PartnerPublicService } from './partner-public.service';
import { PartnerServicePostsService } from './partner-service-posts.service';
import { PartnerProfileService } from './partner-profile.service';
import { PartnerFavoritesService } from './partner-favorites.service';
import {
  ConfirmBankVerifyDto,
  ConfirmPhoneOtpDto,
  LinkBankAccountDto,
  RequestPhoneOtpDto,
} from './dto/partner-verify.dto';
import {
  CreatePartnerServicePostDto,
  UpdatePartnerServicePostDto,
} from './dto/partner-service-post.dto';
import {
  EnablePartnerDto,
  SyncPartnerOfferingsDto,
  UpdatePartnerProfileDto,
} from './dto/update-partner-profile.dto';

/** Facade giữ nguyên API công khai; logic nằm ở các service con. */
@Injectable()
export class PartnersService {
  constructor(
    private readonly partnerRanking: PartnerRankingService,
    private readonly partnerPublic: PartnerPublicService,
    private readonly partnerServicePosts: PartnerServicePostsService,
    private readonly partnerProfile: PartnerProfileService,
    private readonly partnerFavorites: PartnerFavoritesService,
  ) {}

  getLevelBreakdown(userId: string) {
    return this.partnerRanking.getLevelBreakdown(userId);
  }

  listFeaturedReviews(limit = 8) {
    return this.partnerRanking.listFeaturedReviews(limit);
  }

  searchPublic(q: string, limit = 24) {
    return this.partnerPublic.searchPublic(q, limit);
  }

  getPublicProfile(userId: string) {
    return this.partnerPublic.getPublicProfile(userId);
  }

  listApprovedServicePosts(page = 1, pageSize = 12) {
    return this.partnerPublic.listApprovedServicePosts(page, pageSize);
  }

  getPublicServicePost(userId: string, postId: string) {
    return this.partnerPublic.getPublicServicePost(userId, postId);
  }

  listMyServicePosts(userId: string, serviceId?: string) {
    return this.partnerServicePosts.listMyServicePosts(userId, serviceId);
  }

  createServicePost(userId: string, dto: CreatePartnerServicePostDto) {
    return this.partnerServicePosts.createServicePost(userId, dto);
  }

  updateServicePost(
    userId: string,
    postId: string,
    dto: UpdatePartnerServicePostDto,
  ) {
    return this.partnerServicePosts.updateServicePost(userId, postId, dto);
  }

  deleteServicePost(userId: string, postId: string) {
    return this.partnerServicePosts.deleteServicePost(userId, postId);
  }

  getMine(userId: string) {
    return this.partnerProfile.getMine(userId);
  }

  enableOffering(userId: string, dto: EnablePartnerDto) {
    return this.partnerProfile.enableOffering(userId, dto);
  }

  updateMine(userId: string, dto: UpdatePartnerProfileDto) {
    return this.partnerProfile.updateMine(userId, dto);
  }

  syncOfferings(userId: string, dto: SyncPartnerOfferingsDto) {
    return this.partnerProfile.syncOfferings(userId, dto);
  }

  requestPhoneOtp(userId: string, dto: RequestPhoneOtpDto) {
    return this.partnerProfile.requestPhoneOtp(userId, dto);
  }

  confirmPhoneOtp(userId: string, dto: ConfirmPhoneOtpDto) {
    return this.partnerProfile.confirmPhoneOtp(userId, dto);
  }

  linkBankAccount(userId: string, dto: LinkBankAccountDto) {
    return this.partnerProfile.linkBankAccount(userId, dto);
  }

  confirmBankVerify(userId: string, dto: ConfirmBankVerifyDto) {
    return this.partnerProfile.confirmBankVerify(userId, dto);
  }

  listFavoriteIds(userId: string) {
    return this.partnerFavorites.listFavoriteIds(userId);
  }

  listFavorites(userId: string) {
    return this.partnerFavorites.listFavorites(userId);
  }

  addFavorite(userId: string, partnerUserId: string) {
    return this.partnerFavorites.addFavorite(userId, partnerUserId);
  }

  removeFavorite(userId: string, partnerUserId: string) {
    return this.partnerFavorites.removeFavorite(userId, partnerUserId);
  }
}
