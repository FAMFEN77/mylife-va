import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum TaskPriorityDto {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatusDto {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Kolom ID waarin de taak wordt aangemaakt' })
  @IsString()
  @MinLength(1)
  columnId!: string;

  @ApiProperty({ minLength: 1, maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: '[Legacy] Gebruik title i.p.v. text', deprecated: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  text?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatusDto })
  @IsOptional()
  @IsEnum(TaskStatusDto)
  status?: TaskStatusDto;

  @ApiPropertyOptional({ enum: TaskPriorityDto })
  @IsOptional()
  @IsEnum(TaskPriorityDto)
  priority?: TaskPriorityDto;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Gebruiker die wordt toegewezen' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Label IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];
}
