import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AssistantRequestDto {
  @ApiProperty({ description: 'Gebruikersbericht in natuurlijke taal', minLength: 1, maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @ApiProperty({
    description: 'Optioneel kanaal (bijv. web, slack). Kan gebruikt worden voor routing of analytics.',
    required: false,
  })
  @IsOptional()
  @IsString()
  channel?: string;
}
