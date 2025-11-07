import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@ApiTags('Boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('orgId') organisationId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.boardsService.listBoards(user.sub, organisationId, projectId);
  }

  @Get(':boardId')
  getBoard(@CurrentUser() user: JwtPayload, @Param('boardId') boardId: string) {
    return this.boardsService.getBoard(user.sub, boardId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBoardDto) {
    return this.boardsService.createBoard(user.sub, dto);
  }

  @Patch(':boardId')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.updateBoard(user.sub, boardId, dto);
  }

  @Delete(':boardId')
  delete(@CurrentUser() user: JwtPayload, @Param('boardId') boardId: string) {
    return this.boardsService.deleteBoard(user.sub, boardId);
  }

  @Post(':boardId/columns')
  createColumn(
    @CurrentUser() user: JwtPayload,
    @Param('boardId') boardId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.boardsService.createColumn(user.sub, boardId, dto);
  }

  @Patch('/columns/:columnId')
  updateColumn(
    @CurrentUser() user: JwtPayload,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.boardsService.updateColumn(user.sub, columnId, dto);
  }

  @Delete('/columns/:columnId')
  deleteColumn(@CurrentUser() user: JwtPayload, @Param('columnId') columnId: string) {
    return this.boardsService.deleteColumn(user.sub, columnId);
  }
}
