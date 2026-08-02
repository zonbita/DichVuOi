import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
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

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google Identity Services ID token (credential JWT)',
  })
  @IsString()
  @MinLength(20)
  idToken!: string;
}

export class RequestPhoneOtpDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  @MinLength(9)
  @MaxLength(15)
  @Matches(/^[0-9+\s-]+$/, { message: 'Số điện thoại không hợp lệ' })
  phone!: string;
}

export class ConfirmPhoneOtpDto {
  @ApiProperty({
    example: 'NguyenVanA-482910',
    description: 'Key một lần: TenUser-XXXXXX (hoặc chỉ mã 6 số)',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  key!: string;
}
