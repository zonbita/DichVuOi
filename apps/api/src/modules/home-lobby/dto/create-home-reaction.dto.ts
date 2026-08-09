import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateHomeReactionDto {
  @ApiProperty({ example: '❤️', description: 'Emoji trong bộ smile cho phép' })
  @IsString()
  @MinLength(1)
  emoji!: string;

  @ApiPropertyOptional({
    description: 'ID khách ẩn danh (localStorage) khi chưa login',
    example: 'guest-xxxx',
  })
  @IsOptional()
  @IsString()
  guestId?: string;
}
