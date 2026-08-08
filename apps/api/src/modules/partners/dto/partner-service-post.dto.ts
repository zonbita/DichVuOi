import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePartnerServicePostDto {
  @ApiProperty({ example: 'cuid_service_1' })
  @IsString()
  serviceId!: string;

  @ApiProperty({ example: 'Sửa điều hòa nhanh tại Q1' })
  @IsString()
  @MinLength(4, { message: 'Tiêu đề cần ít nhất 4 ký tự' })
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'Mô tả chi tiết dịch vụ, phạm vi và cam kết…' })
  @IsString()
  @MinLength(1, { message: 'Nội dung không được để trống' })
  @MaxLength(8000)
  body!: string;

  @ApiProperty({
    example: 200000,
    description: 'Giá chào min (VNĐ)',
  })
  @IsInt({ message: 'Giá min phải là số nguyên' })
  @Min(1000, { message: 'Giá min tối thiểu 1.000 VNĐ' })
  @Max(500_000_000, { message: 'Giá min quá lớn' })
  priceMin!: number;

  @ApiProperty({
    example: 500000,
    description: 'Giá chào max (VNĐ)',
  })
  @IsInt({ message: 'Giá max phải là số nguyên' })
  @Min(1000, { message: 'Giá max tối thiểu 1.000 VNĐ' })
  @Max(500_000_000, { message: 'Giá max quá lớn' })
  priceMax!: number;

  @ApiProperty({
    type: [String],
    example: ['/uploads/service-posts/a.jpg'],
    description: 'Ít nhất 1 ảnh',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất một ảnh' })
  @ArrayMaxSize(8, { message: 'Tối đa 8 ảnh' })
  @IsString({ each: true })
  images!: string[];
}

export class UpdatePartnerServicePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'Tiêu đề cần ít nhất 4 ký tự' })
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Nội dung không được để trống' })
  @MaxLength(8000)
  body?: string;

  @ApiPropertyOptional({
    example: 200000,
    description: 'Giá chào min (VNĐ)',
  })
  @IsOptional()
  @IsInt({ message: 'Giá min phải là số nguyên' })
  @Min(1000, { message: 'Giá min tối thiểu 1.000 VNĐ' })
  @Max(500_000_000, { message: 'Giá min quá lớn' })
  priceMin?: number;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Giá chào max (VNĐ)',
  })
  @IsOptional()
  @IsInt({ message: 'Giá max phải là số nguyên' })
  @Min(1000, { message: 'Giá max tối thiểu 1.000 VNĐ' })
  @Max(500_000_000, { message: 'Giá max quá lớn' })
  priceMax?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất một ảnh' })
  @ArrayMaxSize(8, { message: 'Tối đa 8 ảnh' })
  @IsString({ each: true })
  images?: string[];
}
