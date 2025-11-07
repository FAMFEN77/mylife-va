import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RecurrenceDto {
  @ApiProperty({ description: 'Recurrence regel (bijv. FREQ=DAILY)' })
  @IsString()
  @MinLength(3)
  rule!: string;
}
