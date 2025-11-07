import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { PlanningRequestDto } from './dto/planning-request.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async suggest(dto: PlanningRequestDto) {
    const date = new Date(dto.date);
    const weekday = date.getDay();
    const requestStartMinutes = this.convertToMinutes(dto.startTime);
    const requestEndMinutes = this.convertToMinutes(dto.endTime);

    const availabilities = await this.prisma.availability.findMany({
      where: {
        weekday,
      },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    const startOfDay = new Date(dto.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dto.date);
    endOfDay.setHours(23, 59, 59, 999);

    const suggestions: Array<{
      user: { id: string; email: string; role: UserRole };
      location?: string | null;
      availableFrom: string;
      availableUntil: string;
      assignedTasksThatDay: number;
      locationMatches: boolean;
    }> = [];
    for (const availability of availabilities) {
      if (availability.user.role !== UserRole.MEDEWERKER) {
        continue;
      }
      if (dto.preferredUserIds?.length && !dto.preferredUserIds.includes(availability.userId)) {
        continue;
      }
      const availabilityStart = this.convertToMinutes(availability.startTime);
      const availabilityEnd = this.convertToMinutes(availability.endTime);
      if (availabilityStart > requestStartMinutes || availabilityEnd < requestEndMinutes) {
        continue;
      }
      const locationMatches = this.isLocationMatch(dto.location, availability.location);

      const assignmentCount = await this.prisma.task.count({
        where: {
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          assigneeId: availability.userId,
        },
      });

      suggestions.push({
        user: availability.user,
        location: availability.location,
        availableFrom: availability.startTime,
        availableUntil: availability.endTime,
        assignedTasksThatDay: assignmentCount,
        locationMatches,
      });
    }

    suggestions.sort((a, b) => {
      if (a.locationMatches !== b.locationMatches) {
        return a.locationMatches ? -1 : 1;
      }
      return a.assignedTasksThatDay - b.assignedTasksThatDay;
    });

    return suggestions.slice(0, 5).map(({ locationMatches, ...result }) => result);
  }

  private convertToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value, 10));
    return hours * 60 + minutes;
  }

  private isLocationMatch(requested?: string, available?: string | null): boolean {
    const normalizedRequested = this.normalizeLocation(requested);
    if (!normalizedRequested) {
      return true;
    }
    const normalizedAvailable = this.normalizeLocation(available ?? undefined);
    if (!normalizedAvailable) {
      return true;
    }
    return (
      normalizedRequested === normalizedAvailable ||
      normalizedAvailable.includes(normalizedRequested) ||
      normalizedRequested.includes(normalizedAvailable)
    );
  }

  private normalizeLocation(value?: string): string {
    return value?.trim().toLowerCase() ?? '';
  }
}
