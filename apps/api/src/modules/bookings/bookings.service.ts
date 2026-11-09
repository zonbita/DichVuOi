import { Injectable } from '@nestjs/common';
import { BookingStatus } from '../../database/prisma/client';
import { ApplyBookingDto } from './dto/apply-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingMessageDto } from './dto/create-booking-message.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ConfirmBookingDto,
  CreateRequirementDto,
  UpdateRequirementDto,
} from './dto/update-requirement.dto';
import type { Viewer } from './booking.shared';
import { BookingApplicationsService } from './booking-applications.service';
import { BookingBoardService } from './booking-board.service';
import { BookingMessagesService } from './booking-messages.service';
import { BookingQueriesService } from './booking-queries.service';
import { BookingStatusService } from './booking-status.service';

/**
 * Facade giữ nguyên API công khai của module bookings; logic nằm ở các service con.
 */
@Injectable()
export class BookingsService {
  constructor(
    private readonly queries: BookingQueriesService,
    private readonly board: BookingBoardService,
    private readonly applications: BookingApplicationsService,
    private readonly status: BookingStatusService,
    private readonly messages: BookingMessagesService,
  ) {}

  create(dto: CreateBookingDto, customerId?: string) {
    return this.applications.create(dto, customerId);
  }

  findOne(id: string, viewer?: Viewer) {
    return this.queries.findOne(id, viewer);
  }

  listMineAsCustomer(userId: string) {
    return this.queries.listMineAsCustomer(userId);
  }

  publishDueScheduledBookings() {
    return this.queries.publishDueScheduledBookings();
  }

  listCustomerPublishSchedule(userId: string, year: number, month: number) {
    return this.queries.listCustomerPublishSchedule(userId, year, month);
  }

  getRebookHints(userId: string) {
    return this.queries.getRebookHints(userId);
  }

  listMineAsPartner(partnerId: string) {
    return this.queries.listMineAsPartner(partnerId);
  }

  listPartnerSchedule(partnerId: string, year: number, month: number) {
    return this.queries.listPartnerSchedule(partnerId, year, month);
  }

  listOpen(viewerId?: string, limit?: number) {
    return this.board.listOpen(viewerId, limit);
  }

  listOpenBoard(page = 1, pageSize = 10) {
    return this.board.listOpenBoard(page, pageSize);
  }

  getPublicOpenBooking(id: string) {
    return this.board.getPublicOpenBooking(id);
  }

  listPublicActivity(limit = 12) {
    return this.board.listPublicActivity(limit);
  }

  listRecentCompletedPublic(limit = 8) {
    return this.board.listRecentCompletedPublic(limit);
  }

  accept(id: string, partnerId: string) {
    return this.applications.accept(id, partnerId);
  }

  apply(id: string, partnerId: string, dto: ApplyBookingDto = {}) {
    return this.applications.apply(id, partnerId, dto);
  }

  selectApplicant(bookingId: string, applicationId: string, viewer: Viewer) {
    return this.applications.selectApplicant(bookingId, applicationId, viewer);
  }

  listApplications(bookingId: string, viewer: Viewer) {
    return this.applications.listApplications(bookingId, viewer);
  }

  payEscrow(id: string, viewer: Viewer) {
    return this.applications.payEscrow(id, viewer);
  }

  updateStatus(
    id: string,
    status: BookingStatus,
    viewer: Viewer,
    acceptIncomplete = false,
  ) {
    return this.status.updateStatus(id, status, viewer, acceptIncomplete);
  }

  confirmCompletion(id: string, viewer: Viewer, dto: ConfirmBookingDto = {}) {
    return this.status.confirmCompletion(id, viewer, dto);
  }

  proposeSettlement(id: string, viewer: Viewer, percent: number) {
    return this.status.proposeSettlement(id, viewer, percent);
  }

  approveSettlement(id: string, viewer: Viewer) {
    return this.status.approveSettlement(id, viewer);
  }

  addRequirement(
    _bookingId: string,
    _viewer: Viewer,
    _dto: CreateRequirementDto,
  ) {
    return this.status.addRequirement(_bookingId, _viewer, _dto);
  }

  updateRequirement(
    bookingId: string,
    requirementId: string,
    viewer: Viewer,
    dto: UpdateRequirementDto,
  ) {
    return this.status.updateRequirement(bookingId, requirementId, viewer, dto);
  }

  listMessages(bookingId: string, viewer: Viewer) {
    return this.messages.listMessages(bookingId, viewer);
  }

  postMessage(bookingId: string, viewer: Viewer, dto: CreateBookingMessageDto) {
    return this.messages.postMessage(bookingId, viewer, dto);
  }

  createReview(bookingId: string, viewer: Viewer, dto: CreateReviewDto) {
    return this.messages.createReview(bookingId, viewer, dto);
  }

  listReviews(bookingId: string, viewer: Viewer) {
    return this.messages.listReviews(bookingId, viewer);
  }
}
