import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { PlanningService } from './planning.service';
import { PlanningRequestDto } from './dto/planning-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Planning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post('suggest')
  @Roles(UserRole.MANAGER)
  suggest(@Body() dto: PlanningRequestDto) {
    return this.planningService.suggest(dto);
  }
}
