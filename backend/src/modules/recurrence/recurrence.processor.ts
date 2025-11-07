import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../../common/database/prisma.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class RecurrenceProcessor {
  private readonly logger = new Logger(RecurrenceProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  @Cron('*/5 * * * *')
  async processRecurrences(): Promise<void> {
    const now = new Date();
    const recurrences = await this.prisma.recurrence.findMany({
      where: {
        active: true,
        nextOccurrence: { lte: now },
      },
      include: {
        tasks: {
          include: {
            labels: true,
            checklist: true,
          },
        },
      },
    });

    for (const recurrence of recurrences) {
      try {
        for (const template of recurrence.tasks) {
          await this.spawnTaskFromTemplate(template, recurrence.rule);
        }
        const next = this.tasksService.computeNextOccurrence(
          recurrence.rule,
          recurrence.nextOccurrence ?? now,
        );
        if (next) {
          await this.prisma.recurrence.update({
            where: { id: recurrence.id },
            data: { nextOccurrence: next },
          });
        } else {
          await this.prisma.recurrence.update({
            where: { id: recurrence.id },
            data: { active: false },
          });
        }
      } catch (error) {
        this.logger.warn(
          `Kon recurrence ${recurrence.id} niet verwerken: ${(error as Error).message}`,
        );
      }
    }
  }

  private async spawnTaskFromTemplate(
    template: {
      id: string;
      boardId: string;
      columnId: string;
      creatorId: string;
      assigneeId: string | null;
      title: string;
      description: string | null;
      priority: string | null;
      dueDate: Date | null;
      labels: Array<{ labelId: string }>;
      checklist: Array<{ text: string; position: number }>;
    },
    rule: string,
  ): Promise<void> {
    const nextDueDate = template.dueDate
      ? this.tasksService.computeNextOccurrence(rule, template.dueDate)
      : null;

    await this.prisma.task.create({
      data: {
        boardId: template.boardId,
        columnId: template.columnId,
        creatorId: template.creatorId,
        assigneeId: template.assigneeId,
        title: template.title,
        description: template.description,
        status: 'open',
        priority: template.priority,
        dueDate: nextDueDate,
        labels: template.labels.length
          ? {
              create: template.labels.map((label) => ({ labelId: label.labelId })),
            }
          : undefined,
        checklist: template.checklist.length
          ? {
              create: template.checklist.map((item) => ({
                text: item.text,
                position: item.position,
              })),
            }
          : undefined,
      },
    });
  }
}
