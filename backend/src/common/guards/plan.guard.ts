import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Type, mixin } from '@nestjs/common';
import { Request } from 'express';
import { PlanType } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { JwtPayload } from '../decorators/current-user.decorator';

const PLAN_PRIORITY: Record<PlanType, number> = {
  STARTER: 0,
  PRO: 1,
  ENTERPRISE: 2,
};

export function PlanGuard(requiredPlan: PlanType): Type<CanActivate> {
  @Injectable()
  class PlanGuardMixin implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
      const user = request.user;
      if (!user) {
        return false;
      }

      const organisation = await this.prisma.organisation.findFirst({
        where: {
          users: {
            some: { id: user.sub },
          },
        },
        select: { plan: true, id: true },
      });
      if (!organisation) {
        throw new ForbiddenException('Geen toegang tot deze organisatie.');
      }

      return PLAN_PRIORITY[organisation.plan] >= PLAN_PRIORITY[requiredPlan];
    }
  }

  return mixin(PlanGuardMixin);
}
