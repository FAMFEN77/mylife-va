import { ApiProperty } from '@nestjs/swagger';

export class TimeEntryResponseDto {
  @ApiProperty({ description: 'Unieke identifier', example: 'cmhi123...' })
  id!: string;

  @ApiProperty({ description: 'Gebruiker ID', example: 'user123' })
  userId!: string;

  @ApiProperty({ description: 'Datum van de registratie', example: '2025-11-02T00:00:00.000Z' })
  date!: string;

  @ApiProperty({
    description: 'Startmoment',
    example: '2025-11-02T09:00:00.000Z',
  })
  startTime!: string;

  @ApiProperty({
    description: 'Eindmoment',
    example: '2025-11-02T17:00:00.000Z',
  })
  endTime!: string;

  @ApiProperty({ description: 'Duur in minuten', example: 480 })
  durationMin!: number;

  @ApiProperty({ description: 'Optionele projectidentificatie', example: 'project_abc', nullable: true })
  projectId?: string | null;

  @ApiProperty({ description: 'Of de registratie is goedgekeurd', example: true })
  approved!: boolean;

  @ApiProperty({ description: 'Aanmaakdatum', example: '2025-11-02T17:05:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Laatste update', example: '2025-11-02T17:05:00.000Z' })
  updatedAt!: string;
}

