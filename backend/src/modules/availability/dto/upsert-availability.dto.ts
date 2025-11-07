import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { AvailabilityEntryDto } from './availability-entry.dto';

export class UpsertAvailabilityDto {
  @ApiProperty({ type: [AvailabilityEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityEntryDto)
  entries!: AvailabilityEntryDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}
