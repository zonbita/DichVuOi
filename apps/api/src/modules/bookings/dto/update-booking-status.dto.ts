import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../../../database/prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
