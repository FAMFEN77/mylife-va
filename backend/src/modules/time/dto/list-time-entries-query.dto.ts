import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsDateString, IsOptional } from 'class-validator';

export class ListTimeEntriesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter vanaf datum (inclusief)',
    example: '2025-11-01',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Filter tot datum (inclusief)',
    example: '2025-11-07',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filter op goedkeuringsstatus',
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  approved?: string;
}

