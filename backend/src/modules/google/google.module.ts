import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../common/database/prisma.module';
import { GoogleOAuthController } from './google-oauth.controller';
import { GoogleController } from './google.controller';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleMailService } from './google-mail.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [GoogleOAuthController, GoogleController],
  providers: [GoogleOAuthService, GoogleCalendarService, GoogleMailService],
  exports: [GoogleOAuthService, GoogleCalendarService, GoogleMailService],
})
export class GoogleModule {}

