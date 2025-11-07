import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListLeaveQueryDto {
  @ApiPropertyOptional({ description: 'Filter vanaf datum', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter tot datum', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filter op status (pending, approved, denied)',
    example: 'pending',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}

