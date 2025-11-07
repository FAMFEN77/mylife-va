import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';

@Module({
  imports: [PrismaModule],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}

