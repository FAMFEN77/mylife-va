import { Module } from '@nestjs/common';

import { RecurrenceProcessor } from './recurrence.processor';
import { PrismaModule } from '../../common/database/prisma.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [PrismaModule, TasksModule],
  providers: [RecurrenceProcessor],
})
export class RecurrenceModule {}
