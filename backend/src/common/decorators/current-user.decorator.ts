import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  organisationId?: string | null;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    return request.user;
  },
);
