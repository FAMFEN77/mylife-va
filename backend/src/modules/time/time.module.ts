import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { TimeService } from './time.service';
import { TimeController } from './time.controller';

@Module({
  imports: [PrismaModule],
  providers: [TimeService],
  controllers: [TimeController],
  exports: [TimeService],
})
export class TimeModule {}

