import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { GoogleModule } from '../google/google.module';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';

@Module({
  imports: [PrismaModule, GoogleModule],
  providers: [InspectionsService],
  controllers: [InspectionsController],
  exports: [InspectionsService],
})
export class InspectionsModule {}

