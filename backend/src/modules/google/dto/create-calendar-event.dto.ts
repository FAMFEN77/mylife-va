import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  title!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

