import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class WithdrawDto {
  @ApiProperty({ example: 100000, description: 'Số tiền rút, VNĐ' })
  @IsInt()
  @Min(20000)
  @Max(100_000_000)
  amount!: number;

  @ApiProperty({ example: '970436', description: 'BIN VietQR' })
  @IsString()
  @MinLength(3)
  @MaxLength(12)
  bankBin!: string;

  @ApiPropertyOptional({ example: 'VCB' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  bankCode?: string;

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
}
