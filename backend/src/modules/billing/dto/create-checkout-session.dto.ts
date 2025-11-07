import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiPropertyOptional({
    description: 'Optionele aangepaste success URL; standaard uit configuratie.',
    example: 'https://app.mylife-va.com/billing/success',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  @MaxLength(2000)
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Optionele aangepaste cancel URL; standaard uit configuratie.',
    example: 'https://app.mylife-va.com/billing/cancel',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  @MaxLength(2000)
  cancelUrl?: string;
}

