import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryDocumentsDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED', 'ALL'])
  status: 'ACTIVE' | 'ARCHIVED' | 'ALL' = 'ACTIVE';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  pageSize: number = 25;
}
