import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class InviteTeamMemberDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  role?: UserRole;
}
