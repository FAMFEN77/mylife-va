import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class MagicLinkRequestDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}
