import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AuthUserDto } from './dto/auth-user.dto';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';
import { MagicLinkVerifyDto } from './dto/magic-link-verify.dto';
import { RegisterPasswordDto } from './dto/register-password.dto';
import { LoginPasswordDto } from './dto/login-password.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterPasswordDto): Promise<{ message: string }> {
    await this.authService.registerWithPassword(dto);
    return { message: 'Registered' };
  }

  @Post('login')
  async login(@Body() dto: LoginPasswordDto): Promise<AuthResponseDto> {
    return this.authService.loginWithPassword(dto);
  }

  @Post('magic-link')
  async requestMagicLink(@Body() dto: MagicLinkRequestDto): Promise<void> {
    await this.authService.requestMagicLink(dto);
  }

  @Post('callback')
  async magicLinkCallback(@Body() dto: MagicLinkVerifyDto): Promise<AuthResponseDto> {
    return this.authService.redeemMagicLink(dto);
  }

  @Post('password/forgot')
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(dto);
    return { message: 'Als het e-mailadres bekend is, sturen we een reset-link.' };
  }

  @Post('password/reset')
  async resetPassword(@Body() dto: PasswordResetConfirmDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Wachtwoord bijgewerkt. Je kunt nu inloggen.' };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logout(user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: JwtPayload): Promise<AuthUserDto> {
    return this.authService.getProfile(user.sub);
  }
}
