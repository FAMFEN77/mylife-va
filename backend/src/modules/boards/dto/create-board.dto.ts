import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @IsNotEmpty()
  organisationId!: string;

  @IsOptional()
  @IsString()
  projectId?: string | null;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
