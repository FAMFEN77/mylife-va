import { ApiProperty } from '@nestjs/swagger';

export class InvoiceResponseDto {
  @ApiProperty({ description: 'Factuur ID', example: 'inv_123' })
  id!: string;

  @ApiProperty({ description: 'Gebruiker ID', example: 'user_abc' })
  userId!: string;

  @ApiProperty({ description: 'Klantnaam', example: 'Zorg BV' })
  customer!: string;

  @ApiProperty({ description: 'Factuurdatum', example: '2025-11-05T00:00:00.000Z' })
  date!: string;

  @ApiProperty({ description: 'Totaal exclusief btw', example: 1200.5 })
  totalEx!: number;

  @ApiProperty({ description: 'Totaal inclusief btw', example: 1452.6 })
  totalInc!: number;

  @ApiProperty({ description: 'Status', example: 'draft' })
  status!: string;

  @ApiProperty({ description: 'URL naar PDF (indien beschikbaar)', example: 'https://storage/myinvoice.pdf', nullable: true })
  pdfUrl?: string | null;

  @ApiProperty({ description: 'Aanmaakdatum', example: '2025-11-05T09:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Laatste update', example: '2025-11-05T09:00:00.000Z' })
  updatedAt!: string;
}

