import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListExpensesQueryDto {
  @ApiPropertyOptional({ description: 'Filter vanaf datum', example: '2025-11-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter tot datum', example: '2025-11-30' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter op status (pending, approved, rejected)', example: 'pending' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}

