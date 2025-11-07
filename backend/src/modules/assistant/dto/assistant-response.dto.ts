import { ApiProperty } from '@nestjs/swagger';

export class AssistantResponseDto {
  @ApiProperty({ description: 'Gedetecteerde intent', example: 'task.create' })
  intent!: string;

  @ApiProperty({ description: 'Originele parameters die voor de intent zijn afgeleid' })
  parameters!: Record<string, unknown>;

  @ApiProperty({ description: 'Actie-resultaat of aanvullende context', required: false })
  result?: Record<string, unknown>;

  @ApiProperty({ description: 'Vrije tekst feedback voor de gebruiker', required: false })
  message?: string;

  @ApiProperty({ description: 'Vertrouwen (0-1) van de intent-classifier', required: false, example: 0.82 })
  confidence?: number;
}
