import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [PrismaModule, GoogleModule],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}

