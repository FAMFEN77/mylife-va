import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [PrismaModule],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}

