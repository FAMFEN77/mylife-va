import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlanType, UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PlanGuard } from '../../common/guards/plan.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { LegacyCreateTaskDto } from './dto/legacy-create-task.dto';
import { LegacyUpdateTaskDto } from './dto/legacy-update-task.dto';
import { RecurrenceDto } from './dto/recurrence.dto';
import { OcrDemoDto } from './dto/ocr-demo.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('tasks')
  listLegacy(@CurrentUser() user: JwtPayload) {
    return this.tasksService.list(user.sub);
  }

  @Get('boards/:boardId/tasks')
  listTasks(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') boardId: string,
    @Query() query: ListTasksQueryDto,
  ) {
    return this.tasksService.listTasks(user.sub, boardId, query);
  }

  @Post('tasks')
  createLegacy(@CurrentUser() user: JwtPayload, @Body() dto: LegacyCreateTaskDto) {
    return this.tasksService.create(user.sub, dto);
  }

  @Post('boards/:boardId/tasks')
  createTask(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') boardId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(user.sub, boardId, dto);
  }

  @Get('tasks/:taskId')
  getTask(@CurrentUser() user: JwtPayload, @Param('taskId') taskId: string) {
    return this.tasksService.getTask(user.sub, taskId);
  }

  @Patch('tasks/:taskId')
  updateLegacy(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Body() dto: LegacyUpdateTaskDto,
  ) {
    if (dto.status) {
      return this.tasksService.updateLegacyStatus(user.sub, taskId, dto.status);
    }
    return this.tasksService.getTask(user.sub, taskId);
  }

  @Patch('boards/:boardId/tasks/:taskId')
  updateTask(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') _boardId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(user.sub, taskId, dto);
  }

  @Delete('tasks/:taskId')
  deleteLegacy(@CurrentUser() user: JwtPayload, @Param('taskId') taskId: string) {
    return this.tasksService.deleteLegacy(user.sub, user.role as UserRole, taskId);
  }

  @Delete('boards/:boardId/tasks/:taskId')
  deleteTask(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') _boardId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.deleteTask(user.sub, user.role as UserRole, taskId);
  }

  @Post('tasks/:taskId/close')
  closeTask(@CurrentUser() user: JwtPayload, @Param('taskId') taskId: string) {
    return this.tasksService.closeTask(user.sub, taskId);
  }

  @Post('tasks/:taskId/reopen')
  reopenTask(@CurrentUser() user: JwtPayload, @Param('taskId') taskId: string) {
    return this.tasksService.reopenTask(user.sub, taskId);
  }

  @UseGuards(JwtAuthGuard, PlanGuard(PlanType.PRO))
  @Get('tasks/:taskId/summary')
  getSummary(@CurrentUser() user: JwtPayload, @Param('taskId') taskId: string) {
    return this.tasksService.generateSummary(user.sub, taskId);
  }

  @UseGuards(JwtAuthGuard, PlanGuard(PlanType.PRO))
  @Post('tasks/:taskId/recurrence')
  setRecurrence(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Body() dto: RecurrenceDto,
  ) {
    return this.tasksService.setRecurrence(user.sub, taskId, dto.rule);
  }

  @UseGuards(JwtAuthGuard, PlanGuard(PlanType.PRO))
  @Delete('recurrence/:recurrenceId')
  removeRecurrence(
    @CurrentUser() user: JwtPayload,
    @Param('recurrenceId') recurrenceId: string,
  ) {
    return this.tasksService.removeRecurrence(user.sub, recurrenceId);
  }

  @UseGuards(JwtAuthGuard, PlanGuard(PlanType.PRO))
  @Post('tasks/:taskId/attachments/ocr')
  runOcrDemo(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
    @Body() _dto: OcrDemoDto,
  ) {
    return this.tasksService.runOcrDemo(user.sub, taskId);
  }
}
