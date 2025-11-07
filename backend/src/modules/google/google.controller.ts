import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GoogleOAuthService } from './google-oauth.service';
import { GoogleMailService } from './google-mail.service';
import { GoogleCalendarService } from './google-calendar.service';
import { SendEmailDto } from './dto/send-email.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Google')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('google')
export class GoogleController {
  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly googleMailService: GoogleMailService,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  @Get('status')
  async status(@CurrentUser() user: JwtPayload) {
    return this.googleOAuthService.getStatus(user.sub);
  }

  @Post('send-email')
  async sendEmail(@CurrentUser() user: JwtPayload, @Body() dto: SendEmailDto) {
    const result = await this.googleMailService.sendEmail(user.sub, dto);
    return {
      id: result.id,
      threadId: result.threadId ?? null,
      labelIds: result.labelIds ?? [],
    };
  }

  @Post('calendar/add')
  async createEvent(@CurrentUser() user: JwtPayload, @Body() dto: CreateCalendarEventDto) {
    const event = await this.googleCalendarService.createEvent(user.sub, dto);
    return {
      id: event.id,
      summary: event.summary,
      htmlLink: event.htmlLink,
      start: event.start,
      end: event.end,
    };
  }
}

