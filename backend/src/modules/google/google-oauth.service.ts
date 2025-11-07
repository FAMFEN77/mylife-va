import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../common/database/prisma.service';
import type { GoogleAccount } from '@prisma/client';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

type OAuthStatePayload = {
  userId: string;
  redirectUri?: string;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expires_in?: number;
  expiry_date?: number;
};

@Injectable()
export class GoogleOAuthService {
  private readonly scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  generateAuthorizationUrl(userId: string, redirectUri?: string): string {
    const clientId = this.requireClientId();
    const callback = this.requireRedirectUri();

    // DEBUG
    console.log('[Google OAuth] client', clientId);
    console.log('[Google OAuth] redirect', callback);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: callback,
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
      scope: this.scopes.join(' '),
      state: this.encodeState({ userId, redirectUri }),
    });

    const url = `${GOOGLE_AUTH_URL}?${params.toString()}`;

    // EXTRA DEBUG — hiermee weten we 100% welke URL Google krijgt
    console.log('[Google OAuth] AUTH URL:', url);

    return url;
  }

  async handleOAuthCallback(code?: string, state?: string): Promise<{ redirectUri?: string }> {
    if (!code) {
      throw new BadRequestException('OAuth code ontbreekt.');
    }
    const decoded = this.decodeState(state);
    if (!decoded?.userId) {
      throw new BadRequestException('State is ongeldig of verlopen.');
    }

    const tokens = await this.exchangeCode({
      code,
      redirectUri: this.requireRedirectUri(),
    });

    if (!tokens.access_token) {
      throw new InternalServerErrorException('Google gaf geen access token terug.');
    }

    await this.storeTokens(decoded.userId, tokens);

    return { redirectUri: decoded.redirectUri };
  }

  async ensureAccount(userId: string): Promise<GoogleAccount> {
    const account = await this.prisma.googleAccount.findUnique({
      where: { userId },
    });
    if (!account) {
      throw new UnauthorizedException('Geen Google-account gekoppeld. Verbind eerst via de instellingenpagina.');
    }
    return account;
  }

  async getStatus(userId: string): Promise<{ connected: boolean; expiresAt?: Date }> {
    const account = await this.prisma.googleAccount.findUnique({
      where: { userId },
      select: { expiryDate: true },
    });
    return {
      connected: !!account,
      expiresAt: account?.expiryDate ?? undefined,
    };
  }

  getDefaultSuccessRedirect(): string {
    return (
      this.configService.get<string>('GOOGLE_SUCCESS_REDIRECT') ??
      'http://localhost:4001/settings?google=connected'
    );
  }

  async getValidAccessToken(userId: string): Promise<{ accessToken: string; account: GoogleAccount }> {
    let account = await this.ensureAccount(userId);
    const now = Date.now();
    const expiresAt = account.expiryDate?.getTime() ?? 0;

    if (expiresAt - 60_000 > now) {
      return { accessToken: account.accessToken, account };
    }

    const refreshed = await this.refreshAccessToken(account);
    account = refreshed.account;
    return { accessToken: refreshed.accessToken, account };
  }

  private async exchangeCode(input: { code: string; redirectUri: string }): Promise<TokenResponse> {
    const body = new URLSearchParams({
      code: input.code,
      client_id: this.requireClientId(),
      client_secret: this.requireClientSecret(),
      redirect_uri: input.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Google token exchange mislukt: ${text}`);
    }

    return (await response.json()) as TokenResponse;
  }

  private async refreshAccessToken(account: GoogleAccount): Promise<{ accessToken: string; account: GoogleAccount }> {
    if (!account.refreshToken) {
      throw new UnauthorizedException('Google-account mist een refresh token. Verbind opnieuw.');
    }

    const body = new URLSearchParams({
      client_id: this.requireClientId(),
      client_secret: this.requireClientSecret(),
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new UnauthorizedException(`Kan Google-token niet vernieuwen: ${text}`);
    }

    const tokens = (await response.json()) as TokenResponse;
    if (!tokens.access_token) {
      throw new UnauthorizedException('Google gaf geen nieuw access token terug.');
    }

    const updated = await this.storeTokens(account.userId, {
      ...tokens,
      refresh_token: tokens.refresh_token ?? account.refreshToken,
    });

    return { accessToken: updated.accessToken, account: updated };
  }

  private async storeTokens(userId: string, tokens: TokenResponse): Promise<GoogleAccount> {
    const expiresInSeconds = tokens.expires_in;
    const expiryDate =
      tokens.expiry_date !== undefined
        ? new Date(tokens.expiry_date)
        : expiresInSeconds
        ? new Date(Date.now() + expiresInSeconds * 1000)
        : undefined;

    const existing = await this.prisma.googleAccount.findUnique({ where: { userId } });

    if (!existing && !tokens.refresh_token) {
      throw new UnauthorizedException(
        'Google leverde geen refresh token. Verwijder de app uit je Google-account en probeer opnieuw.',
      );
    }

    if (existing) {
      return this.prisma.googleAccount.update({
        where: { userId },
        data: {
          accessToken: tokens.access_token ?? existing.accessToken,
          refreshToken: tokens.refresh_token ?? existing.refreshToken,
          tokenType: tokens.token_type ?? existing.tokenType ?? undefined,
          scope: tokens.scope ?? existing.scope ?? undefined,
          expiryDate: expiryDate ?? existing.expiryDate ?? undefined,
        },
      });
    }

    return this.prisma.googleAccount.create({
      data: {
        userId,
        accessToken: tokens.access_token ?? '',
        refreshToken: tokens.refresh_token ?? '',
        tokenType: tokens.token_type ?? undefined,
        scope: tokens.scope ?? undefined,
        expiryDate,
      },
    });
  }

  private encodeState(payload: OAuthStatePayload): string {
    const json = JSON.stringify(payload);
    return Buffer.from(json, 'utf8').toString('base64url');
  }

  private decodeState(raw?: string): OAuthStatePayload | undefined {
    if (!raw) {
      return undefined;
    }
    try {
      const json = Buffer.from(raw, 'base64url').toString('utf8');
      const parsed = JSON.parse(json) as OAuthStatePayload;
      if (parsed && typeof parsed.userId === 'string') {
        return parsed;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private requireClientId(): string {
    const value = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!value) {
      throw new InternalServerErrorException('GOOGLE_CLIENT_ID ontbreekt in de configuratie.');
    }
    return value;
  }

  private requireClientSecret(): string {
    const value = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!value) {
      throw new InternalServerErrorException('GOOGLE_CLIENT_SECRET ontbreekt in de configuratie.');
    }
    return value;
  }

  private requireRedirectUri(): string {
    const value =
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ??
      'http://localhost:4000/api/v1/google/oauth/callback';
    return value;
  }
}
