import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Naam van de klant', example: 'Zorg BV' })
  @IsString()
  @MaxLength(255)
  customer!: string;

  @ApiProperty({ description: 'Factuurdatum', example: '2025-11-05' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Totaal exclusief btw', example: 1200.5 })
  @IsNumber()
  @IsPositive()
  totalEx!: number;

  @ApiProperty({ description: 'Totaal inclusief btw', example: 1452.6 })
  @IsNumber()
  @IsPositive()
  totalInc!: number;
}

