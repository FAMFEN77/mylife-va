import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { GoogleOAuthService } from './google-oauth.service';
import { SendEmailDto } from './dto/send-email.dto';

const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

@Injectable()
export class GoogleMailService {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  async sendEmail(userId: string, dto: SendEmailDto) {
    const { accessToken } = await this.googleOAuthService.getValidAccessToken(userId);

    const payloadLines = [
      `To: ${dto.to}`,
      ...(dto.cc?.length ? [`Cc: ${dto.cc.join(', ')}`] : []),
      ...(dto.bcc?.length ? [`Bcc: ${dto.bcc.join(', ')}`] : []),
      `Subject: ${dto.subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      dto.body,
    ];

    const raw = Buffer.from(payloadLines.join('\r\n'), 'utf8').toString('base64url');

    const response = await fetch(GMAIL_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Kon e-mail niet versturen: ${text}`);
    }

    return (await response.json()) as {
      id: string;
      threadId?: string;
      labelIds?: string[];
    };
  }
}

