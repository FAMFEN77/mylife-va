import { Module } from '@nestjs/common';

import { OcrAdapter } from './ocr.adapter';

@Module({
  providers: [OcrAdapter],
  exports: [OcrAdapter],
})
export class OcrModule {}
