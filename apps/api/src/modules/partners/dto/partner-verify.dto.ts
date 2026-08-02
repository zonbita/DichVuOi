import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

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
    description: 'Key một lần TenUser-XXXXXX (alias: code — tương thích cũ)',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  code!: string;
}

export class LinkBankAccountDto {
  @ApiProperty({ example: 'Vietcombank' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  bankName!: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  @Matches(/^[0-9]+$/, { message: 'Số tài khoản chỉ gồm chữ số' })
  accountNo!: string;

  @ApiProperty({ example: 'NGUYEN VAN A' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  accountName!: string;

  @ApiPropertyOptional({ description: 'Mã ngân hàng img.vietqr.io (VD: 970436)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bankBin?: string;
}

export class ConfirmBankVerifyDto {
  @ApiProperty({ example: 'bv_...' })
  @IsString()
  @MinLength(8)
  @MaxLength(80)
  intentId!: string;
}
