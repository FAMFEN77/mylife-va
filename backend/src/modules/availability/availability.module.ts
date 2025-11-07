import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, RolesGuard],
})
export class AvailabilityModule {}
