import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expensesService.create(user.sub, dto);
    return this.toDto(expense);
  }

  @Get('me')
  async listMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListExpensesQueryDto,
  ): Promise<ExpenseResponseDto[]> {
    const expenses = await this.expensesService.listMine(user.sub, query);
    return expenses.map((expense) => this.toDto(expense));
  }

  @Get('pending')
  async listPending(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListExpensesQueryDto,
  ) {
    const expenses = await this.expensesService.listPending(user.role, query);
    return expenses.map((expense) => ({
      ...this.toDto(expense),
      user: expense.user,
    }));
  }

  @Post(':id/approve')
  async approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expensesService.approve(id, user.role, true);
    return this.toDto(expense);
  }

  @Post(':id/reject')
  async reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expensesService.approve(id, user.role, false);
    return this.toDto(expense);
  }

  @Post(':id/upload')
  async uploadReceipt(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UploadReceiptDto,
  ) {
    return this.expensesService.uploadReceipt(id, user.sub, user.role, dto);
  }

  private toDto(expense: {
    id: string;
    userId: string;
    date: Date;
    amount: number;
    category: string;
    status: string;
    receiptUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ExpenseResponseDto {
    return {
      id: expense.id,
      userId: expense.userId,
      date: expense.date.toISOString(),
      amount: expense.amount,
      category: expense.category,
      status: expense.status,
      receiptUrl: expense.receiptUrl,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    };
  }
}

