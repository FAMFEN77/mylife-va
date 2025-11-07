import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../common/database/prisma.service';

type JwtRequestExtractor = (req: Request) => string | null;

interface JwtStrategyOptions {
  jwtFromRequest: JwtRequestExtractor;
  ignoreExpiration: boolean;
  secretOrKey: string;
}

const bearerTokenExtractor: JwtRequestExtractor = (req: Request) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly prisma: PrismaService) {
    const secret =
      configService.get<string>('app.auth.jwtSecret') ?? 'defaultSecret';

    const options: JwtStrategyOptions = {
      jwtFromRequest: bearerTokenExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(options);
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.role || !payload.organisationId) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { role: true, organisationId: true },
      });
      if (user) {
        payload.role = payload.role ?? user.role;
        payload.organisationId = payload.organisationId ?? user.organisationId ?? null;
      }
    }
    return payload;
  }
}
