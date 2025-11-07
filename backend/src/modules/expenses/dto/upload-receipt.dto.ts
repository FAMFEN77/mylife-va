import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadReceiptDto {
  @ApiPropertyOptional({
    description: 'Base64-encoded inhoud van de bon (stub, optioneel)',
    example: 'data:image/jpeg;base64,...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000000)
  base64?: string;
}

