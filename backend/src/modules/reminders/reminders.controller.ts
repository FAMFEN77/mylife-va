import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.remindersService.list(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReminderDto) {
    return this.remindersService.create(user.sub, dto);
  }

  @Patch(':reminderId')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('reminderId') reminderId: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return this.remindersService.update(user.sub, reminderId, dto);
  }

  @Delete(':reminderId')
  remove(@CurrentUser() user: JwtPayload, @Param('reminderId') reminderId: string) {
    return this.remindersService.remove(user.sub, reminderId);
  }
}
