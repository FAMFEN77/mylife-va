import { Module } from '@nestjs/common';

import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../../common/database/prisma.module';
import { AiModule } from '../ai/ai.module';
import { OcrModule } from '../ocr/ocr.module';

@Module({
  imports: [PrismaModule, AiModule, OcrModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
