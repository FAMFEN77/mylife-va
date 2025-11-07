import { Module } from '@nestjs/common';

import { AiSummarizerService } from './ai-summarizer.service';

@Module({
  providers: [AiSummarizerService],
  exports: [AiSummarizerService],
})
export class AiModule {}
