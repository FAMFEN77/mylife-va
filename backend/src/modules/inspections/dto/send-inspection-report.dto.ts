import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendInspectionReportDto {
  @ApiProperty({ description: 'E-mailadres van de klant/bestemmeling', example: 'klant@example.com' })
  @IsEmail()
  recipientEmail!: string;

  @ApiPropertyOptional({
    description: 'Optioneel onderwerp voor de e-mail',
    example: 'Inspectierapport Locatie A - 10 november',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({
    description: 'Optioneel bericht voor in de e-mail',
    example: 'Beste klant, hierbij het rapport van de inspectie.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

