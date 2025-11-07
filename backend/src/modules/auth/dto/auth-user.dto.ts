import { ApiProperty } from '@nestjs/swagger';
import { PlanType } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ['MANAGER', 'MEDEWERKER'] })
  role!: string;

  @ApiProperty({ required: false })
  organisationId?: string | null;

  @ApiProperty({ enum: PlanType, required: false })
  plan?: PlanType;
}
