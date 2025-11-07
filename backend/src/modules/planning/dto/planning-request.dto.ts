import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class PlanningRequestDto {
  @ApiProperty({ description: 'ISO datum (YYYY-MM-DD) waarop gepland moet worden' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredUserIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}
