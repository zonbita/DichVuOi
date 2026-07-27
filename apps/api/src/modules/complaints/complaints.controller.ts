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
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ComplaintsService } from './complaints.service';
import {
  AdminComplaintQueryDto,
  AdminResolveComplaintDto,
  CreateComplaintDto,
} from './dto/complaint.dto';

@ApiTags('complaints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post('bookings/:bookingId/complaints')
  createForBooking(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintsService.createForBooking(bookingId, user.id, dto);
  }

  @Get('complaints/mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.complaintsService.listMineAsCustomer(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/complaints')
  listForAdmin(@Query() query: AdminComplaintQueryDto) {
    return this.complaintsService.listForAdmin(query.status);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/complaints/:id')
  resolveAsAdmin(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminResolveComplaintDto,
  ) {
    return this.complaintsService.resolveAsAdmin(id, user, dto);
  }
}
