import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeaveStatusDto {
  @ApiPropertyOptional({
    description: 'Nieuwe status',
    example: 'approved',
    enum: ['approved', 'denied'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['approved', 'denied'])
  status?: 'approved' | 'denied';

  @ApiPropertyOptional({
    description: 'Optionele manageropmerking',
    example: 'Geniet van je vakantie!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  managerNote?: string;
}

