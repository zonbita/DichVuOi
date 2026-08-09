import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';

/** Endpoint công khai — không JWT (bảng tin job trên trang chủ). */
@ApiTags('bookings')
@Controller('bookings')
export class BookingsPublicController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('open/board')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 8 })
  listOpenBoard(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedSize = pageSize ? Number(pageSize) : 8;
    return this.bookingsService.listOpenBoard(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedSize) ? parsedSize : 8,
    );
  }

  /** Chi tiết 1 đơn mở công khai — che PII kiểu open_queue. */
  @Get('public/open/:id')
  getPublicOpen(@Param('id') id: string) {
    return this.bookingsService.getPublicOpenBooking(id);
  }

  /** Ticker hoạt động ẩn danh — trang chủ (không PII). */
  @Get('public/activity')
  @ApiQuery({ name: 'limit', required: false, example: 12 })
  listPublicActivity(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 12;
    return this.bookingsService.listPublicActivity(
      Number.isFinite(parsed) ? parsed : 12,
    );
  }

  /** Đơn vừa hoàn thành — chỉ tên dịch vụ + thời điểm (không PII). */
  @Get('public/recent-completed')
  @ApiQuery({ name: 'limit', required: false, example: 8 })
  listRecentCompleted(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 8;
    return this.bookingsService.listRecentCompletedPublic(
      Number.isFinite(parsed) ? parsed : 8,
    );
  }
}
