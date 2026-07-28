import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class CreateVietQrIntentDto {
  @ApiProperty({
    example: 200000,
    description: 'Số tiền cần nạp để tạo mã VietQR, đơn vị VNĐ',
  })
  @IsInt()
  @Min(20000)
  @Max(100000000)
  amount!: number;
}

