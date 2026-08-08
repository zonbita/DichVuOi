import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../../database/prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BookingsService } from './bookings.service';
import { ApplyBookingDto } from './dto/apply-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingMessageDto } from './dto/create-booking-message.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { PartnerScheduleQueryDto } from './dto/partner-schedule-query.dto';
import { ProposeSettlementDto } from './dto/settlement.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import {
  ConfirmBookingDto,
  CreateRequirementDto,
  UpdateRequirementDto,
} from './dto/update-requirement.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto, user.id);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.bookingsService.listMineAsCustomer(user.id);
  }

  @Get('mine/publish-schedule')
  customerPublishSchedule(
    @CurrentUser() user: AuthUser,
    @Query() query: PartnerScheduleQueryDto,
  ) {
    return this.bookingsService.listCustomerPublishSchedule(
      user.id,
      query.year,
      query.month,
    );
  }

  @Get('rebook-hints')
  rebookHints(@CurrentUser() user: AuthUser) {
    return this.bookingsService.getRebookHints(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Get('partner/mine')
  listPartnerMine(@CurrentUser() user: AuthUser) {
    return this.bookingsService.listMineAsPartner(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Get('partner/schedule')
  partnerSchedule(
    @CurrentUser() user: AuthUser,
    @Query() query: PartnerScheduleQueryDto,
  ) {
    return this.bookingsService.listPartnerSchedule(
      user.id,
      query.year,
      query.month,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Get('open')
  listOpen(@CurrentUser() user: AuthUser) {
    return this.bookingsService.listOpen(user.id);
  }

  @Get(':id/messages')
  listMessages(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.listMessages(id, user);
  }

  @Post(':id/messages')
  postMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateBookingMessageDto,
  ) {
    return this.bookingsService.postMessage(id, user, dto);
  }

  @Get(':id/reviews')
  listReviews(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.listReviews(id, user);
  }

  @Post(':id/reviews')
  createReview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.bookingsService.createReview(id, user, dto);
  }

  @Post(':id/pay')
  payEscrow(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.payEscrow(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Post(':id/apply')
  apply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApplyBookingDto,
  ) {
    return this.bookingsService.apply(id, user.id, dto);
  }

  @Get(':id/applications')
  listApplications(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.listApplications(id, user);
  }

  @Post(':id/applications/:applicationId/select')
  selectApplicant(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.bookingsService.selectApplicant(id, applicationId, user);
  }

  @Post(':id/confirm')
  confirmCompletion(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ConfirmBookingDto,
  ) {
    return this.bookingsService.confirmCompletion(id, user, dto);
  }

  @Post(':id/settlement/propose')
  proposeSettlement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ProposeSettlementDto,
  ) {
    return this.bookingsService.proposeSettlement(id, user, dto.percent);
  }

  @Post(':id/settlement/approve')
  approveSettlement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.approveSettlement(id, user);
  }

  @Post(':id/requirements')
  addRequirement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateRequirementDto,
  ) {
    return this.bookingsService.addRequirement(id, user, dto);
  }

  @Patch(':id/requirements/:requirementId')
  updateRequirement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('requirementId') requirementId: string,
    @Body() dto: UpdateRequirementDto,
  ) {
    return this.bookingsService.updateRequirement(
      id,
      requirementId,
      user,
      dto,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.findOne(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Post(':id/accept')
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    // Legacy alias → ứng tuyển (cọc 10%); chủ đơn chọn qua select.
    return this.bookingsService.apply(id, user.id, {});
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto.status, user);
  }
}
