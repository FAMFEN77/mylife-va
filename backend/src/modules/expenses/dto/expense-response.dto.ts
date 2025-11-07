import { ApiProperty } from '@nestjs/swagger';

export class ExpenseResponseDto {
  @ApiProperty({ description: 'Uitgave ID', example: 'exp_123' })
  id!: string;

  @ApiProperty({ description: 'Gebruiker ID', example: 'user_abc' })
  userId!: string;

  @ApiProperty({ description: 'Datum', example: '2025-11-05T00:00:00.000Z' })
  date!: string;

  @ApiProperty({ description: 'Bedrag', example: 45.9 })
  amount!: number;

  @ApiProperty({ description: 'Categorie', example: 'Reiskosten' })
  category!: string;

  @ApiProperty({ description: 'Status', example: 'pending' })
  status!: string;

  @ApiProperty({ description: 'URL naar bon', example: 'stub://receipts/exp_123.jpg', nullable: true })
  receiptUrl?: string | null;

  @ApiProperty({ description: 'Aanmaakdatum', example: '2025-11-05T09:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Laatste update', example: '2025-11-05T09:00:00.000Z' })
  updatedAt!: string;
}

