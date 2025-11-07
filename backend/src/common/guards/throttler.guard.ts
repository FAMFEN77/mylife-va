import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

interface RateBucket {
  count: number;
  windowStart: number;
}

/**
 * Minimal throttling guard die 5 requests per minuut per gebruiker/IP toestaat.
 * Hiermee vermijden we een extra dependency op @nestjs/throttler, terwijl de
 * interface in controllers gelijk blijft.
 */
@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly buckets = new Map<string, RateBucket>();
  private readonly limit = 5;
  private readonly windowMs = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const identity =
      this.resolveUserKey(request) ?? this.resolveIp(request) ?? 'anonymous';

    const now = Date.now();
    const bucket = this.buckets.get(identity);

    if (!bucket || now - bucket.windowStart > this.windowMs) {
      this.buckets.set(identity, { count: 1, windowStart: now });
      return true;
    }

    if (bucket.count >= this.limit) {
      throw new HttpException(
        `Te veel importverzoeken. Probeer het over ${Math.ceil(
          (this.windowMs - (now - bucket.windowStart)) / 1000,
        )} seconden opnieuw.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }

  private resolveUserKey(request: Request): string | null {
    const user = request.user as { id?: string } | undefined;
    if (user?.id) {
      return `user:${user.id}`;
    }
    return null;
  }

  private resolveIp(request: Request): string | null {
    const ip =
      request.ip ??
      (Array.isArray(request.ips) && request.ips.length > 0
        ? request.ips[0]
        : null);
    return ip ? `ip:${ip}` : null;
  }
}
