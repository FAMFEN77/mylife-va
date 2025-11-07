import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { GoogleModule } from '../google/google.module';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';

@Module({
  imports: [PrismaModule, GoogleModule],
  providers: [LeaveService],
  controllers: [LeaveController],
  exports: [LeaveService],
})
export class LeaveModule {}

