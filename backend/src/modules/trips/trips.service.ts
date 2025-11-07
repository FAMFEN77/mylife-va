import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { ListTripsQueryDto } from './dto/list-trips-query.dto';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(userId: string, dto: CreateTripDto) {
    const date = new Date(dto.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Ongeldige datum.');
    }
    const sanitizedDistance = Number(dto.distanceKm);
    if (!Number.isFinite(sanitizedDistance) || sanitizedDistance <= 0) {
      throw new BadRequestException('Afstand moet groter zijn dan 0.');
    }

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    return this.prisma.trip.create({
      data: {
        userId,
        date: normalizedDate,
        from: dto.from.trim(),
        to: dto.to.trim(),
        distanceKm: sanitizedDistance,
      },
    });
  }

  async listMine(userId: string, query: ListTripsQueryDto) {
    return this.prisma.trip.findMany({
      where: this.buildWhere({ userId }, query),
      orderBy: { date: 'desc' },
    });
  }

  async listPending(role: UserRole, query: ListTripsQueryDto) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen ritten beoordelen.');
    }
    return this.prisma.trip.findMany({
      where: {
        ...this.buildWhere({}, query),
        approved: false,
      },
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async approve(id: string, role: UserRole, approve: boolean) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen ritten goed- of afkeuren.');
    }
    return this.prisma.trip.update({
      where: { id },
      data: { approved: approve },
    });
  }

  private buildWhere(
    base: Prisma.TripWhereInput,
    query: ListTripsQueryDto,
  ): Prisma.TripWhereInput {
    const where: Prisma.TripWhereInput = { ...base };
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
    return where;
  }
}

