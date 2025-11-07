import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class LegacyUpdateTaskDto {
  @ApiPropertyOptional({ enum: ['todo', 'done'] })
  @IsOptional()
  @IsIn(['todo', 'done'])
  status?: 'todo' | 'done';
}
