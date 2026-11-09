import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { AdminPageQueryDto } from './common.dto';

export class AdminBookingQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Tạo từ ngày (ISO)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Tạo đến ngày (ISO)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class AdminUpdateBookingDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
