import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class TopUpDto {
  @ApiProperty({
    example: 1000000,
    description: 'Nạp mô phỏng vào ví, đơn vị VNĐ',
  })
  @IsInt()
  @Min(10000)
  @Max(100000000)
  amount!: number;
}
