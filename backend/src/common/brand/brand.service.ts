import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BrandService {
  constructor(private readonly configService: ConfigService) {}

  get appName(): string {
    return this.configService.get<string>('APP_BRAND') ?? 'Taskee';
  }

  get shortName(): string {
    return this.configService.get<string>('APP_BRAND_SHORT') ?? this.appName;
  }

  get supportEmail(): string {
    return this.configService.get<string>('BRAND_SUPPORT_EMAIL') ?? 'support@taskee.app';
  }

  get websiteUrl(): string {
    return this.configService.get<string>('BRAND_WEBSITE_URL') ?? 'https://taskee.app';
  }

  get mailFrom(): string {
    return (
      this.configService.get<string>('MAIL_FROM') ??
      `${this.appName} <no-reply@${this.defaultMailDomain}>`
    );
  }

  private get defaultMailDomain(): string {
    try {
      const hostname = new URL(this.websiteUrl).hostname.replace(/^www\./, '');
      return hostname || 'taskee.app';
    } catch {
      return 'taskee.app';
    }
  }
}
