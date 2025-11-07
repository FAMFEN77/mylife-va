import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.reminder.findMany({
      where: { userId },
      orderBy: [{ remindAt: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateReminderDto) {
    const text = dto.text?.trim();
    if (!text) {
      throw new BadRequestException('Reminder heeft een omschrijving nodig.');
    }

    const remindAt = this.coerceDate(dto.remindAt);
    if (!remindAt) {
      throw new BadRequestException('Reminder heeft een geldige datum/tijd nodig.');
    }

    return this.prisma.reminder.create({
      data: {
        userId,
        text,
        remindAt,
        sent: dto.sent ?? false,
      },
    });
  }

  async update(userId: string, reminderId: string, dto: UpdateReminderDto) {
    await this.ensureOwnership(userId, reminderId);
    return this.prisma.reminder.update({
      where: { id: reminderId },
      data: this.mapUpdate(dto),
    });
  }

  async remove(userId: string, reminderId: string) {
    await this.ensureOwnership(userId, reminderId);
    await this.prisma.reminder.delete({ where: { id: reminderId } });
  }

  private async ensureOwnership(userId: string, reminderId: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
      select: { userId: true },
    });
    if (!reminder || reminder.userId !== userId) {
      throw new NotFoundException('Reminder niet gevonden.');
    }
  }

  private mapUpdate(dto: UpdateReminderDto): Prisma.ReminderUpdateInput {
    const data: Prisma.ReminderUpdateInput = {};
    if (dto.text !== undefined) {
      const text = dto.text.trim();
      if (!text) {
        throw new BadRequestException('Reminder heeft een omschrijving nodig.');
      }
      data.text = text;
    }
    if (dto.remindAt !== undefined) {
      const remindAt = this.coerceDate(dto.remindAt);
      if (!remindAt) {
        throw new BadRequestException('Reminder heeft een geldige datum/tijd nodig.');
      }
      data.remindAt = remindAt;
    }
    if (dto.sent !== undefined) {
      data.sent = dto.sent;
    }
    return data;
  }

  private coerceDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return null;
  }
}
