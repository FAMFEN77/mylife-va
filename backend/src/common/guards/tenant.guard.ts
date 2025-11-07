import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { PrismaService } from '../database/prisma.service';
import { JwtPayload } from '../decorators/current-user.decorator';

type TenantAwareRequest = Request & {
  user?: JwtPayload;
  organisationId?: string;
};

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantAwareRequest>();
    const user = request.user;
    if (!user) {
      return false;
    }

    if (user.organisationId) {
      request.organisationId = user.organisationId;
      return true;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { organisationId: true },
    });

    if (!dbUser?.organisationId) {
      throw new ForbiddenException('Geen toegang tot organisatie.');
    }

    user.organisationId = dbUser.organisationId;
    request.organisationId = dbUser.organisationId;
    return true;
  }
}
