import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, SupportThreadStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateSupportMessageDto,
  UpdateSupportThreadDto,
} from './dto/support.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /** Khách: lấy thread + messages của mình. */
  @Get('my')
  listMine(@CurrentUser() user: AuthUser) {
    return this.supportService.listMyMessages(user);
  }

  @Post('my/messages')
  postMine(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSupportMessageDto,
  ) {
    return this.supportService.postMyMessage(user, dto);
  }

  /** Admin / Moderator inbox. */
  @Get('threads')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  listThreads(@Query('status') status?: SupportThreadStatus) {
    return this.supportService.listThreads(status);
  }

  @Get('threads/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  getThread(@Param('id') id: string) {
    return this.supportService.listThreadMessages(id);
  }

  @Post('threads/:id/messages')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  postStaff(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateSupportMessageDto,
  ) {
    return this.supportService.postStaffMessage(id, user, dto);
  }

  @Patch('threads/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  updateThread(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSupportThreadDto,
  ) {
    return this.supportService.updateThread(id, user, dto);
  }
}
