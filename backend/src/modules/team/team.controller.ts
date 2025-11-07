import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { TeamService } from './team.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@ApiTags('Team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('members')
  @Roles(UserRole.MANAGER)
  listMembers() {
    return this.teamService.listMembers();
  }

  @Post('invite')
  @Roles(UserRole.MANAGER)
  invite(@CurrentUser() user: JwtPayload, @Body() dto: InviteTeamMemberDto) {
    return this.teamService.invite(user.sub, dto);
  }

  @Patch('members/:userId')
  @Roles(UserRole.MANAGER)
  updateMemberRole(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.updateMemberRole(user.sub, userId, dto);
  }

  @Delete('members/:userId')
  @Roles(UserRole.MANAGER)
  removeMember(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.teamService.remove(user.sub, userId);
  }
}
