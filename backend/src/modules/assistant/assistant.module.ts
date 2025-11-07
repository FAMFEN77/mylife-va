import { Module } from '@nestjs/common';

import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { IntentDetectionService } from './intent-detection.service';
import { TasksModule } from '../tasks/tasks.module';
import { RemindersModule } from '../reminders/reminders.module';
import { GoogleModule } from '../google/google.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [TasksModule, RemindersModule, GoogleModule, RoomsModule],
  controllers: [AssistantController],
  providers: [AssistantService, IntentDetectionService],
})
export class AssistantModule {}



