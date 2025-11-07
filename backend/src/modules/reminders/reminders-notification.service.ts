import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../common/database/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RemindersNotificationService {
  private readonly logger = new Logger(RemindersNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchDueReminders(): Promise<void> {
    const now = new Date();
    const dueReminders = await this.prisma.reminder.findMany({
      where: {
        sent: false,
        remindAt: { lte: now },
      },
      take: 50,
      include: {
        user: {
          select: { email: true },
        },
      },
      orderBy: { remindAt: 'asc' },
    });

    if (!dueReminders.length) {
      return;
    }

    for (const reminder of dueReminders) {
      const email = reminder.user?.email;
      if (!email) {
        this.logger.warn(`Reminder ${reminder.id} heeft geen gebruiker met e-mailadres.`);
        continue;
      }

      try {
        await this.mailService.sendReminderNotification(email, {
          text: reminder.text,
          remindAt: reminder.remindAt,
        });

        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { sent: true },
        });
      } catch (error) {
        this.logger.error(
          `Versturen reminder ${reminder.id} naar ${email} mislukt: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }
}
