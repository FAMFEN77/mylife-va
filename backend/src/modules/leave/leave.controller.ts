import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveResponseDto } from './dto/leave-response.dto';
import { ListLeaveQueryDto } from './dto/list-leave-query.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Leave')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post('request')
  async requestLeave(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLeaveRequestDto,
  ): Promise<LeaveResponseDto> {
    const leave = await this.leaveService.create(user.sub, dto);
    return this.toDto(leave);
  }

  @Get('mine')
  async listMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListLeaveQueryDto,
  ): Promise<LeaveResponseDto[]> {
    const leaves = await this.leaveService.listMine(user.sub, query);
    return leaves.map((leave) => this.toDto(leave));
  }

  @Get('pending')
  async listPending(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListLeaveQueryDto,
  ) {
    const leaves = await this.leaveService.listPending(user.role, query);
    return leaves.map((leave) => ({
      ...this.toDto(leave),
      user: leave.user,
    }));
  }

  @Post(':id/approve')
  async approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveStatusDto,
  ): Promise<LeaveResponseDto> {
    const leave = await this.leaveService.updateStatus(id, user, { ...dto, status: 'approved' });
    return this.toDto(leave);
  }

  @Post(':id/deny')
  async deny(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveStatusDto,
  ): Promise<LeaveResponseDto> {
    const leave = await this.leaveService.updateStatus(id, user, { ...dto, status: 'denied' });
    return this.toDto(leave);
  }

  private toDto(leave: {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    type: string;
    status: string;
    calendarEventId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): LeaveResponseDto {
    return {
      id: leave.id,
      userId: leave.userId,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
      type: leave.type,
      status: leave.status,
      calendarEventId: leave.calendarEventId,
      createdAt: leave.createdAt.toISOString(),
      updatedAt: leave.updatedAt.toISOString(),
    };
  }
}

