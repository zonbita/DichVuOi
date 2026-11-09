import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AdminPageQueryDto, toOptionalBoolean } from './common.dto';

export class AdminFinanceTxQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ description: 'Lọc WalletTransactionType' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Lọc theo userId' })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class AdminFinanceWalletQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ description: 'Chỉ user có số dư > 0' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  positiveOnly?: boolean;
}

export class AdminAdjustWalletDto {
  @Type(() => Number)
  @IsInt()
  @Min(-100_000_000)
  @Max(100_000_000)
  amount!: number;

  @IsString()
  reason!: string;
}
