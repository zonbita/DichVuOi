import { ApiProperty } from '@nestjs/swagger';
import { HomeShoutKind } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateHomeShoutDto {
  @ApiProperty({
    enum: HomeShoutKind,
    example: HomeShoutKind.GREETING,
  })
  @IsEnum(HomeShoutKind)
  kind!: HomeShoutKind;

  @ApiProperty({
    description: 'ID bài đăng dịch vụ đã duyệt của chính mình',
    example: 'cmsc…',
  })
  @IsString()
  @MinLength(8)
  servicePostId!: string;
}
