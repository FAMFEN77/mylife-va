import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { PlanType, User } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { MagicLinkRequestDto } from './dto/magic-link-request.dto';
import { MagicLinkVerifyDto } from './dto/magic-link-verify.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { AuthUserDto } from './dto/auth-user.dto';
import { RegisterPasswordDto } from './dto/register-password.dto';
import { LoginPasswordDto } from './dto/login-password.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { MailService } from '../mail/mail.service';

type UserRecord = User & {
  refreshTokenHash?: string | null;
  passwordHash?: string | null;
  organisation?: { id: string; plan: PlanType } | null;
};

type AuthUserSource = Pick<UserRecord, 'id' | 'email' | 'role' | 'organisationId'> & {
  organisation?: { id: string; plan: PlanType } | null;
};

const PASSWORD_SALT_ROUNDS = 12;
const REFRESH_TOKEN_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private get magicLinks() {
    return (this.prisma as unknown as { magicLink: any }).magicLink;
  }

  private get passwordResetTokens() {
    return (this.prisma as unknown as { passwordResetToken: any }).passwordResetToken;
  }

  async registerWithPassword(dto: RegisterPasswordDto): Promise<void> {
    const email = this.normalizeEmail(dto.email);

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('E-mailadres is al in gebruik.');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });
  }

  async loginWithPassword(dto: LoginPasswordDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organisation: {
          select: { id: true, plan: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Ongeldige inloggegevens.');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Ongeldige inloggegevens.');
    }

    const tokens = await this.generateTokens(this.mapToJwtPayload(user));
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(user, tokens);
  }

  async requestMagicLink(dto: MagicLinkRequestDto): Promise<void> {
    const user = await this.ensureUser(dto.email);
    await this.magicLinks.deleteMany({
      where: { userId: user.id },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = this.computeExpiryDate();

    await this.magicLinks.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });

    const callbackBaseUrl =
      this.configService.get<string>('app.auth.magicLinkCallbackUrl') ??
      'http://localhost:3000/auth/callback';
    const magicLinkUrl = `${callbackBaseUrl}?token=${token}`;

    // In deze fase loggen we de magic link naar de console i.p.v. een e-mail te sturen.
    // De daadwerkelijke mailtransporteur kan later worden toegevoegd.
    // eslint-disable-next-line no-console
    console.log(
      `Magic link voor ${user.email}: ${magicLinkUrl} (verloopt om ${expiresAt.toISOString()})`,
    );
  }

  async redeemMagicLink(dto: MagicLinkVerifyDto): Promise<AuthResponseDto> {
    const record = await this.magicLinks.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!record || !record.user) {
      throw new UnauthorizedException('Ongeldige of verlopen token.');
    }

    if (record.usedAt) {
      throw new UnauthorizedException('Token is al gebruikt.');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Token is verlopen.');
    }

    await this.magicLinks.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const user = record.user as UserRecord;

    const tokens = await this.generateTokens(this.mapToJwtPayload(user));
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(user, tokens);
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshSecret = this.getRefreshSecret();

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Ongeldige refresh token.');
    }

    const user = (await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        organisation: {
          select: { id: true, plan: true },
        },
      },
    })) as UserRecord | null;

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Ongeldige refresh token.');
    }

    const isValidRefresh = await bcrypt.compare(
      dto.refreshToken,
      user.refreshTokenHash,
    );

    if (!isValidRefresh) {
      throw new UnauthorizedException('Ongeldige refresh token.');
    }

    const tokens = await this.generateTokens(this.mapToJwtPayload(user));
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return this.buildAuthResponse(user, tokens);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: { refreshTokenHash: null } as any,
    });
  }

  async getProfile(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        organisationId: true,
        organisation: { select: { id: true, plan: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Gebruiker niet gevonden.');
    }

    return this.mapToAuthUser(user);
  }

  private async ensureUser(email: string): Promise<UserRecord> {
    const normalizedEmail = this.normalizeEmail(email);
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email: normalizedEmail },
      });
    }

    return user as UserRecord;
  }

  async requestPasswordReset(dto: PasswordResetRequestDto): Promise<void> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      // Prevent account enumeration; respond as if success.
      this.logger.debug(`Wachtwoordreset aangevraagd voor onbekend e-mailadres: ${email}`);
      return;
    }

    await this.passwordResetTokens.deleteMany({
      where: {
        expiresAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    await this.passwordResetTokens.deleteMany({
      where: { userId: user.id },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = this.computePasswordResetExpiry();

    await this.passwordResetTokens.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetBaseUrl =
      this.configService.get<string>('APP_AUTH_PASSWORD_RESET_URL') ??
      this.configService.get<string>('app.auth.passwordResetUrl') ??
      'http://localhost:3000/auth/reset';
    const resetLink = `${resetBaseUrl}?token=${token}`;

    try {
      await this.mailService.sendPasswordReset(user.email, resetLink);
    } catch (error) {
      this.logger.error(
        `Versturen wachtwoordreset e-mail mislukt voor ${user.email}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        'We konden de resetmail niet versturen. Probeer het later opnieuw.',
      );
    }
  }

  async resetPassword(dto: PasswordResetConfirmDto): Promise<void> {
    const record = await this.passwordResetTokens.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!record || !record.user) {
      throw new UnauthorizedException('Ongeldige of verlopen token.');
    }

    const now = new Date();
    if (record.usedAt) {
      throw new UnauthorizedException('Token is al gebruikt.');
    }
    if (record.expiresAt <= now) {
      throw new UnauthorizedException('Token is verlopen.');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        refreshTokenHash: null,
      } as any,
    });

    await this.passwordResetTokens.update({
      where: { id: record.id },
      data: { usedAt: now },
    });

    await this.passwordResetTokens.deleteMany({
      where: {
        userId: record.userId,
        usedAt: null,
        token: { not: record.token },
      },
    });
    this.logger.debug(`Wachtwoord reset voor gebruiker ${record.user.email}`);
  }

  private computeExpiryDate(): Date {
    const minutes =
      this.configService.get<number>('app.auth.magicLinkExpiryMinutes') ?? 15;
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    return expiresAt;
  }

  private computePasswordResetExpiry(): Date {
    const minutes =
      this.configService.get<number>('app.auth.passwordResetExpiryMinutes') ?? 60;
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      REFRESH_TOKEN_SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash } as any,
    });
  }

  private async generateTokens(payload: JwtPayload): Promise<TokenResponseDto> {
    const jwtExpiresRaw = this.configService.get<string>('app.auth.jwtExpiresIn');
    const refreshExpiresRaw = this.configService.get<string>(
      'app.auth.refreshExpiresIn',
    );
    const refreshSecret = this.getRefreshSecret();

    const jwtExpiresIn: StringValue | number = /^\d+$/.test(
      jwtExpiresRaw ?? '',
    )
      ? Number(jwtExpiresRaw)
      : ((jwtExpiresRaw ?? '1h') as StringValue);

    const refreshExpiresIn: StringValue | number = /^\d+$/.test(
      refreshExpiresRaw ?? '',
    )
      ? Number(refreshExpiresRaw)
      : ((refreshExpiresRaw ?? '7d') as StringValue);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: jwtExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: refreshExpiresIn,
        secret: refreshSecret,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private getRefreshSecret(): string {
    const secret =
      this.configService.get<string>('app.auth.refreshSecret') ??
      'defaultRefreshSecret';
    return secret;
  }

  private buildAuthResponse(user: UserRecord, tokens: TokenResponseDto): AuthResponseDto {
    const authUser = this.mapToAuthUser(user);
    const response = new AuthResponseDto();
    response.accessToken = tokens.accessToken;
    response.refreshToken = tokens.refreshToken;
    response.user = authUser;
    return response;
  }

  private mapToAuthUser(user: AuthUserSource): AuthUserDto {
    const dto = new AuthUserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.role = user.role;
    dto.organisationId = user.organisationId ?? null;
    dto.plan = user.organisation?.plan;
    return dto;
  }

  private mapToJwtPayload(
    user: Pick<UserRecord, 'id' | 'email' | 'role'> & { organisationId?: string | null },
  ): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      organisationId: user.organisationId ?? null,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}










