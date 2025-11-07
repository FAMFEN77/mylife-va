import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTimeEntryDto {
  @ApiProperty({ description: 'Datum van de gewerkte dag', example: '2025-11-02' })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'Startmoment in ISO-formaat',
    example: '2025-11-02T09:00:00+01:00',
  })
  @IsDateString()
  startTime!: string;

  @ApiProperty({
    description: 'Eindmoment in ISO-formaat',
    example: '2025-11-02T17:00:00+01:00',
  })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({
    description: 'Optionele project- of klantidentifier',
    example: 'project_abc',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  projectId?: string;
}

