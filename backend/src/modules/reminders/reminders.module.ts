import { Module } from '@nestjs/common';

import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { PrismaModule } from '../../common/database/prisma.module';
import { MailModule } from '../mail/mail.module';
import { RemindersNotificationService } from './reminders-notification.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersNotificationService],
  exports: [RemindersService],
})
export class RemindersModule {}
