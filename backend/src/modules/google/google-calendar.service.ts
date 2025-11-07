import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GoogleOAuthService } from './google-oauth.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';

const CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

@Injectable()
export class GoogleCalendarService {
  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly configService: ConfigService,
  ) {}

  async createEvent(userId: string, dto: CreateCalendarEventDto) {
    const { accessToken } = await this.googleOAuthService.getValidAccessToken(userId);
    const timeZone = this.configService.get<string>('GOOGLE_CALENDAR_TIMEZONE') ?? 'Europe/Amsterdam';

    const eventPayload = this.buildEventPayload(dto, timeZone);

    const response = await fetch(CALENDAR_EVENTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Kon agenda-afspraak niet aanmaken: ${text}`);
    }

    return await response.json();
  }

  private buildEventPayload(dto: CreateCalendarEventDto, timeZone: string) {
    if (!dto.time) {
      return {
        summary: dto.title,
        description: dto.description,
        location: dto.location,
        start: { date: dto.date },
        end: { date: dto.date },
      };
    }

    const start = this.parseDateTime(dto.date, dto.time);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    return {
      summary: dto.title,
      description: dto.description,
      location: dto.location,
      start: {
        dateTime: start.toISOString(),
        timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone,
      },
    };
  }

  private parseDateTime(date: string, time: string): Date {
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    const isoCandidate = `${date}T${normalizedTime}`;
    const parsed = new Date(isoCandidate);
    if (Number.isNaN(parsed.getTime())) {
      throw new InternalServerErrorException(`Ongeldige datum/tijd combinatie: ${date} ${time}`);
    }
    return parsed;
  }
}

