import { Injectable, Logger } from '@nestjs/common';
import { fetch } from 'undici';

interface SummarizeInput {
  title: string;
  description?: string | null;
  status: string;
  comments: Array<{ author: { email: string }; body: string; createdAt: Date }>;
}

@Injectable()
export class AiSummarizerService {
  private readonly logger = new Logger(AiSummarizerService.name);
  private readonly host = process.env.AI_HOST ?? 'http://localhost:11434';
  private readonly model = process.env.AI_MODEL ?? 'llama3';

  async summarizeTaskThread(input: SummarizeInput): Promise<string> {
    const prompt = this.buildPrompt(input);

    try {
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI request failed (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as { response?: string; data?: string; output?: string };
      const summary = data.response ?? data.data ?? data.output;
      if (summary && summary.trim().length > 0) {
        return summary.trim();
      }
    } catch (error) {
      this.logger.warn(
        `Kon samenvatting niet ophalen via ${this.host}: ${(error as Error).message}. Val terug op inline samenvatting.`,
      );
    }

    return this.buildFallbackSummary(input);
  }

  private buildPrompt(input: SummarizeInput): string {
    const formattedComments = input.comments
      .map((comment) => {
        const timestamp = comment.createdAt instanceof Date ? comment.createdAt.toISOString() : `${comment.createdAt}`;
        return `- ${comment.author.email} (${timestamp}): ${comment.body}`;
      })
      .join('\n');

    return [
      'Je bent een assistent die taakthreads samenvat voor een team.',
      `Titel: ${input.title}`,
      `Status: ${input.status}`,
      input.description ? `Omschrijving: ${input.description}` : 'Geen beschrijving opgegeven.',
      formattedComments ? 'Recente reacties:\n' + formattedComments : 'Geen reacties beschikbaar.',
      'Geef een beknopte samenvatting in het Nederlands (maximaal 6 regels) en eindig met een korte next-step.',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private buildFallbackSummary(input: SummarizeInput): string {
    const topComments = input.comments.slice(-3);
    const lines = topComments.map(
      (comment) =>
        `- ${comment.author.email} (${comment.createdAt.toLocaleString()}): ${comment.body}`,
    );

    return [
      `Samenvatting voor "${input.title}" (${input.status}):`,
      input.description ? `Omschrijving: ${input.description}` : null,
      lines.length ? 'Recente opmerkingen:' : null,
      ...lines,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
