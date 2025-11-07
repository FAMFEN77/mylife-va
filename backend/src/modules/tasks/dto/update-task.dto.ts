import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { TaskPriorityDto, TaskStatusDto } from './create-task.dto';

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  columnId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '[Legacy] Gebruik title i.p.v. text', deprecated: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  text?: string;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];
}
