import { ApiProperty } from '@nestjs/swagger';

export class TripResponseDto {
  @ApiProperty({ description: 'Unieke ID', example: 'trip_123' })
  id!: string;

  @ApiProperty({ description: 'Gebruiker ID', example: 'user_abc' })
  userId!: string;

  @ApiProperty({ description: 'Datum van de rit', example: '2025-11-02T00:00:00.000Z' })
  date!: string;

  @ApiProperty({ description: 'Vertrekplaats', example: 'Amsterdam' })
  from!: string;

  @ApiProperty({ description: 'Bestemming', example: 'Rotterdam' })
  to!: string;

  @ApiProperty({ description: 'Afstand in kilometers', example: 78.5 })
  distanceKm!: number;

  @ApiProperty({ description: 'Of de rit is goedgekeurd', example: false })
  approved!: boolean;

  @ApiProperty({ description: 'Aanmaakdatum', example: '2025-11-02T08:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Laatste update', example: '2025-11-02T08:00:00.000Z' })
  updatedAt!: string;
}

