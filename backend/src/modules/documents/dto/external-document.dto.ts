import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class ExternalDocumentDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  fileUrl!: string;

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;
}
