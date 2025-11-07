import { ApiProperty } from '@nestjs/swagger';

export class InspectionItemResponseDto {
  @ApiProperty({ description: 'Onderdeel ID', example: 'item_123' })
  id!: string;

  @ApiProperty({ description: 'Omschrijving', example: 'Badkamer' })
  description!: string;

  @ApiProperty({ description: 'Score (1-5)', example: 5 })
  score!: number;

  @ApiProperty({ description: 'Notitie', example: 'Erg schoon', nullable: true })
  notes?: string | null;
}

export class InspectionResponseDto {
  @ApiProperty({ description: 'Inspectie ID', example: 'insp_123' })
  id!: string;

  @ApiProperty({ description: 'Inspecteur ID', example: 'user_abc' })
  inspectorId!: string;

  @ApiProperty({ description: 'Locatie', example: 'Locatie A - Eelderveen' })
  location!: string;

  @ApiProperty({ description: 'Datum', example: '2025-11-10T10:00:00.000Z' })
  date!: string;

  @ApiProperty({ description: 'Notities', example: 'Algemene kwaliteit is goed.', nullable: true })
  notes?: string | null;

  @ApiProperty({ description: 'PDF URL', example: 'stub://inspections/insp_123.pdf', nullable: true })
  pdfUrl?: string | null;

  @ApiProperty({ description: 'Checklist items', type: [InspectionItemResponseDto] })
  items!: InspectionItemResponseDto[];

  @ApiProperty({ description: 'Aanmaakdatum', example: '2025-11-10T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Laatste update', example: '2025-11-10T10:00:00.000Z' })
  updatedAt!: string;
}

