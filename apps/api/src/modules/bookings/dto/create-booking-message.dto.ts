import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingMessageDto {
  @ApiProperty({ example: 'Mình sẽ đến lúc 9h, bạn chuẩn bị chỗ đậu xe giúp nhé.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
