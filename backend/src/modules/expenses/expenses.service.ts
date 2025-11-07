import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../common/database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { UploadReceiptDto } from './dto/upload-receipt.dto';

type ExpenseStatus = 'pending' | 'approved' | 'rejected';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateExpenseDto) {
    const date = new Date(dto.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Ongeldige datum.');
    }

    if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException('Bedrag moet groter zijn dan 0.');
    }

    return this.prisma.expense.create({
      data: {
        userId,
        date,
        amount: dto.amount,
        category: dto.category.trim(),
        receiptUrl: dto.receiptUrl?.trim() || null,
      },
    });
  }

  async listMine(userId: string, query: ListExpensesQueryDto) {
    return this.prisma.expense.findMany({
      where: this.buildWhere({ userId }, query),
      orderBy: { date: 'desc' },
    });
  }

  async listPending(role: UserRole, query: ListExpensesQueryDto) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen declaraties beoordelen.');
    }
    return this.prisma.expense.findMany({
      where: {
        ...this.buildWhere({}, query),
        status: query.status ?? 'pending',
      },
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async approve(id: string, role: UserRole, approve: boolean) {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers kunnen declaraties goed- of afkeuren.');
    }
    const status: ExpenseStatus = approve ? 'approved' : 'rejected';
    return this.prisma.expense.update({
      where: { id },
      data: { status },
    });
  }

  async uploadReceipt(id: string, userId: string, role: UserRole, dto: UploadReceiptDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new NotFoundException('Declaratie niet gevonden.');
    }
    if (expense.userId !== userId && role !== UserRole.MANAGER) {
      throw new ForbiddenException('Geen toegang tot deze declaratie.');
    }

    const receiptUrl = `stub://receipts/${id}.jpg`;
    const recognizedAmount = expense.amount;

    await this.prisma.expense.update({
      where: { id },
      data: {
        receiptUrl,
      },
    });

    return {
      receiptUrl,
      recognizedAmount,
      ocrSummary: 'OCR stub: bedrag en datum herkend.',
    };
  }

  private buildWhere(
    base: Prisma.ExpenseWhereInput,
    query: ListExpensesQueryDto,
  ): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = { ...base };

    if (query.from || query.to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.from) {
        const from = new Date(query.from);
        if (!Number.isNaN(from.getTime())) {
          dateFilter.gte = new Date(from.setHours(0, 0, 0, 0));
        }
      }
      if (query.to) {
        const to = new Date(query.to);
        if (!Number.isNaN(to.getTime())) {
          dateFilter.lte = new Date(to.setHours(23, 59, 59, 999));
        }
      }
      where.date = dateFilter;
    }

    if (query.status) {
      where.status = query.status.toLowerCase() as ExpenseStatus;
    }

    return where;
  }
}
