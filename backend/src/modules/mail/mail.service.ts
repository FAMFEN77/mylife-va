import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BrandService } from '../../common/brand/brand.service';

export type SendMailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly enabled: boolean;
  private readonly apiKey: string | null;
  private readonly domain: string | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly brandService: BrandService,
  ) {
    const apiKey =
      this.configService.get<string>('MAILGUN_API_KEY') ??
      this.configService.get<string>('mail.mailgun.apiKey');
    const domain =
      this.configService.get<string>('MAILGUN_DOMAIN') ??
      this.configService.get<string>('mail.mailgun.domain');

    this.enabled = Boolean(apiKey && domain);
    this.apiKey = apiKey ?? null;
    this.domain = domain ?? null;

    if (!this.enabled) {
      this.logger.warn(
        'Mailgun configuratie ontbreekt. E-mails worden niet verzonden tot MAILGUN_API_KEY en MAILGUN_DOMAIN zijn ingesteld.',
      );
    }
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.enabled || !this.apiKey || !this.domain) {
      this.logger.warn('[Mailgun disabled] Email not sent, but request succeeded');
      return;
    }

    const from =
      options.from ??
      this.configService.get<string>('MAIL_FROM') ??
      this.configService.get<string>('mail.from') ??
      this.brandService.mailFrom;

    const url = `https://api.mailgun.net/v3/${this.domain}/messages`;
    const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');

    const params = new URLSearchParams();
    params.append('from', from);
    params.append('to', options.to);
    params.append('subject', options.subject);
    if (options.text) {
      params.append('text', options.text);
    }
    if (options.html) {
      params.append('html', options.html);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const info = await response.text();
      this.logger.error(`Mailgun versturen mislukt (${response.status}): ${info}`);
      throw new InternalServerErrorException('Kon e-mail niet verzenden.');
    }
  }

  async sendPasswordReset(email: string, resetLink: string): Promise<void> {
    const brand = this.brandService.appName;
    const subject = `Reset je ${brand} wachtwoord`;
    const text = [
      'Hallo,',
      '',
      'We hebben een verzoek ontvangen om je wachtwoord te resetten.',
      `Gebruik onderstaande link om een nieuw wachtwoord in te stellen:`,
      resetLink,
      '',
      'Deze link verloopt automatisch. Heb jij dit niet aangevraagd? Negeer dan deze e-mail.',
      '',
      'Groet,',
      `Het ${brand} team`,
    ].join('\n');

    const html = `
      <p>Hallo,</p>
      <p>We hebben een verzoek ontvangen om je wachtwoord te resetten.</p>
      <p><a href="${resetLink}" target="_blank" rel="noopener">Klik hier om een nieuw wachtwoord in te stellen</a>.</p>
      <p>Deze link verloopt automatisch. Heb jij dit niet aangevraagd? Negeer dan deze e-mail.</p>
      <p>Groet,<br />Het ${brand} team</p>
    `;

    await this.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }

  async sendReminderNotification(
    email: string,
    payload: { text: string; remindAt: Date },
  ): Promise<void> {
    const brand = this.brandService.appName;
    const subject = `Herinnering van ${brand}`;
    const date = payload.remindAt.toLocaleString();
    const text = [
      'Hoi,',
      '',
      'Dit is je reminder:',
      payload.text,
      '',
      `Gepland voor: ${date}`,
      '',
      'Veel succes!',
      brand,
    ].join('\n');

    const html = `
      <p>Hoi,</p>
      <p>Dit is je reminder:</p>
      <p><strong>${payload.text}</strong></p>
      <p>Gepland voor: <strong>${date}</strong></p>
      <p>Veel succes!<br/>${brand}</p>
    `;

    await this.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }
}
