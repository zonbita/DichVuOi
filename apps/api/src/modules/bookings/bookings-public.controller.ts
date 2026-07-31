import { Controller, Get, Query } from '@nestjs/common';
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
}
