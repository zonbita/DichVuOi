import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AskChatbotDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;
}
