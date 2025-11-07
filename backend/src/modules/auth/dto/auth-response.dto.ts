import { ApiProperty } from '@nestjs/swagger';

import { TokenResponseDto } from './token-response.dto';
import { AuthUserDto } from './auth-user.dto';

export class AuthResponseDto extends TokenResponseDto {
  @ApiProperty({ type: () => AuthUserDto })
  user!: AuthUserDto;
}
