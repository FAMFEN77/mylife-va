import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { TimeService } from './time.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { ListTimeEntriesQueryDto } from './dto/list-time-entries-query.dto';
import { TimeEntryResponseDto } from './dto/time-entry-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Time')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('time')
export class TimeController {
  constructor(private readonly timeService: TimeService) {}

  @Post('add')
  async addEntry(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTimeEntryDto,
  ): Promise<TimeEntryResponseDto> {
    const entry = await this.timeService.createForUser(user.sub, dto);
    return this.toDto(entry);
  }

  @Get('me')
  async listMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListTimeEntriesQueryDto,
  ): Promise<TimeEntryResponseDto[]> {
    const entries = await this.timeService.listMine(user.sub, query);
    return entries.map((entry) => this.toDto(entry));
  }

  @Get('all')
  async listAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListTimeEntriesQueryDto,
  ): Promise<Array<TimeEntryResponseDto & { user: { id: string; email: string; role: string } }>> {
    const entries = await this.timeService.listAll(user.role, query);
    return entries.map((entry) => ({
      ...this.toDto(entry),
      user: entry.user,
    }));
  }

  @Post(':id/approve')
  async approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<TimeEntryResponseDto> {
    const updated = await this.timeService.approveEntry(id, user.role, true);
    return this.toDto(updated);
  }

  @Post(':id/reject')
  async reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<TimeEntryResponseDto> {
    const updated = await this.timeService.approveEntry(id, user.role, false);
    return this.toDto(updated);
  }

  private toDto(entry: {
    id: string;
    userId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    durationMin: number;
    projectId: string | null;
    approved: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): TimeEntryResponseDto {
    return {
      id: entry.id,
      userId: entry.userId,
      date: entry.date.toISOString(),
      startTime: entry.startTime.toISOString(),
      endTime: entry.endTime.toISOString(),
      durationMin: entry.durationMin,
      projectId: entry.projectId,
      approved: entry.approved,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }
}

