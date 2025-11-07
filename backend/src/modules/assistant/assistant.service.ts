import { Injectable } from '@nestjs/common';

import { AssistantRequestDto } from './dto/assistant-request.dto';
import { AssistantResponseDto } from './dto/assistant-response.dto';
import { TasksService } from '../tasks/tasks.service';
import { RemindersService } from '../reminders/reminders.service';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { IntentDetectionService } from './intent-detection.service';
import { IntentResult } from './intent.types';
import { GoogleCalendarService } from '../google/google-calendar.service';
import { GoogleMailService } from '../google/google-mail.service';
import { CreateCalendarEventDto } from '../google/dto/create-calendar-event.dto';
import { SendEmailDto } from '../google/dto/send-email.dto';
import { RoomReservationsService } from '../rooms/room-reservations.service';
import { BrandService } from '../../common/brand/brand.service';

type ReservationRequest = Parameters<RoomReservationsService['reserve']>[1];

interface EmailRouting {
  to?: string;
  cc?: string[];
  bcc?: string[];
}

interface EmailTemplate {
  subject: string;
  body: string;
  greeting: string;
  closing: string;
  signature: string;
  tone: 'formeel' | 'informeel' | 'neutraal';
  summary: string;
  keyPoints: string[];
  placeholders: Record<string, string>;
}

interface GroceryListItem {
  name: string;
  quantity: string;
}

@Injectable()
export class AssistantService {
  constructor(
    private readonly tasksService: TasksService,
    private readonly remindersService: RemindersService,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly googleMailService: GoogleMailService,
    private readonly roomReservationsService: RoomReservationsService,
    private readonly intentDetectionService: IntentDetectionService,
    private readonly brandService: BrandService,
  ) {}

  async handle(userId: string, dto: AssistantRequestDto): Promise<AssistantResponseDto> {
    const intentResult = await this.intentDetectionService.detect(dto.message);

    const payload = await this.routeIntent(userId, dto, intentResult);
    const response: AssistantResponseDto = {
      intent: intentResult.intent,
      parameters: intentResult.parameters ?? {},
      message: payload.message,
      result: payload.result,
    };
    if (intentResult.confidence !== undefined) {
      response.confidence = intentResult.confidence;
    }
    return response;
  }

  private async routeIntent(
    userId: string,
    dto: AssistantRequestDto,
    intentResult: IntentResult,
  ): Promise<{ message?: string; result?: Record<string, unknown> }> {
    const params = intentResult.parameters ?? {};

    switch (intentResult.intent) {
      case 'task.create': {
        const payload = params as Partial<CreateTaskDto>;
        const text = this.resolveTaskText(params, dto.message);
        if (!text) {
          return {
            message: 'Ik kon geen duidelijke taak formuleren. Probeer het nog eens.',
          };
        }
        const status = payload.status === 'done' ? 'done' : 'todo';
        const created = await this.tasksService.create(userId, { text, status });
        return { message: 'Ik heb je taak toegevoegd.', result: { task: created } };
      }
      case 'task.list': {
        const tasks = await this.tasksService.list(userId);
        return {
          message: tasks.length
            ? `Je hebt ${tasks.length} taak/ taken open.`
            : 'Je hebt nog geen taken.',
          result: { tasks },
        };
      }
      case 'reminder.create': {
        const description = this.resolveReminderDescription(params, dto.message);
        const remindAt = this.resolveReminderDateTime(params, dto.message);
        if (!description) {
          return {
            message: 'Ik kan geen duidelijke omschrijving voor de reminder vinden. Kun je het specifieker formuleren?',
          };
        }
        if (!remindAt) {
          return {
            message: 'Ik heb geen datum of tijd voor de reminder kunnen afleiden. Voeg alsjeblieft een moment toe.',
          };
        }
        const created = await this.remindersService.create(userId, {
          text: description,
          remindAt,
          sent: false,
        });
        let calendarEvent: Record<string, unknown> | undefined;
        let messageText = 'Reminder staat gepland.';

        if (this.shouldCreateCalendarEvent(params, dto.message)) {
          try {
            calendarEvent = await this.googleCalendarService.createEvent(userId, {
              title: description,
              date: this.formatDate(remindAt),
              time: this.formatTime(remindAt),
              description,
            });
            messageText += ' Agenda-item toegevoegd aan je Google Calendar.';
          } catch (error) {
            messageText += ` Agenda-item kon niet worden aangemaakt: ${this.humanizeError(error)}.`;
          }
        }

        const result: Record<string, unknown> = { reminder: created };
        if (calendarEvent) {
          result.event = calendarEvent;
        }
        return { message: messageText, result };
      }
      case 'reminder.list': {
        const reminders = await this.remindersService.list(userId);
        return {
          message: reminders.length
            ? `Je hebt ${reminders.length} reminder(s).`
            : 'Geen reminders gevonden.',
          result: { reminders },
        };
      }
      case 'meeting.schedule':
      case 'calendar.create': {
        const payload = params as Partial<CreateCalendarEventDto> & {
          summary?: string;
          datetime?: string;
        };
        const title =
          this.ensureString(payload.title ?? payload.summary) ??
          `${this.brandService.appName} afspraak`;
        const { date, time } = this.determineEventDateTime(payload, dto.message);
        const event = await this.googleCalendarService.createEvent(userId, {
          title,
          date,
          time,
          description: this.ensureString(payload.description) ?? dto.message,
          location: this.ensureString(payload.location),
        });
        return {
          message: 'Agenda-item toegevoegd aan je Google Calendar.',
          result: { event },
        };
      }
      case 'room.reserve': {
        const details = this.resolveReservationPayload(params, dto.message);
        if (!details) {
          return {
            message: 'Ik heb geen duidelijke datum of tijd voor de reservering kunnen vinden.',
          };
        }
        const reservationResult = await this.roomReservationsService.reserve(userId, details);
        let calendarEvent: Record<string, unknown> | undefined;
        let messageText = `Ruimte ${reservationResult.room.name} gereserveerd.`;
        try {
          calendarEvent = await this.googleCalendarService.createEvent(userId, {
            title: reservationResult.reservation.title,
            date: this.formatDate(reservationResult.reservation.start),
            time: this.formatTime(reservationResult.reservation.start),
            description:
              reservationResult.reservation.description ??
              `Vergadering in ${reservationResult.room.name}`,
            location: reservationResult.room.location ?? reservationResult.room.name,
          });
          messageText += ' Agenda-item toegevoegd aan Google Calendar.';
        } catch (error) {
          messageText += ` Agenda-item kon niet worden aangemaakt: ${this.humanizeError(error)}.`;
        }
        const result: Record<string, unknown> = {
          reservation: reservationResult.reservation,
          room: reservationResult.room,
        };
        if (calendarEvent) {
          result.event = calendarEvent;
        }
        if (reservationResult.alternativeRooms?.length) {
          result.alternatives = reservationResult.alternativeRooms;
        }
        return { message: messageText, result };
      }
      case 'email.write': {
        const routing = this.resolveEmailRouting(params, dto.message);
        const template = this.composeEmailTemplate(params, dto.message, routing);
        return {
          message: 'Ik heb een e-mailconcept voor je klaargezet.',
          result: {
            template,
            routing,
          },
        };
      }
      case 'email.send': {
        const routing = this.resolveEmailRouting(params, dto.message);
        if (!routing.to) {
          return {
            message: 'Ik kan geen ontvanger vinden voor de e-mail. Geef een e-mailadres.',
          };
        }
        const template = this.composeEmailTemplate(params, dto.message, routing);
        const subject = this.ensureString((params as any).subject) ?? template.subject;
        const body = this.ensureString((params as any).body) ?? template.body;
        const message = await this.googleMailService.sendEmail(userId, {
          to: routing.to,
          subject,
          body,
          cc: routing.cc ?? undefined,
          bcc: routing.bcc ?? undefined,
        });
        return {
          message: `E-mail verzonden naar ${routing.to}.`,
          result: { message, template, routing },
        };
      }
      case 'grocery.list': {
        const itemsParam = (params as any).items;
        let groceries = Array.isArray(itemsParam) && itemsParam.length
          ? this.normalizeGroceryItems(itemsParam)
          : [];
        if (!groceries.length) {
          groceries = this.generateDefaultGroceryList(dto.message);
        }
        return {
          message: 'Hier is een boodschappenlijst die je kunt gebruiken.',
          result: { groceries },
        };
      }
      case 'math.calculate': {
        const expression =
          this.ensureString((params as any).expression) ??
          this.extractMathExpressionFromMessage(dto.message);
        if (!expression) {
          return {
            message: 'Ik begrijp de berekening niet. Probeer de som duidelijk te formuleren.',
          };
        }
        const precision = this.ensureNumber((params as any).precision);
        try {
          const evaluation = this.evaluateMathExpression(expression, precision);
          return {
            message: `Uitkomst: ${evaluation.formatted}`,
            result: evaluation,
          };
        } catch (error) {
          return {
            message: `De berekening is mislukt: ${this.humanizeError(error)}.`,
          };
        }
      }
      case 'file.summarize': {
        return {
          message: 'Upload je document in de app, dan maak ik binnenkort een samenvatting (stub).',
        };
      }
      default:
        return {
          message: 'Ik weet niet zeker wat je bedoelt. Kun je het anders formuleren?',
        };
    }
  }

  private ensureString(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }
    return undefined;
  }

  private ensurePrimaryRecipient(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        const candidate = this.ensurePrimaryRecipient(entry);
        if (candidate) {
          return candidate;
        }
      }
    }
    return undefined;
  }

  private ensureStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }
    const cleaned = value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : undefined))
      .filter((entry): entry is string => !!entry);
    return cleaned.length ? cleaned : undefined;
  }

  private ensureNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      if (!normalized.length) {
        return undefined;
      }
      const parsed = Number.parseFloat(normalized);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }

  private normalizeRecipientList(value: unknown): string[] | undefined {
    if (typeof value === 'string') {
      const segments = value
        .split(/[,;\n]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length);
      return segments.length ? segments : undefined;
    }
    if (!Array.isArray(value)) {
      return undefined;
    }
    const cleaned = value
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry.trim();
        }
        if (entry && typeof entry === 'object' && typeof (entry as any).email === 'string') {
          return (entry as any).email.trim();
        }
        return undefined;
      })
      .filter((entry): entry is string => !!entry);
    return cleaned.length ? cleaned : undefined;
  }

  private resolveEmailRouting(params: Record<string, unknown>, message: string): EmailRouting {
    const payload = params as Partial<SendEmailDto> & { recipients?: string[] | string };
    const to =
      this.ensureString(payload.to) ??
      this.ensurePrimaryRecipient(payload.recipients) ??
      this.ensureString((params as any).recipient) ??
      this.ensureString((params as any).email) ??
      this.normalizeRecipientList((params as any).to)?.[0] ??
      this.extractFirstEmail(message);
    const cc =
      this.normalizeRecipientList(payload.cc ?? (params as any).cc ?? (params as any).carbonCopy) ??
      undefined;
    const bcc =
      this.normalizeRecipientList(payload.bcc ?? (params as any).bcc ?? (params as any).blindCopy) ??
      undefined;
    return { to: to ?? undefined, cc, bcc };
  }

  private composeEmailTemplate(
    params: Record<string, unknown>,
    message: string,
    routing: EmailRouting,
  ): EmailTemplate {
    const tone = this.determineEmailTone(params, message);
    const subject =
      this.ensureString((params as any).subject ?? (params as any).title) ??
      this.resolveEmailSubject(message);
    const rawBodyCandidate =
      this.ensureString((params as any).body ?? (params as any).content) ??
      this.sanitizeEmailCommandBody(message);
    const rawBody = rawBodyCandidate ?? 'Vul hier je boodschap in.';

    const greeting = this.buildEmailGreeting(routing.to, tone);
    const closing = this.buildEmailClosing(tone);
    const signature = '[Jouw naam]';
    const normalizedBody = this.ensureSentenceCase(rawBody);
    const keyPoints = this.deriveKeyPoints(normalizedBody);
    const summary = keyPoints[0] ?? normalizedBody.slice(0, 120);

    const body = [greeting, '', normalizedBody, '', closing, signature].join('\n');

    return {
      subject: this.capitalize(subject),
      body,
      greeting,
      closing,
      signature,
      tone,
      summary,
      keyPoints,
      placeholders: {
        signature: '[Jouw naam]',
      },
    };
  }

  private sanitizeEmailCommandBody(message: string): string | undefined {
    const stripped = this.stripCommandPhrases(message);
    if (!stripped) {
      return undefined;
    }
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi;
    let cleaned = stripped
      .replace(emailRegex, '')
      .replace(/["“”]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    cleaned = cleaned.replace(/^(?:naar|aan)\s+/i, '').trim();

    if (!cleaned.length) {
      return undefined;
    }
    // Als er alleen een heel korte restzin overblijft (<5 tekens), neem deze niet over
    if (cleaned.length < 5) {
      return undefined;
    }
    return cleaned;
  }

  private determineEmailTone(params: Record<string, unknown>, message: string): EmailTemplate['tone'] {
    const direct = this.ensureString((params as any).tone ?? (params as any).style);
    if (direct) {
      if (/forma|zakel/i.test(direct)) {
        return 'formeel';
      }
      if (/inform|vriend|casu|kort/i.test(direct)) {
        return 'informeel';
      }
    }
    if (/formeel|zakelijk/.test(message.toLowerCase())) {
      return 'formeel';
    }
    if (/informeel|kort|vriendelijk|casual/.test(message.toLowerCase())) {
      return 'informeel';
    }
    return 'neutraal';
  }

  private resolveEmailSubject(message: string): string {
    const subjectMatch = message.match(/onderwerp\s*[:\-]\s*(.+)$/i);
    if (subjectMatch?.[1]) {
      return subjectMatch[1].trim();
    }
    const cleaned = this.stripCommandPhrases(message);
    const candidate = cleaned.split(/[.!?\n]/).map((part) => part.trim()).find((part) => part.length);
    if (candidate) {
      return candidate;
    }
    return 'Bericht';
  }

  private buildEmailGreeting(to: string | undefined, tone: EmailTemplate['tone']): string {
    const name = to ? this.deriveDisplayNameFromEmail(to) : undefined;
    if (tone === 'formeel') {
      return name ? `Geachte ${name},` : 'Geachte heer/mevrouw,';
    }
    if (tone === 'informeel') {
      return name ? `Hoi ${name},` : 'Hoi,';
    }
    return name ? `Beste ${name},` : 'Beste,';
  }

  private buildEmailClosing(tone: EmailTemplate['tone']): string {
    if (tone === 'formeel') {
      return 'Met vriendelijke groet,';
    }
    if (tone === 'informeel') {
      return 'Groetjes,';
    }
    return 'Met vriendelijke groet,';
  }

  private deriveKeyPoints(content: string): string[] {
    return content
      .split(/[\n•\-]+/)
      .map((entry) => entry.replace(/^[•\-]\s*/, '').trim())
      .filter((entry) => entry.length)
      .slice(0, 5);
  }

  private ensureSentenceCase(value: string): string {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return value;
    }
    const first = trimmed.charAt(0).toUpperCase();
    return `${first}${trimmed.substring(1)}`;
  }

  private deriveDisplayNameFromEmail(address: string): string | undefined {
    const trimmed = address.trim();
    if (!trimmed.includes('@')) {
      return this.capitalize(trimmed);
    }
    const localPart = trimmed.split('@')[0]!;
    const cleaned = localPart.replace(/[\._]/g, ' ').replace(/\d+/g, ' ').trim();
    if (!cleaned.length) {
      return undefined;
    }
    return cleaned
      .split(' ')
      .filter((part) => part.length)
      .map((part) => this.capitalize(part))
      .join(' ');
  }

  private resolveTaskText(params: Record<string, unknown>, message: string): string | undefined {
    const payload = params as Partial<CreateTaskDto>;
    const direct = this.ensureString(payload.text);
    if (direct) {
      const cleaned = this.cleanTaskDescription(direct);
      if (cleaned) {
        return cleaned;
      }
    }
    const fallback = this.cleanTaskDescription(message);
    return fallback ?? direct ?? undefined;
  }

  private resolveReminderDescription(
    params: Record<string, unknown>,
    message: string,
  ): string | undefined {
    const candidateOrder = [
      this.ensureString((params as any).description),
      this.ensureString((params as any).summary),
      this.ensureString((params as any).text),
      this.ensureString((params as any).title),
      this.ensureString((params as any).name),
    ];

    for (const candidate of candidateOrder) {
      if (candidate) {
        const cleaned = this.cleanReminderDescription(candidate);
        if (cleaned) {
          return cleaned;
        }
      }
    }

    const inferred = this.extractReminderDescriptionFromMessage(message);
    return inferred ? this.cleanReminderDescription(inferred) ?? inferred : undefined;
  }

  private resolveReminderDateTime(params: Record<string, unknown>, message: string): Date | undefined {
    const payload = params as any;
    const direct = this.resolveDate(payload.dateTime ?? payload.datetime ?? payload.remindAt);
    if (direct) {
      return direct;
    }

    const datePart = this.ensureString(payload.date ?? payload.day);
    const timePart =
      this.ensureString(payload.time ?? payload.hour ?? payload.timeOfDay) ?? undefined;

    if (datePart) {
      const base = this.resolveDate(datePart);
      if (!base) {
        return undefined;
      }
      if (timePart) {
        const parsedTime = this.parseTimeString(timePart);
        if (parsedTime) {
          base.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
        }
      }
      return base;
    }

    if (timePart) {
      const parsedTime = this.parseTimeString(timePart);
      if (!parsedTime) {
        return undefined;
      }
      const now = new Date();
      const candidate = new Date(now);
      candidate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
      if (candidate <= now) {
        candidate.setDate(candidate.getDate() + 1);
      }
      return candidate;
    }

    const extractedDate = this.extractDateFromMessage(message);
    const extractedTime = this.extractTimeFromMessage(message);
    if (extractedDate) {
      if (extractedTime) {
        extractedDate.setHours(extractedTime.hours, extractedTime.minutes, 0, 0);
      }
      return extractedDate;
    }

    return undefined;
  }

  private parseTimeString(value: string): { hours: number; minutes: number } | undefined {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,2})(?::|\.|u)?(\d{2})?$/i);
    if (!match) {
      return undefined;
    }
    const hours = Number.parseInt(match[1]!, 10);
    const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
    if (Number.isNaN(hours) || hours < 0 || hours > 23) {
      return undefined;
    }
    if (Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
      return undefined;
    }
    return { hours, minutes };
  }

  private extractReminderDescriptionFromMessage(message: string): string | undefined {
    const trimmed = message.trim();
    if (!trimmed) {
      return undefined;
    }
    const patterns = [
      /herinner\s+me\s+(?:eraan\s+)?(?:om\s+|over\s+|aan\s+)?(.+)/i,
      /maak\s+(?:een\s+)?reminder\s+(?:aan\s+)?(?:voor|om)\s+(.+)/i,
      /zet\s+(.+?)\s+als\s+reminder/i,
      /plan\s+(?:een\s+)?herinnering\s+(?:voor|om)\s+(.+)/i,
    ];
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
    if (trimmed.toLowerCase().startsWith('reminder')) {
      return trimmed.substring('reminder'.length).trim();
    }
    return trimmed;
  }

  private cleanReminderDescription(raw: string): string | undefined {
    let result = raw.trim();
    if (!result) {
      return undefined;
    }

    result = result.replace(/^herinner\s+me\s+(?:eraan\s+)?(?:om\s+|over\s+|aan\s+)?/i, '');
    result = result.replace(/^maak\s+(?:een\s+)?reminder\s+(?:aan\s+)?(?:voor|om)\s+/i, '');
    result = result.replace(/^zet\s+(?:een\s+)?reminder\s*(?:aan\s*)?(?:voor|om)\s+/i, '');
    result = result.replace(/^reminder\s*[:,\-]?\s*/i, '');

    result = result.replace(/\b(?:om|at)\b\s+\d{1,2}(?::\d{2})?(?:\s*(?:uur|u|am|pm))?/gi, ' ');
    result = result.replace(/\b\d{1,2}[:.]\d{2}\b/gi, ' ');
    result = result.replace(/\b\d{1,2}\s*(?:uur|u)\b/gi, ' ');
    result = result.replace(/^(?:morgen|vandaag|overmorgen)\b[\s,]*/i, '');
    result = result.replace(/\b(?:en\s+)?zet\s+(?:het\s+)?in\s+de\s+agenda\b.*$/i, ' ');
    result = result.replace(/\bplaats\s+(?:het\s+)?in\s+de\s+agenda\b.*$/i, ' ');
    result = result.replace(/\bvoeg\s+(?:het\s+)?toe\s+aan\s+de\s+agenda\b.*$/i, ' ');

    const trailing = result.match(/\b(?:voor|om|over|aan)\s+(.+)/i);
    if (trailing?.[1]) {
      const candidate = trailing[1].trim();
      if (candidate && !/^(?:morgen|vandaag|overmorgen)\b/i.test(candidate)) {
        result = candidate;
      }
    }

    result = result.replace(/\been\s+reminder\b/gi, ' ');
    result = result.replace(/\breminder\b/gi, ' ');
    result = result.replace(/\bherinnering\b/gi, ' ');

    const colonIndex = result.indexOf(':');
    if (colonIndex !== -1) {
      const before = result.substring(0, colonIndex).toLowerCase();
      const after = result.substring(colonIndex + 1).trim();
      if (
        after.length &&
        (/\bagenda\b/.test(before) ||
          /\bkalender\b/.test(before) ||
          /\breminder\b/.test(before) ||
          /\bzet\b/.test(before) ||
          /\bmaak\b/.test(before))
      ) {
        result = after;
      }
    }

    result = result.replace(/\s{2,}/g, ' ').trim();
    result = result.replace(/^[,.\-\s]+|[,.\-\s]+$/g, '');

    return result.length ? result : undefined;
  }

  private parseFlexibleDate(raw: string): Date {
    const trimmed = raw.trim();
    const isoCandidate = new Date(trimmed);
    if (!Number.isNaN(isoCandidate.getTime())) {
      return isoCandidate;
    }

    const european = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
    if (european) {
      const day = Number.parseInt(european[1]!, 10);
      const month = Number.parseInt(european[2]!, 10);
      let year = european[3] ? Number.parseInt(european[3]!, 10) : new Date().getFullYear();
      if (year < 100) {
        year += 2000;
      }
      return new Date(year, month - 1, day);
    }

    return new Date(Number.NaN);
  }

  private extractDateFromMessage(message: string): Date | undefined {
    const lowered = message.toLowerCase();
    if (/\bovermorgen\b/.test(lowered)) {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      return date;
    }
    if (/\bmorgen\b/.test(lowered)) {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date;
    }
    if (/\bvandaag\b/.test(lowered)) {
      return new Date();
    }

    const match = message.match(/(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/);
    if (match) {
      const parsed = this.parseFlexibleDate(match[1]!);
      if (!Number.isNaN(parsed.getTime())) {
        if (!match[1]!.match(/\d{4}$/) && parsed < new Date()) {
          parsed.setFullYear(parsed.getFullYear() + 1);
        }
        return parsed;
      }
    }
    return undefined;
  }

  private resolveReservationPayload(
    params: Record<string, unknown>,
    message: string,
  ): ReservationRequest | undefined {
    const payload = params as any;
    const duration =
      this.ensureNumber(
        payload.durationMinutes ??
          payload.duration ??
          payload.lengthMinutes ??
          payload.length ??
          payload.minutes,
      ) ?? 60;

    const window = this.resolveReservationWindow(payload, message, duration);
    if (!window) {
      return undefined;
    }

    const attendees = this.extractAttendeeList(
      payload.attendees ?? payload.participants ?? payload.invitees,
    );

    const capacity =
      this.ensureNumber(
        payload.capacity ?? payload.attendeeCount ?? payload.headcount ?? payload.seats,
      ) ?? (attendees?.length ? attendees.length : undefined);

    const preferredRoom =
      this.ensureString(
        payload.roomLabel ?? payload.room ?? payload.space ?? payload.location ?? payload.roomName,
      ) ?? this.extractRoomNameFromMessage(message);

    const title =
      this.ensureString(payload.title ?? payload.summary ?? payload.subject) ??
      this.deriveReservationTitle(message, preferredRoom);

    const description =
      this.ensureString(payload.description ?? payload.notes ?? payload.agenda ?? payload.purpose) ??
      this.stripCommandPhrases(message);

    return {
      start: window.start,
      end: window.end,
      preferredRoom: preferredRoom ?? undefined,
      title,
      description: description ?? undefined,
      attendees: attendees ?? undefined,
      capacity: capacity ? Math.max(1, Math.round(capacity)) : undefined,
      notes: this.ensureString(payload.notes) ?? undefined,
    };
  }

  private resolveReservationWindow(
    payload: Record<string, unknown>,
    message: string,
    durationMinutes: number,
  ): { start: Date; end: Date } | undefined {
    const candidates = [
      this.resolveDate(payload.dateTime ?? payload.datetime ?? payload.start ?? payload.startAt),
      this.resolveDate(payload.begin ?? payload.from ?? payload.startTime),
    ].filter((value): value is Date => !!value);

    let start = candidates.length ? candidates[0] : undefined;
    if (!start) {
      const date = this.ensureString(payload.date ?? payload.day);
      const time = this.ensureString(payload.time ?? payload.startTime ?? payload.hour);
      if (date || time) {
        start = this.combineDateAndTime(
          date ?? this.formatDate(new Date()),
          time ?? this.formatTime(this.addMinutes(new Date(), 15)),
        );
      }
    }

    if (!start) {
      const derived = this.determineEventDateTime(
        {
          date: this.ensureString(payload.date ?? payload.day),
          time: this.ensureString(payload.time ?? payload.startTime ?? payload.hour),
          datetime: this.ensureString(payload.datetime ?? payload.dateTime),
        },
        message,
      );
      start = this.combineDateAndTime(derived.date, derived.time);
    }

    if (!start) {
      return undefined;
    }

    const now = new Date();
    if (start < now) {
      const adjusted = new Date(now);
      adjusted.setMinutes(adjusted.getMinutes() + 5);
      start = adjusted;
    }

    let end =
      this.resolveDate(payload.end ?? payload.endAt ?? payload.until ?? payload.finish) ??
      this.addMinutes(new Date(start), Math.max(15, durationMinutes));

    if (end <= start) {
      end = this.addMinutes(new Date(start), Math.max(15, durationMinutes));
    }

    return { start, end };
  }

  private combineDateAndTime(date: string, time?: string): Date {
    const normalizedDate = date?.trim();
    const normalizedTime = time?.trim();
    if (normalizedDate) {
      const isoCandidate = normalizedTime
        ? `${normalizedDate}T${normalizedTime.length === 5 ? `${normalizedTime}:00` : normalizedTime}`
        : normalizedDate;
      const parsed = new Date(isoCandidate);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    const fallback = new Date();
    if (normalizedTime) {
      const parsedTime = this.parseTimeString(normalizedTime);
      if (parsedTime) {
        fallback.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
      }
    }
    return fallback;
  }

  private extractAttendeeList(value: unknown): string[] | undefined {
    const normalized = this.normalizeRecipientList(value);
    if (normalized?.length) {
      return normalized;
    }
    return undefined;
  }

  private extractRoomNameFromMessage(message: string): string | undefined {
    const match =
      message.match(/\b(?:vergaderruimte|ruimte|zaal|meeting room)\s*([a-z0-9\- ]{1,30})/i) ??
      message.match(/\bin\s+(ruimte|zaal)\s+([a-z0-9\- ]{1,30})/i);
    if (match) {
      const candidate = match[2] ?? match[1];
      if (candidate) {
        return candidate.trim();
      }
    }
    const shortMatch = message.match(/\b(?:ruimte|zaal)\s*([A-Z])\b/);
    if (shortMatch?.[1]) {
      return `Ruimte ${shortMatch[1]}`;
    }
    return undefined;
  }

  private deriveReservationTitle(message: string, preferredRoom?: string | null): string {
    const cleaned = this.stripCommandPhrases(message);
    const firstSentence = cleaned.split(/[.!?\n]/).map((part) => part.trim()).find((part) => part.length);
    if (firstSentence && firstSentence.length > 3) {
      return this.capitalize(firstSentence.slice(0, 90));
    }
    if (preferredRoom) {
      return `Vergadering in ${this.capitalize(preferredRoom)}`;
    }
    return 'Vergadering';
  }

  private stripCommandPhrases(message: string): string {
    let result = message.trim();
    const commandPattern =
      /^(schrijf|maak|stel|genereer)\s+(?:een\s+)?(?:[a-zà-ÿ]+\s+){0,4}?(?:mail|e-?mail|bericht|vergadering|meeting)\b/i;
    result = result.replace(commandPattern, '');
    result = result.replace(
      /^(?:naar|aan)\s+[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b[,:\s]*/i,
      '',
    );
    result = result.replace(/^(?:een\s+)?(?:zakelijke|professionele|formele)\s+(mail|e-?mail|email)\b/i, '');
    result = result.replace(
      /^(plan|reserveer|boek)\s+(?:een\s+)?(?:ruimte|vergadering|meeting)\s*(?:voor|op)?\s*/i,
      '',
    );
    if (result.includes(':')) {
      const afterColon = result.split(':').slice(1).join(':').trim();
      if (afterColon.length) {
        result = afterColon;
      }
    }
    return result.trim();
  }

  private extractTimeFromMessage(message: string): { hours: number; minutes: number } | undefined {
    const hhmm = message.match(/(\d{1,2})(?::|\.)(\d{2})/);
    if (hhmm) {
      const hours = Number.parseInt(hhmm[1]!, 10);
      const minutes = Number.parseInt(hhmm[2]!, 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return { hours, minutes };
      }
    }
    const hourOnly = message.match(/(\d{1,2})\s*(?:uur|u)\b/i);
    if (hourOnly) {
      const hours = Number.parseInt(hourOnly[1]!, 10);
      if (hours >= 0 && hours <= 23) {
        return { hours, minutes: 0 };
      }
    }
    return undefined;
  }

  private cleanTaskDescription(raw: string): string | undefined {
    let result = raw.trim();
    if (!result) {
      return undefined;
    }

    result = result.replace(
      /^(?:maak|zet|voeg|toevoegen|creer|creeer)\s+(?:een\s+)?(?:taak|todo)\s*(?:aan|voor|om)?\s*/i,
      '',
    );
    result = result.replace(/^herinner\s+me\s+aan\s+/i, '');
    result = result.replace(/^ik\s+moet\s+/i, '');
    result = result.replace(/\b(?:als\s+taak|op\s+de\s+todo)\b.*$/i, '');

    const colonIndex = result.indexOf(':');
    if (colonIndex !== -1) {
      const before = result.substring(0, colonIndex).toLowerCase();
      const after = result.substring(colonIndex + 1).trim();
      if (
        after.length &&
        (/\bagenda\b/.test(before) ||
          /\bkalender\b/.test(before) ||
          /\btaak\b/.test(before) ||
          /\btodo\b/.test(before))
      ) {
        result = after;
      }
    }

    result = result.replace(/\s{2,}/g, ' ').trim();
    result = result.replace(/^[,.\-\s]+|[,.\-\s]+$/g, '');

    return result.length ? result : undefined;
  }

  private shouldCreateCalendarEvent(params: Record<string, unknown>, message: string): boolean {
    const bag = params as any;
    const candidate = bag?.calendar ?? bag?.createCalendarEvent;
    if (typeof candidate === 'boolean') {
      return candidate;
    }
    if (typeof candidate === 'string') {
      const lowered = candidate.toLowerCase();
      if (lowered === 'true') return true;
      if (lowered === 'false') return false;
    }

    const haystack = `${JSON.stringify(params)} ${message}`.toLowerCase();
    if (/\bgeen\s+agenda\b/.test(haystack) || /\bniet\s+in\s+de\s+agenda\b/.test(haystack)) {
      return false;
    }
    return /\bagenda\b|\bkalender\b|\bcalendar\b/.test(haystack);
  }

  private humanizeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  private determineEventDateTime(
    payload: Partial<CreateCalendarEventDto> & { datetime?: string },
    _message: string,
  ): { date: string; time?: string } {
    const explicitDate = this.ensureString(payload.date);
    const explicitTime = this.ensureString(payload.time);
    if (explicitDate) {
      return {
        date: this.normalizeDateString(explicitDate) ?? this.formatDate(new Date()),
        time: explicitTime ? this.normalizeTimeString(explicitTime) : undefined,
      };
    }

    const dateTimeCandidate = this.ensureString(payload.datetime);
    const parsed = this.resolveDate(dateTimeCandidate);
    if (parsed) {
      return {
        date: this.formatDate(parsed),
        time: this.formatTime(parsed),
      };
    }

    const fallback = new Date();
    fallback.setMinutes(fallback.getMinutes() + 5);
    return {
      date: this.formatDate(fallback),
      time: this.formatTime(fallback),
    };
  }

  private resolveDate(value: unknown): Date | undefined {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = this.parseFlexibleDate(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return undefined;
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  private normalizeDateString(value: string): string | undefined {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = this.parseFlexibleDate(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return this.formatDate(parsed);
    }
    return undefined;
  }

  private normalizeTimeString(value: string): string | undefined {
    const trimmed = value.trim();
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = this.resolveDate(trimmed);
    if (parsed) {
      return this.formatTime(parsed);
    }
    return undefined;
  }

  private extractFirstEmail(raw: unknown): string | undefined {
    if (typeof raw !== 'string') {
      return undefined;
    }
    const match = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match ? match[0].trim() : undefined;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]!;
  }

  private formatTime(date: Date): string {
    return date.toISOString().substring(11, 16);
  }

  private normalizeGroceryItems(items: unknown[]): GroceryListItem[] {
    return items
      .map((item) => {
        if (typeof item === 'string') {
          return { name: item, quantity: '1' };
        }
        if (item && typeof item === 'object') {
          const name = this.ensureString((item as any).name ?? (item as any).item);
          const quantity = this.ensureString((item as any).quantity ?? (item as any).amount) ?? '1';
          if (name) {
            return { name, quantity };
          }
        }
        return undefined;
      })
      .filter((entry): entry is GroceryListItem => !!entry);
  }

  private generateDefaultGroceryList(message: string): GroceryListItem[] {
    const defaults: GroceryListItem[] = [
      { name: 'Groentenmix', quantity: '2 zakken' },
      { name: 'Kipfilet', quantity: '500g' },
      { name: 'Volkoren pasta', quantity: '1 pak' },
      { name: 'Fruit (bananen, appels)', quantity: '8 stuks' },
      { name: 'Havermelk', quantity: '2 liter' },
    ];
    if (message.toLowerCase().includes('gezond')) {
      defaults.push({ name: 'Notenmix', quantity: '1 zak' });
      defaults.push({ name: 'Griekse yoghurt', quantity: '1 kg' });
    }
    return defaults;
  }

  private extractMathExpressionFromMessage(message: string): string | undefined {
    const cleaned = this.stripCommandPhrases(message);
    const candidate = cleaned
      .replace(/[^0-9+\-*/().,^%\s]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (!candidate || !/[0-9]/.test(candidate)) {
      return undefined;
    }
    return candidate;
  }

  private evaluateMathExpression(
    expression: string,
    precision?: number,
  ): {
    originalExpression: string;
    sanitizedExpression: string;
    result: number;
    formatted: string;
    precision: number;
  } {
    const sanitized = this.sanitizeMathExpression(expression);
    if (!sanitized) {
      throw new Error('Ongeldige rekensom.');
    }
    if (!this.areParenthesesBalanced(sanitized)) {
      throw new Error('Haakjes kloppen niet.');
    }
    let rawResult: unknown;
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`\"use strict\"; return (${sanitized});`);
      rawResult = fn();
    } catch (error) {
      throw new Error('De expressie kon niet worden berekend.');
    }
    if (typeof rawResult !== 'number' || !Number.isFinite(rawResult)) {
      throw new Error('Resultaat is geen geldig getal.');
    }
    const resolvedPrecision =
      typeof precision === 'number' && Number.isFinite(precision) && precision >= 0
        ? Math.min(10, Math.floor(precision))
        : Number.isInteger(rawResult)
          ? 0
          : 2;
    const factor = 10 ** resolvedPrecision;
    const rounded = Math.round((rawResult + Number.EPSILON) * factor) / factor;
    const formatted =
      resolvedPrecision > 0 ? rounded.toFixed(resolvedPrecision) : rounded.toString();
    return {
      originalExpression: expression.trim(),
      sanitizedExpression: sanitized,
      result: rounded,
      formatted,
      precision: resolvedPrecision,
    };
  }

  private sanitizeMathExpression(expression: string): string | undefined {
    let sanitized = expression.trim();
    if (!sanitized) {
      return undefined;
    }
    sanitized = sanitized.replace(/,/g, '.');
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    sanitized = sanitized.replace(/\^/g, '**');
    sanitized = sanitized.replace(/\s+/g, ' ');
    sanitized = sanitized.replace(/([+\-*/])\s+([+\-*/])/g, '$1$2');
    if (!/^[0-9+\-*/().\s*]+$/.test(sanitized)) {
      return undefined;
    }
    return sanitized;
  }

  private areParenthesesBalanced(expression: string): boolean {
    let balance = 0;
    for (const char of expression) {
      if (char === '(') balance += 1;
      if (char === ')') balance -= 1;
      if (balance < 0) {
        return false;
      }
    }
    return balance === 0;
  }

  private capitalize(value: string): string {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return '';
    }
    return trimmed.charAt(0).toUpperCase() + trimmed.substring(1);
  }
}
