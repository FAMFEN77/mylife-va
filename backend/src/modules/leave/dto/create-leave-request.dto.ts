import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty({ description: 'Startdatum van het verlof', example: '2025-12-24' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'Einddatum van het verlof', example: '2025-12-28' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    description: 'Type verlof (bijvoorbeeld vakantie, ziek, ADV)',
    example: 'vakantie',
  })
  @IsString()
  @MaxLength(100)
  type!: string;

  @ApiPropertyOptional({
    description: 'Optionele toelichting',
    example: 'Wintersport met familie',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

