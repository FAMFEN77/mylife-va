import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ListTripsQueryDto {
  @ApiPropertyOptional({ description: 'Filter vanaf datum', example: '2025-11-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter tot datum', example: '2025-11-07' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

