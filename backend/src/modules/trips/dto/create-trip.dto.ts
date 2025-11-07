import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateTripDto {
  @ApiProperty({ description: 'Datum van de rit', example: '2025-11-02' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Vertreklocatie', example: 'Amsterdam' })
  @IsString()
  @MaxLength(255)
  from!: string;

  @ApiProperty({ description: 'Bestemming', example: 'Rotterdam' })
  @IsString()
  @MaxLength(255)
  to!: string;

  @ApiProperty({ description: 'Afstand in kilometers', example: 78.5 })
  @IsNumber()
  @IsPositive()
  distanceKm!: number;
}

