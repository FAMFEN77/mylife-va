import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryCustomerDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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

  @IsOptional()
  @IsIn(['createdAt', 'lastName', 'companyName'])
  sort: 'createdAt' | 'lastName' | 'companyName' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  dir: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsIn(['only', 'exclude', 'include'])
  archived: 'only' | 'exclude' | 'include' = 'exclude';
}
