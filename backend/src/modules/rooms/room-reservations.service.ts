import { Injectable, NotFoundException } from '@nestjs/common';
import { MeetingRoom, RoomReservation } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';

const DEFAULT_ROOMS: Array<{ name: string; location: string; capacity: number }> = [
  { name: 'Vergaderruimte A', location: 'Hoofdkantoor', capacity: 6 },
  { name: 'Vergaderruimte B', location: 'Hoofdkantoor', capacity: 10 },
  { name: 'Focusruimte 1', location: 'Hoofdkantoor', capacity: 4 },
];

export interface ReservationRequest {
  start: Date;
  end: Date;
  title: string;
  description?: string;
  preferredRoom?: string;
  attendees?: string[];
  capacity?: number;
  notes?: string;
}

export interface AlternativeRoomSuggestion {
  room: MeetingRoom;
  conflicts: Array<{ title: string; start: Date; end: Date }>;
}

export interface ReservationResult {
  reservation: RoomReservation & { room: MeetingRoom };
  room: MeetingRoom;
  alternativeRooms?: AlternativeRoomSuggestion[];
}

interface NormalizedReservationRequest {
  start: Date;
  end: Date;
  title: string;
  description?: string;
  preferredRoom?: string;
  attendees?: string[];
  capacity?: number;
  notes?: string;
}

@Injectable()
export class RoomReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async reserve(userId: string, request: ReservationRequest): Promise<ReservationResult> {
    await this.ensureDefaultRooms();

    const normalized = this.normalizeRequest(request);
    const alternatives: AlternativeRoomSuggestion[] = [];

    let preferredRoom: MeetingRoom | null = null;
    if (normalized.preferredRoom) {
      preferredRoom = await this.findOrCreateRoom(normalized.preferredRoom, normalized.capacity);
      if (preferredRoom) {
        const conflicts = await this.findConflicts(preferredRoom.id, normalized.start, normalized.end);
        if (!conflicts.length) {
          return this.createReservation(userId, preferredRoom, normalized, alternatives);
        }
        alternatives.push({
          room: preferredRoom,
          conflicts: conflicts.map((conflict) => this.summarizeReservation(conflict)),
        });
      }
    }

    const availableRoom = await this.findBestAvailableRoom(
      normalized,
      alternatives,
      preferredRoom?.id,
    );

    if (!availableRoom) {
      throw new NotFoundException('Geen beschikbare ruimtes gevonden voor dit tijdslot.');
    }

    return this.createReservation(userId, availableRoom, normalized, alternatives);
  }

  private async createReservation(
    userId: string,
    room: MeetingRoom,
    request: NormalizedReservationRequest,
    alternatives: AlternativeRoomSuggestion[],
  ): Promise<ReservationResult> {
    const reservation = await this.prisma.roomReservation.create({
      data: {
        roomId: room.id,
        userId,
        title: request.title,
        description: request.description,
        start: request.start,
        end: request.end,
        attendees: request.attendees ?? [],
        notes: request.notes,
      },
      include: { room: true },
    });

    return {
      reservation,
      room: reservation.room,
      alternativeRooms: alternatives.length ? this.uniqueAlternatives(alternatives) : undefined,
    };
  }

  private normalizeRequest(request: ReservationRequest): NormalizedReservationRequest {
    const start = new Date(request.start);
    const endCandidate = new Date(request.end);

    const startValue = Number.isNaN(start.getTime()) ? new Date() : start;
    let endValue = Number.isNaN(endCandidate.getTime())
      ? new Date(startValue.getTime() + 30 * 60 * 1000)
      : endCandidate;

    if (endValue <= startValue) {
      endValue = new Date(startValue.getTime() + 30 * 60 * 1000);
    }

    const attendeeList = (request.attendees ?? [])
      .map((entry) => entry?.trim())
      .filter((entry): entry is string => !!entry && entry.length > 0);
    const uniqueAttendees = Array.from(new Set(attendeeList));

    const normalizedCapacity =
      request.capacity && request.capacity > 0 ? Math.round(request.capacity) : undefined;

    return {
      start: startValue,
      end: endValue,
      title: request.title?.trim().length ? request.title.trim() : 'Vergadering',
      description: request.description?.trim() || undefined,
      preferredRoom: request.preferredRoom?.trim() || undefined,
      attendees: uniqueAttendees.length ? uniqueAttendees : undefined,
      capacity: normalizedCapacity,
      notes: request.notes?.trim() || undefined,
    };
  }

  private async ensureDefaultRooms(): Promise<void> {
    const count = await this.prisma.meetingRoom.count();
    if (count > 0) {
      return;
    }
    await this.prisma.meetingRoom.createMany({
      data: DEFAULT_ROOMS.map((room) => ({
        name: room.name,
        location: room.location,
        capacity: room.capacity,
      })),
      skipDuplicates: true,
    });
  }

  private async findOrCreateRoom(
    name: string,
    capacity?: number,
  ): Promise<MeetingRoom | null> {
    const trimmed = name.trim();
    if (!trimmed.length) {
      return null;
    }
    const existing = await this.prisma.meetingRoom.findFirst({
      where: {
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    if (existing) {
      if (capacity && (!existing.capacity || existing.capacity < capacity)) {
        await this.prisma.meetingRoom.update({
          where: { id: existing.id },
          data: { capacity: Math.round(capacity) },
        });
        return this.prisma.meetingRoom.findUniqueOrThrow({ where: { id: existing.id } });
      }
      return existing;
    }
    return this.prisma.meetingRoom.create({
      data: {
        name: this.formatRoomName(trimmed),
        capacity: capacity ? Math.round(capacity) : undefined,
      },
    });
  }

  private async findBestAvailableRoom(
    request: NormalizedReservationRequest,
    alternatives: AlternativeRoomSuggestion[],
    excludeRoomId?: string,
  ): Promise<MeetingRoom | null> {
    const capacityNeed = request.capacity ?? request.attendees?.length ?? 0;
    const rooms = await this.prisma.meetingRoom.findMany({
      orderBy: [{ capacity: 'asc' }, { name: 'asc' }],
    });

    const candidates = rooms
      .filter((room) => room.id !== excludeRoomId)
      .filter((room) => {
        if (!capacityNeed) {
          return true;
        }
        if (room.capacity == null) {
          return true;
        }
        return room.capacity >= capacityNeed;
      })
      .sort((a, b) => {
        const scoreA = a.capacity ?? capacityNeed ?? 0;
        const scoreB = b.capacity ?? capacityNeed ?? 0;
        return scoreA - scoreB;
      });

    for (const room of candidates) {
      const conflicts = await this.findConflicts(room.id, request.start, request.end);
      if (!conflicts.length) {
        return room;
      }
      alternatives.push({
        room,
        conflicts: conflicts.map((conflict) => this.summarizeReservation(conflict)),
      });
    }

    return null;
  }

  private async findConflicts(roomId: string, start: Date, end: Date): Promise<RoomReservation[]> {
    return this.prisma.roomReservation.findMany({
      where: {
        roomId,
        start: { lt: end },
        end: { gt: start },
      },
      orderBy: { start: 'asc' },
    });
  }

  private summarizeReservation(reservation: RoomReservation) {
    return {
      title: reservation.title,
      start: reservation.start,
      end: reservation.end,
    };
  }

  private uniqueAlternatives(alternatives: AlternativeRoomSuggestion[]): AlternativeRoomSuggestion[] {
    const seen = new Set<string>();
    const deduped: AlternativeRoomSuggestion[] = [];
    for (const alternative of alternatives) {
      if (seen.has(alternative.room.id)) {
        continue;
      }
      seen.add(alternative.room.id);
      deduped.push(alternative);
    }
    return deduped;
  }

  private formatRoomName(value: string): string {
    return value
      .split(/\s+/)
      .map((part) => (part.length ? part[0]!.toUpperCase() + part.slice(1) : part))
      .join(' ')
      .trim();
  }
}
