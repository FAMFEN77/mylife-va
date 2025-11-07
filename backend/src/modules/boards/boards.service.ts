import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, PlanType } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

interface UserContext {
  userId: string;
  organisationId: string | null;
  plan: PlanType | null;
}

const BOARD_WITH_COLUMNS: Prisma.BoardInclude = {
  columns: {
    orderBy: { position: 'asc' },
  },
  labels: true,
};

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBoards(userId: string, organisationId?: string | null, projectId?: string | null) {
    const context = await this.resolveUserContext(userId);
    const targetOrganisation = organisationId ?? context.organisationId;
    if (!targetOrganisation) {
      return [];
    }
    if (context.organisationId && targetOrganisation !== context.organisationId) {
      throw new ForbiddenException('Je hebt geen toegang tot deze organisatie.');
    }

    return this.prisma.board.findMany({
      where: {
        organisationId: targetOrganisation,
        projectId: projectId ?? undefined,
      },
      include: BOARD_WITH_COLUMNS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBoard(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: BOARD_WITH_COLUMNS,
    });
    if (!board) {
      throw new NotFoundException('Board niet gevonden.');
    }
    await this.ensureBoardAccess(userId, board.organisationId);
    return board;
  }

  async createBoard(userId: string, dto: CreateBoardDto) {
    const { organisationId, projectId, name } = dto;
    await this.ensureOrganisationMembership(userId, organisationId);
    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, organisationId },
        select: { id: true },
      });
      if (!project) {
        throw new NotFoundException('Project niet gevonden voor deze organisatie.');
      }
    }

    return this.prisma.board.create({
      data: {
        organisationId,
        projectId: projectId ?? null,
        name,
      },
      include: BOARD_WITH_COLUMNS,
    });
  }

  async updateBoard(userId: string, boardId: string, dto: UpdateBoardDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, organisationId: true },
    });
    if (!board) {
      throw new NotFoundException('Board niet gevonden.');
    }
    await this.ensureBoardAccess(userId, board.organisationId);

    return this.prisma.board.update({
      where: { id: boardId },
      data: {
        name: dto.name ?? undefined,
      },
      include: BOARD_WITH_COLUMNS,
    });
  }

  async deleteBoard(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, organisationId: true },
    });
    if (!board) {
      throw new NotFoundException('Board niet gevonden.');
    }
    await this.ensureBoardAccess(userId, board.organisationId);

    await this.prisma.board.delete({ where: { id: boardId } });
  }

  async createColumn(userId: string, boardId: string, dto: CreateColumnDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { organisationId: true },
    });
    if (!board) {
      throw new NotFoundException('Board niet gevonden.');
    }
    await this.ensureBoardAccess(userId, board.organisationId);

    return this.prisma.column.create({
      data: {
        boardId,
        name: dto.name,
        position: dto.position,
      },
      include: {
        tasks: false,
      },
    });
  }

  async updateColumn(userId: string, columnId: string, dto: UpdateColumnDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      select: { id: true, board: { select: { organisationId: true } } },
    });
    if (!column) {
      throw new NotFoundException('Kolom niet gevonden.');
    }
    await this.ensureBoardAccess(userId, column.board.organisationId);

    return this.prisma.column.update({
      where: { id: columnId },
      data: {
        name: dto.name ?? undefined,
        position: dto.position ?? undefined,
      },
    });
  }

  async deleteColumn(userId: string, columnId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      select: { id: true, board: { select: { organisationId: true } } },
    });
    if (!column) {
      throw new NotFoundException('Kolom niet gevonden.');
    }
    const taskCount = await this.prisma.task.count({
      where: { columnId },
    });
    if (taskCount) {
      throw new ForbiddenException('Verplaats of verwijder eerst alle taken uit deze kolom.');
    }
    await this.ensureBoardAccess(userId, column.board.organisationId);
    await this.prisma.column.delete({ where: { id: columnId } });
  }

  private async ensureBoardAccess(userId: string, organisationId: string) {
    await this.ensureOrganisationMembership(userId, organisationId);
  }

  private async ensureOrganisationMembership(userId: string, organisationId: string) {
    const membership = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organisationId,
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('Je hebt geen toegang tot deze organisatie.');
    }
  }

  private async resolveUserContext(userId: string): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        organisationId: true,
        organisation: { select: { plan: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('Gebruiker niet gevonden.');
    }
    return {
      userId,
      organisationId: user.organisationId,
      plan: user.organisation?.plan ?? null,
    };
  }
}
