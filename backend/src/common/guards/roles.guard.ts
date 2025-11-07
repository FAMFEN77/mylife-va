import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (!requiredRoles.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;
    if (!user) {
      return false;
    }
    return requiredRoles.includes(user.role as UserRole);
  }
}
