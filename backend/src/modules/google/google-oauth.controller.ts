import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GoogleOAuthService } from './google-oauth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Google OAuth')
@Controller('google')
export class GoogleOAuthController {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  @Get('auth')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  start(
    @CurrentUser() user: JwtPayload,
    @Query('returnTo') returnTo?: string,
  ) {
    const url = this.googleOAuthService.generateAuthorizationUrl(user.sub, returnTo);
    return { url };
  }

  @Get('oauth/callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    if (error) {
      return res.status(400).send(`Google OAuth fout: ${error}`);
    }

    try {
      const { redirectUri } = await this.googleOAuthService.handleOAuthCallback(code, state);
      const target = redirectUri ?? this.googleOAuthService.getDefaultSuccessRedirect();
      return res.redirect(target);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Onbekende fout tijdens Google OAuth-verificatie.';
      return res.status(500).send(`Kon de Google OAuth flow niet afronden: ${message}`);
    }
  }
}

