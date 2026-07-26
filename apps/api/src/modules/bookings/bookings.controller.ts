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
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingMessageDto } from './dto/create-booking-message.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { PartnerScheduleQueryDto } from './dto/partner-schedule-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

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
  listOpen() {
    return this.bookingsService.listOpen();
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

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.findOne(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Post(':id/accept')
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.accept(id, user.id);
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
