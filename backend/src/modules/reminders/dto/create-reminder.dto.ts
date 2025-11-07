import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReminderDto {
  @ApiProperty({ minLength: 1, maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  remindAt!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sent?: boolean;
}
