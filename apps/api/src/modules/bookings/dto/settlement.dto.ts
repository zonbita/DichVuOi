import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class ProposeSettlementDto {
  @ApiProperty({
    description: 'Phần trăm nghiệm thu đề xuất (1..100)',
    minimum: 1,
    maximum: 100,
    example: 85,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  percent!: number;
}
