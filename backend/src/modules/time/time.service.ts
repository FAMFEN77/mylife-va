import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { ListTimeEntriesQueryDto } from './dto/list-time-entries-query.dto';

@Injectable()
export class TimeService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(userId: string, dto: CreateTimeEntryDto) {
    const { start, end } = this.parseInterval(dto.startTime, dto.endTime);
    const date = new Date(dto.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Ongeldige datum.');
    }

    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationMinutes <= 0) {
      throw new BadRequestException('Eindtijd moet later zijn dan starttijd.');
    }

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    return this.prisma.timeEntry.create({
      data: {
        userId,
        date: normalizedDate,
        startTime: start,
        endTime: end,
        durationMin: durationMinutes,
        projectId: dto.projectId?.trim() || null,
      },
    });
  }

  async listMine(userId: string, query: ListTimeEntriesQueryDto) {
    return this.prisma.timeEntry.findMany({
      where: this.buildWhere({ userId }, query),
      orderBy: { date: 'desc' },
    });
  }

  async listAll(userRole: UserRole, query: ListTimeEntriesQueryDto) {
    if (userRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen alle uren bekijken.');
    }
    return this.prisma.timeEntry.findMany({
      where: this.buildWhere({}, query),
      orderBy: [
        { approved: 'asc' },
        { date: 'desc' },
      ],
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async approveEntry(id: string, approverRole: UserRole, approve = true) {
    if (approverRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen uren goedkeuren.');
    }
    return this.prisma.timeEntry.update({
      where: { id },
      data: { approved: approve },
    });
  }

  private parseInterval(startIso: string, endIso: string): { start: Date; end: Date } {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Ongeldig start- of eindmoment.');
    }
    return { start, end };
  }

  private buildWhere(
    base: Prisma.TimeEntryWhereInput,
    query: ListTimeEntriesQueryDto,
  ): Prisma.TimeEntryWhereInput {
    const where: Prisma.TimeEntryWhereInput = { ...base };

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
      where.date = dateFilter;
    }

    if (query.approved !== undefined) {
      where.approved = query.approved === 'true';
    }

    return where;
  }
}

