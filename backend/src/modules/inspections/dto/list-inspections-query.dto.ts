import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListInspectionsQueryDto {
  @ApiPropertyOptional({ description: 'Filter vanaf datum', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter tot datum', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Zoekterm voor locatie', example: 'Locatie A' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}

