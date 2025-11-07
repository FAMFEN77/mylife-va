import { ApiProperty } from '@nestjs/swagger';

export class LeaveResponseDto {
  @ApiProperty({ description: 'Verlofaanvraag ID', example: 'leave_123' })
  id!: string;

  @ApiProperty({ description: 'Gebruiker ID', example: 'user_abc' })
  userId!: string;

  @ApiProperty({ description: 'Startdatum', example: '2025-12-24T00:00:00.000Z' })
  startDate!: string;

  @ApiProperty({ description: 'Einddatum', example: '2025-12-28T00:00:00.000Z' })
  endDate!: string;

  @ApiProperty({ description: 'Type verlof', example: 'vakantie' })
  type!: string;

  @ApiProperty({ description: 'Status', example: 'pending' })
  status!: string;

  @ApiProperty({ description: 'Optioneel gekoppeld kalender event ID', example: 'abc123', nullable: true })
  calendarEventId?: string | null;

  @ApiProperty({ description: 'Aanmaakdatum', example: '2025-10-01T09:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Laatste update', example: '2025-10-01T09:00:00.000Z' })
  updatedAt!: string;
}

