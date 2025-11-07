import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [PlanningController],
  providers: [PlanningService, RolesGuard],
})
export class PlanningModule {}
