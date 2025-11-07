import { BadRequestException, Body, Controller, Headers, HttpCode, Post, Req, UseGuards, RawBodyRequest } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-session')
  async createCheckoutSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    const session = await this.billingService.createCheckoutSession(user.sub, dto);
    return { url: session.url, sessionId: session.sessionId };
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | string[] | undefined,
  ): Promise<{ received: true }> {
    const rawBody = req.rawBody ?? (req as unknown as { body?: Buffer }).body;
    if (!rawBody) {
      throw new BadRequestException('Lege webhook payload ontvangen.');
    }
    const buffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    await this.billingService.processWebhook(buffer, signature);
    return { received: true };
  }
}
