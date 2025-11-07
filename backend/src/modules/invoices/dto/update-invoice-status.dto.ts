import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @ApiProperty({
    description: 'Nieuwe status',
    example: 'sent',
    enum: ['draft', 'sent', 'paid'],
  })
  @IsString()
  @IsIn(['draft', 'sent', 'paid'])
  status!: string;
}

