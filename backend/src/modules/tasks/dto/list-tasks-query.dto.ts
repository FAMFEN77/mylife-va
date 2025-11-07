import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { TaskStatusDto } from './create-task.dto';

export class ListTasksQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ enum: TaskStatusDto })
  @IsOptional()
  @IsEnum(TaskStatusDto)
  status?: TaskStatusDto;

  @ApiPropertyOptional({ description: 'Filter op label ID' })
  @IsOptional()
  @IsString()
  labelId?: string;

  @ApiPropertyOptional({ description: 'Alleen taken met vervaldatum tot deze ISO string' })
  @IsOptional()
  @IsString()
  dueBefore?: string;
}
