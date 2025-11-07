import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSessionResponseDto {
  @ApiProperty({
    description: 'URL waarnaar de gebruiker kan worden doorgestuurd om de betaling af te ronden.',
    example: 'https://checkout.stripe.com/c/pay/cs_test_a1b2c3',
  })
  url!: string;

  @ApiProperty({
    description: 'ID van de aangemaakte Stripe Checkout sessie.',
    example: 'cs_test_a1b2c3',
  })
  sessionId!: string;
}

