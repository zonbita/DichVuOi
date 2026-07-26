import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'a@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'demo1234' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  /** Dual-role: đăng ký xong cũng bật hồ sơ người làm ngay (tuỳ chọn). */
  @ApiPropertyOptional({
    example: false,
    description: 'Bật nhận việc ngay khi đăng ký (Facebook-style dual-role)',
  })
  @IsOptional()
  @IsBoolean()
  enableOffering?: boolean;
}

export class LoginDto {
  @ApiProperty({ example: 'demo@dichvuoi.vn' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'demo1234' })
  @IsString()
  @MinLength(6)
  password!: string;
}
