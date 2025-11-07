import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { UpsertAvailabilityDto } from './dto/upsert-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(requester: JwtPayload, targetUserId?: string) {
    const userId = targetUserId ?? requester.sub;
    if (userId !== requester.sub && requester.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen beschikbaarheid van anderen bekijken.');
    }

    const entries = await this.prisma.availability.findMany({
      where: { userId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });

    return entries;
  }

  async replaceAvailability(requester: JwtPayload, dto: UpsertAvailabilityDto) {
    const targetUserId = dto.userId ?? requester.sub;
    if (targetUserId !== requester.sub && requester.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen beschikbaarheid van anderen aanpassen.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundException('Gebruiker niet gevonden.');
    }

    const data = dto.entries.map((entry) => this.mapEntry(targetUserId, entry));

    await this.prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { userId: targetUserId } });
      if (data.length) {
        await tx.availability.createMany({ data });
      }
    });

    return this.prisma.availability.findMany({
      where: { userId: targetUserId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }

  private mapEntry(
    userId: string,
    entry: { weekday: number; startTime: string; endTime: string; location?: string },
  ): Prisma.AvailabilityCreateManyInput {
    const { weekday, startTime, endTime, location } = entry;
    if (!this.isStartBeforeEnd(startTime, endTime)) {
      throw new ForbiddenException('Starttijd moet vóór eindtijd liggen.');
    }
    return {
      userId,
      weekday,
      startTime,
      endTime,
      location,
    };
  }

  private isStartBeforeEnd(start: string, end: string): boolean {
    const [sH, sM] = start.split(':').map((v) => Number.parseInt(v, 10));
    const [eH, eM] = end.split(':').map((v) => Number.parseInt(v, 10));
    const startMinutes = sH * 60 + sM;
    const endMinutes = eH * 60 + eM;
    return startMinutes < endMinutes;
  }
}
