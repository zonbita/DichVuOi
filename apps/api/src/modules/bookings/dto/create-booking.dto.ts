import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'don-nha-theo-ca' })
  @IsString()
  serviceSlug!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  customerName!: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @MinLength(8)
  customerPhone!: string;

  @ApiPropertyOptional({ example: 'a@email.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ example: 'Quận 1, TP.HCM' })
  @IsString()
  @MinLength(5)
  address!: string;

  @ApiProperty({ example: '2026-08-01T10:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ description: 'userId của partner được chọn để thuê trực tiếp' })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
