import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { PartnerFavoritesService } from './partner-favorites.service';
import { PartnerProfileService } from './partner-profile.service';
import { PartnerPublicService } from './partner-public.service';
import { PartnerRankingService } from './partner-ranking.service';
import { PartnerServicePostsService } from './partner-service-posts.service';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

@Module({
  imports: [AuthModule, ComplaintsModule],
  controllers: [PartnersController],
  providers: [
    PartnersService,
    PartnerRankingService,
    PartnerPublicService,
    PartnerServicePostsService,
    PartnerProfileService,
    PartnerFavoritesService,
  ],
})
export class PartnersModule {}
