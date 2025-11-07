import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ description: 'Datum van de uitgave', example: '2025-11-05' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Bedrag in euro', example: 45.9 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ description: 'Categorie van de uitgave', example: 'Reiskosten' })
  @IsString()
  @MaxLength(255)
  category!: string;

  @ApiPropertyOptional({ description: 'Eventuele bestaande URL naar de bon', example: 'https://storage/receipt.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  receiptUrl?: string;
}

