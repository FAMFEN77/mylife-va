import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { GoogleCalendarService } from '../google/google-calendar.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ListLeaveQueryDto } from './dto/list-leave-query.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

type LeaveStatus = 'pending' | 'approved' | 'denied';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarService: GoogleCalendarService,
  ) {}

  async create(userId: string, dto: CreateLeaveRequestDto) {
    const range = this.parseRange(dto.startDate, dto.endDate);

    return this.prisma.leaveRequest.create({
      data: {
        userId,
        startDate: range.start,
        endDate: range.end,
        type: dto.type.trim(),
      },
    });
  }

  async listMine(userId: string, query: ListLeaveQueryDto) {
    return this.prisma.leaveRequest.findMany({
      where: this.buildWhere({ userId }, query),
      orderBy: { startDate: 'desc' },
    });
  }

  async listPending(role: UserRole, query: ListLeaveQueryDto) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen verlofaanvragen beoordelen.');
    }
    return this.prisma.leaveRequest.findMany({
      where: {
        ...this.buildWhere({}, query),
        status: query.status ?? 'pending',
      },
      orderBy: { startDate: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async updateStatus(id: string, approver: JwtPayload, dto: UpdateLeaveStatusDto) {
    if (approver.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen de status van verlofaanvragen wijzigen.');
    }

    const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) {
      throw new NotFoundException('Verlofaanvraag niet gevonden.');
    }

    const status: LeaveStatus = dto.status ?? 'approved';

    let calendarEventId = leave.calendarEventId ?? null;
    if (status === 'approved' && !calendarEventId) {
      calendarEventId = await this.tryCreateCalendarEvent(leave);
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        calendarEventId,
      },
    });

    return updated;
  }

  private async tryCreateCalendarEvent(leave: {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    type: string;
  }): Promise<string | null> {
    try {
      const event = await this.calendarService.createEvent(leave.userId, {
        title: `Verlof: ${leave.type}`,
        date: this.formatDate(leave.startDate),
        description: `Verlof van ${this.formatDate(leave.startDate)} tot ${this.formatDate(leave.endDate)}.`,
      });
      const eventId = typeof event === 'object' && event && 'id' in event ? String(event.id) : null;
      return eventId;
    } catch (error) {
      this.logger.warn(`Kon Google Calendar event niet aanmaken voor verlof ${leave.id}: ${error}`);
      return null;
    }
  }

  private parseRange(startIso: string, endIso: string): { start: Date; end: Date } {
    const start = new Date(startIso);
    const end = new Date(endIso);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Ongeldige start- of einddatum.');
    }
    if (end < start) {
      throw new BadRequestException('Einddatum kan niet voor de startdatum liggen.');
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private buildWhere(
    base: Prisma.LeaveRequestWhereInput,
    query: ListLeaveQueryDto,
  ): Prisma.LeaveRequestWhereInput {
    const where: Prisma.LeaveRequestWhereInput = { ...base };

    if (query.from || query.to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.from) {
        const from = new Date(query.from);
        if (!Number.isNaN(from.getTime())) {
          from.setHours(0, 0, 0, 0);
          dateFilter.gte = from;
        }
      }
      if (query.to) {
        const to = new Date(query.to);
        if (!Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          dateFilter.lte = to;
        }
      }
      where.startDate = dateFilter;
    }

    if (query.status) {
      where.status = query.status.toLowerCase() as LeaveStatus;
    }

    return where;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]!;
  }
}
