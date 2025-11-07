import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class InspectionItemInput {
  @ApiProperty({ description: 'Omschrijving van het onderdeel', example: 'Schoonmaak kwaliteit woonkamer' })
  @IsString()
  @MaxLength(255)
  description!: string;

  @ApiProperty({ description: 'Score (1-5)', example: 4 })
  @IsInt()
  @Min(1)
  score!: number;

  @ApiPropertyOptional({ description: 'Optionele opmerking', example: 'Let volgende keer extra op het stofzuigen.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateInspectionDto {
  @ApiProperty({ description: 'Locatie van de inspectie', example: 'Locatie A - Eelderveen' })
  @IsString()
  @MaxLength(255)
  location!: string;

  @ApiProperty({ description: 'Datum en tijd', example: '2025-11-10T10:00:00+01:00' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: 'Algemene notities', example: 'Algemene kwaliteit is goed.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'Checklist met onderdelen',
    type: [InspectionItemInput],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InspectionItemInput)
  items!: InspectionItemInput[];
}

