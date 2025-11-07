import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class AvailabilityEntryDto {
  @ApiProperty({ minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;
}
