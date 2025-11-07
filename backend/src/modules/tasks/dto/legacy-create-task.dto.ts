import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class LegacyCreateTaskDto {
  @ApiProperty({ description: 'Titel van de taak' })
  @IsString()
  text!: string;

  @ApiPropertyOptional({ enum: ['todo', 'done'] })
  @IsOptional()
  @IsIn(['todo', 'done'])
  status?: 'todo' | 'done';

  @ApiPropertyOptional({ description: 'ISO datum/tijd string' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];
}
