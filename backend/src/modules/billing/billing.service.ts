import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User } from '@prisma/client';
import Stripe from 'stripe';

import { PrismaService } from '../../common/database/prisma.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

type StripeEvent = Stripe.Event;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;
  private readonly webhookSecret?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!apiKey) {
      this.logger.warn('Stripe secret key ontbreekt; billing-functionaliteit is gedeactiveerd.');
      this.stripe = null;
      return;
    }

    this.stripe = new Stripe(apiKey);
  }

  async createCheckoutSession(
    userId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ url: string; sessionId: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is niet geconfigureerd.');
    }

    const priceId = this.configService.get<string>('STRIPE_PRICE_ID');
    if (!priceId) {
      throw new BadRequestException('STRIPE_PRICE_ID ontbreekt in configuratie.');
    }

    const successUrl =
      dto.successUrl ??
      this.configService.get<string>('STRIPE_SUCCESS_URL') ??
      'http://localhost:4001/billing/success';
    const cancelUrl =
      dto.cancelUrl ??
      this.configService.get<string>('STRIPE_CANCEL_URL') ??
      'http://localhost:4001/billing/cancel';

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Gebruiker niet gevonden.');
    }

    const customerId = await this.ensureCustomer(user);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      metadata: { userId },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: { userId },
      },
    });

    return {
      url: session.url ?? '',
      sessionId: session.id,
    };
  }

  async processWebhook(payload: Buffer, signature: string | string[] | undefined): Promise<void> {
    if (!this.stripe || !this.webhookSecret) {
      this.logger.warn('Stripe webhook ontvangen maar Stripe is niet geconfigureerd.');
      return;
    }

    if (!signature) {
      throw new BadRequestException('Stripe signature ontbreekt.');
    }

    let event: StripeEvent;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        Array.isArray(signature) ? signature[0]! : signature,
        this.webhookSecret,
      );
    } catch (error) {
      this.logger.warn(`Webhook signature verificatie mislukt: ${error}`);
      throw new BadRequestException('Ongeldige Stripe signature.');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeletion(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.debug(`Stripe event genegeerd: ${event.type}`);
    }
  }

  private async ensureCustomer(user: User): Promise<string> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is niet geconfigureerd.');
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return customer.id;
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (!this.stripe) {
      return;
    }

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
    if (!subscriptionId) {
      this.logger.warn('Checkout session zonder subscription-id.');
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    await this.applySubscriptionUpdate(subscription);
  }

  private async handleSubscriptionUpdate(event: StripeEvent): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    await this.applySubscriptionUpdate(subscription);
  }

  private async handleSubscriptionDeletion(subscription: Stripe.Subscription): Promise<void> {
    await this.applySubscriptionUpdate(subscription, true);
  }

  private async applySubscriptionUpdate(
    subscription: Stripe.Subscription,
    isDeletion = false,
  ): Promise<void> {
    const userIdFromMetadata = subscription.metadata?.userId;
    let user: User | null = null;

    if (userIdFromMetadata) {
      user = await this.prisma.user.findUnique({ where: { id: userIdFromMetadata } });
    }

    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
    }

    if (!user) {
      this.logger.warn(
        `Stripe subscription ${subscription.id} kan niet gekoppeld worden aan een gebruiker.`,
      );
      return;
    }

    const activeStatuses: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due'];
    const isActive = !isDeletion && activeStatuses.includes(subscription.status);

    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;
    const priceId = subscription.items.data[0]?.price?.id;
    const periodEnd = (subscription as Stripe.Subscription & { current_period_end?: number })
      .current_period_end;
    const premiumSince = isActive
      ? new Date(subscription.start_date * 1000)
      : user.premiumSince ?? null;
    const premiumUntil = periodEnd ? new Date(periodEnd * 1000) : null;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId ?? undefined,
        stripePriceId: priceId ?? undefined,
        stripeStatus: subscription.status,
        premium: isActive,
        premiumSince,
        premiumUntil,
      },
    });
  }
}
