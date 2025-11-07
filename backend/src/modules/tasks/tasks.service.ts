import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, PlanType, UserRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { AiSummarizerService } from '../ai/ai-summarizer.service';
import { OcrAdapter } from '../ocr/ocr.adapter';
import { CreateTaskDto, TaskPriorityDto, TaskStatusDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

const TASK_DETAIL_INCLUDE: Prisma.TaskInclude = {
  column: true,
  assignee: {
    select: { id: true, email: true, role: true },
  },
  labels: {
    include: {
      label: true,
    },
  },
  checklist: {
    orderBy: { position: 'asc' },
  },
  attachments: true,
  comments: {
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: { id: true, email: true, role: true },
      },
    },
  },
  recurrence: true,
};

interface BoardAccess {
  boardId: string;
  organisationId: string;
  plan: PlanType;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiSummarizer: AiSummarizerService,
    private readonly ocrAdapter: OcrAdapter,
  ) {}

  async listTasks(userId: string, boardId: string, query: ListTasksQueryDto) {
    await this.ensureBoardMembership(userId, boardId);

    const where: Prisma.TaskWhereInput = { boardId };
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.labelId) {
      where.labels = {
        some: { labelId: query.labelId },
      };
    }
    if (query.dueBefore) {
      const due = new Date(query.dueBefore);
      if (Number.isNaN(due.getTime())) {
        throw new BadRequestException('Ongeldige vervaldatum filter.');
      }
      where.dueDate = { lte: due };
    }

    return this.prisma.task.findMany({
      where,
      include: TASK_DETAIL_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        board: { select: { id: true, organisationId: true, organisation: { select: { plan: true } } } },
        ...TASK_DETAIL_INCLUDE,
      },
    });
    if (!task) {
      throw new NotFoundException('Taak niet gevonden.');
    }
    await this.ensureOrganisationMembership(userId, task.board.organisationId);
    return task;
  }

  async createTask(userId: string, boardId: string, dto: CreateTaskDto) {
    const boardAccess = await this.ensureBoardMembership(userId, boardId);

    await this.ensureColumn(boardId, dto.columnId);
    const assigneeId = await this.resolveAssignee(boardAccess.organisationId, dto.assigneeId);
    const labelIds = dto.labelIds ? await this.filterValidLabels(boardId, dto.labelIds) : [];

    const dueDate = this.parseIsoDate(dto.dueDate);
    const status = dto.status ?? TaskStatusDto.OPEN;
    const priority = dto.priority ?? TaskPriorityDto.NORMAL;
    const title = this.resolveTitle(dto.title, dto.text);
    const description = dto.description ?? null;

    return this.prisma.task.create({
      data: {
        boardId,
        columnId: dto.columnId,
        creatorId: userId,
        assigneeId,
        title,
        description: description ? description.trim() : null,
        status,
        priority,
        dueDate,
        labels: labelIds.length
          ? {
              create: labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
      },
      include: TASK_DETAIL_INCLUDE,
    });
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        boardId: true,
        columnId: true,
        assigneeId: true,
        board: { select: { id: true, organisationId: true, organisation: { select: { plan: true } } } },
      },
    });
    if (!task) {
      throw new NotFoundException('Taak niet gevonden.');
    }
    await this.ensureOrganisationMembership(userId, task.board.organisationId);

    if (dto.columnId && dto.columnId !== task.columnId) {
      await this.ensureColumn(task.boardId, dto.columnId);
    }

    let assigneeId: string | null | undefined;
    if (dto.assigneeId !== undefined) {
      assigneeId = await this.resolveAssignee(task.board.organisationId, dto.assigneeId);
    }

    let labelIds: string[] | undefined;
    if (dto.labelIds !== undefined) {
      labelIds = await this.filterValidLabels(task.boardId, dto.labelIds);
    }

    const dueDate = dto.dueDate !== undefined ? this.parseIsoDate(dto.dueDate) : undefined;
    const updateData: Prisma.TaskUpdateInput = {};

    if (dto.columnId) {
      updateData.column = { connect: { id: dto.columnId } };
    }
    if (dto.title !== undefined || dto.text !== undefined) {
      updateData.title = this.resolveTitle(dto.title, dto.text);
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description?.trim() ?? null;
    }
    if (dto.status) updateData.status = dto.status;
    if (dto.priority) updateData.priority = dto.priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (assigneeId !== undefined) {
      updateData.assignee = assigneeId
        ? { connect: { id: assigneeId } }
        : { disconnect: true };
    }

    return this.prisma.$transaction(async (tx) => {
      if (labelIds) {
        await tx.taskLabel.deleteMany({ where: { taskId } });
        if (labelIds.length) {
          await tx.taskLabel.createMany({
            data: labelIds.map((labelId) => ({ taskId, labelId })),
          });
        }
      }

      const updated = await tx.task.update({
        where: { id: taskId },
        data: updateData,
        include: TASK_DETAIL_INCLUDE,
      });
      return updated;
    });
  }

  async deleteTask(userId: string, userRole: UserRole, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        creatorId: true,
        board: { select: { organisationId: true } },
      },
    });
    if (!task) {
      throw new NotFoundException('Taak niet gevonden.');
    }
    await this.ensureOrganisationMembership(userId, task.board.organisationId);
    if (task.creatorId !== userId && userRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen de manager of maker kan de taak verwijderen.');
    }
    await this.prisma.task.delete({ where: { id: taskId } });
  }

  async closeTask(userId: string, taskId: string) {
    const task = await this.getTaskWithBoard(userId, taskId);

    return this.prisma.$transaction(async (tx) => {
      await this.stopActiveTimeEntry(tx, taskId, task.assigneeId);
      return tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatusDto.DONE,
          closedAt: new Date(),
        },
        include: TASK_DETAIL_INCLUDE,
      });
    });
  }

  async reopenTask(userId: string, taskId: string) {
    await this.getTaskWithBoard(userId, taskId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatusDto.OPEN,
        closedAt: null,
      },
      include: TASK_DETAIL_INCLUDE,
    });
  }

  async generateSummary(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        board: { select: { organisationId: true } },
        comments: {
          include: {
            author: { select: { email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('Taak niet gevonden.');
    }
    await this.ensureOrganisationMembership(userId, task.board.organisationId);
    const summary = await this.aiSummarizer.summarizeTaskThread({
      title: task.title,
      description: task.description,
      status: task.status,
      comments: task.comments.map((comment) => ({
        author: { email: comment.author.email },
        body: comment.body,
        createdAt: comment.createdAt,
      })),
    });
    return { summary };
  }

  async setRecurrence(userId: string, taskId: string, rule: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        board: { select: { organisationId: true } },
        recurrence: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Taak niet gevonden.');
    }
    await this.ensureOrganisationMembership(userId, task.board.organisationId);

    const nextOccurrence = this.computeNextOccurrence(rule, new Date());
    if (!nextOccurrence) {
      throw new BadRequestException('Ongeldige recurrence regel.');
    }

    let recurrence;
    if (task.recurrenceId) {
      recurrence = await this.prisma.recurrence.update({
        where: { id: task.recurrenceId },
        data: { rule, nextOccurrence, active: true },
      });
    } else {
      recurrence = await this.prisma.recurrence.create({
        data: { rule, nextOccurrence, active: true },
      });
      await this.prisma.task.update({
        where: { id: taskId },
        data: { recurrenceId: recurrence.id },
      });
    }
    return recurrence;
  }

  async removeRecurrence(userId: string, recurrenceId: string) {
    const recurrence = await this.prisma.recurrence.findUnique({
      where: { id: recurrenceId },
    });
    if (!recurrence) {
      throw new NotFoundException('Recurrence niet gevonden.');
    }

    const templateTask = await this.prisma.task.findFirst({
      where: { recurrenceId },
      select: { board: { select: { organisationId: true } } },
    });
    if (templateTask) {
      await this.ensureOrganisationMembership(userId, templateTask.board.organisationId);
    }

    await this.prisma.task.updateMany({
      where: { recurrenceId },
      data: { recurrenceId: null },
    });
    await this.prisma.recurrence.update({
      where: { id: recurrenceId },
      data: { active: false },
    });
    return { success: true };
  }

  async runOcrDemo(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { board: { select: { organisationId: true } } },
    });
    if (!task) {
      throw new NotFoundException('Taak niet gevonden.');
    }
    await this.ensureOrganisationMembership(userId, task.board.organisationId);
    const ocrPayload = await this.ocrAdapter.extract(Buffer.from('demo'), 'application/octet-stream');
    return { ocrPayload };
  }

  /**
   * @deprecated Legacy API voor assistent flows.
   */
  async list(userId: string) {
    const context = await this.getOrCreateDefaultBoard(userId);
    const tasks = await this.listTasks(userId, context.boardId, {});
    return tasks.map((task) => this.mapToLegacyTask(task));
  }

  /**
   * @deprecated Legacy API voor assistent flows.
   */
  async create(
    userId: string,
    payload: {
      text: string;
      status?: string;
      description?: string;
      dueDate?: string;
      assigneeId?: string;
      assigneeIds?: string[];
    },
  ) {
    if (!payload.text?.trim()) {
      throw new BadRequestException('Titel is verplicht.');
    }
    const context = await this.getOrCreateDefaultBoard(userId);
    const status =
      payload.status === 'done'
        ? TaskStatusDto.DONE
        : payload.status === 'in_progress'
          ? TaskStatusDto.IN_PROGRESS
          : TaskStatusDto.OPEN;

    const primaryAssignee = payload.assigneeId ?? payload.assigneeIds?.[0];

    const task = await this.createTask(userId, context.boardId, {
      columnId: context.defaultColumnId,
      title: payload.text.trim(),
      description: payload.description,
      status,
      dueDate: payload.dueDate,
      assigneeId: primaryAssignee ?? undefined,
    });
    return this.mapToLegacyTask(task);
  }

  async updateLegacyStatus(userId: string, taskId: string, status: 'todo' | 'done') {
    const updated =
      status === 'done'
        ? await this.closeTask(userId, taskId)
        : await this.reopenTask(userId, taskId);
    return this.mapToLegacyTask(updated);
  }

  async deleteLegacy(userId: string, userRole: UserRole, taskId: string) {
    await this.deleteTask(userId, userRole, taskId);
  }

  public computeNextOccurrence(rule: string, from: Date = new Date()): Date | null {
    if (!rule) {
      return null;
    }
    const normalized = rule.toUpperCase();
    const match = normalized.match(/FREQ=([A-Z]+)/);
    if (!match) {
      return null;
    }
    const freq = match[1];
    const next = new Date(from.getTime());
    switch (freq) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        return null;
    }
    return next;
  }

  private async getTaskWithBoard(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        boardId: true,
        assigneeId: true,
        board: {
          select: { organisationId: true },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('Taak niet gevonden.');
    }
    await this.ensureOrganisationMembership(userId, task.board.organisationId);
    return task;
  }

  private async ensureBoardMembership(userId: string, boardId: string): Promise<BoardAccess> {
    const board = await this.prisma.board.findFirst({
      where: {
        id: boardId,
        organisation: {
          users: { some: { id: userId } },
        },
      },
      select: {
        id: true,
        organisationId: true,
        organisation: { select: { plan: true } },
      },
    });
    if (!board) {
      throw new ForbiddenException('Je hebt geen toegang tot dit board.');
    }
    return {
      boardId,
      organisationId: board.organisationId,
      plan: board.organisation.plan,
    };
  }

  private async ensureOrganisationMembership(userId: string, organisationId: string) {
    const membership = await this.prisma.user.findFirst({
      where: { id: userId, organisationId },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('Geen toegang tot deze organisatie.');
    }
  }

  private async ensureColumn(boardId: string, columnId: string) {
    const column = await this.prisma.column.findFirst({
      where: { id: columnId, boardId },
      select: { id: true },
    });
    if (!column) {
      throw new NotFoundException('Kolom niet gevonden op dit board.');
    }
  }

  private async resolveAssignee(
    organisationId: string,
    assigneeId?: string,
  ): Promise<string | null | undefined> {
    if (assigneeId === undefined) {
      return undefined;
    }
    const trimmed = assigneeId?.trim();
    if (!trimmed) {
      return null;
    }
    const member = await this.prisma.user.findFirst({
      where: { id: trimmed, organisationId },
      select: { id: true },
    });
    if (!member) {
      throw new NotFoundException('Medewerker niet gevonden in deze organisatie.');
    }
    return member.id;
  }

  private async filterValidLabels(boardId: string, labelIds: string[]): Promise<string[]> {
    const unique = Array.from(new Set(labelIds.filter(Boolean)));
    if (!unique.length) {
      return [];
    }
    const labels = await this.prisma.label.findMany({
      where: { id: { in: unique }, boardId },
      select: { id: true },
    });
    if (labels.length !== unique.length) {
      throw new NotFoundException('Een of meerdere labels bestaan niet op dit board.');
    }
    return labels.map((label) => label.id);
  }

  private parseIsoDate(value?: string): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Ongeldige datum.');
    }
    return parsed;
  }

  private async stopActiveTimeEntry(tx: Prisma.TransactionClient, taskId: string, assigneeId: string | null) {
    if (!assigneeId) {
      return;
    }
    const entry = await tx.timeEntry.findFirst({
      where: {
        taskId,
        userId: assigneeId,
      },
      orderBy: { startTime: 'desc' },
    });
    if (!entry) {
      return;
    }
    const start = entry.startTime;
    const end = entry.endTime;
    if (end && end.getTime() > start.getTime() && entry.durationMin > 0) {
      return;
    }
    const now = new Date();
    const durationMinutes = Math.max(1, Math.round((now.getTime() - start.getTime()) / 60000));
    await tx.timeEntry.update({
      where: { id: entry.id },
      data: {
        endTime: now,
        durationMin: durationMinutes,
        approved: false,
      },
    });
  }

  private resolveTitle(primary?: string, legacyText?: string): string {
    const value = primary ?? legacyText;
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new BadRequestException('Titel is verplicht.');
    }
    return trimmed;
  }

  private async getOrCreateDefaultBoard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organisationId: true },
    });
    if (!user?.organisationId) {
      throw new ForbiddenException('Je bent niet gekoppeld aan een organisatie.');
    }

    const organisationId = user.organisationId;
    let board = await this.prisma.board.findFirst({
      where: {
        organisationId,
        name: 'Taken',
      },
      select: { id: true },
    });
    if (!board) {
      board = await this.prisma.board.create({
        data: {
          organisationId,
          name: 'Taken',
          columns: {
            create: [
              { name: 'Te doen', position: 0 },
              { name: 'Bezig', position: 1 },
              { name: 'Klaar', position: 2 },
            ],
          },
        },
        select: { id: true },
      });
    }

    let column = await this.prisma.column.findFirst({
      where: { boardId: board.id },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    if (!column) {
      column = await this.prisma.column.create({
        data: {
          boardId: board.id,
          name: 'Te doen',
          position: 0,
        },
        select: { id: true },
      });
    }
    return { boardId: board.id, defaultColumnId: column.id, organisationId };
  }

  private mapToLegacyTask(task: any) {
    const status = task.status === TaskStatusDto.DONE ? 'done' : 'todo';
    const assignments = task.assigneeId
      ? [
          {
            id: `${task.id}-${task.assigneeId}`,
            userId: task.assigneeId,
            assignedAt: task.updatedAt ?? task.createdAt,
            user: task.assignee ?? { id: task.assigneeId, email: '', role: UserRole.MEDEWERKER },
          },
        ]
      : [];
    return {
      id: task.id,
      creatorId: task.creatorId,
      text: task.title,
      status,
      dueDate: task.dueDate ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignments,
    };
  }
}
