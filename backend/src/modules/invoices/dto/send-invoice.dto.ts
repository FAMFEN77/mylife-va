import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SendInvoiceDto {
  @ApiProperty({ description: 'E-mailadres van de klant', example: 'klant@example.com' })
  @IsEmail()
  recipientEmail!: string;
}

