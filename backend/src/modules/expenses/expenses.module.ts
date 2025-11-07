import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';

@Module({
  imports: [PrismaModule],
  providers: [ExpensesService],
  controllers: [ExpensesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}

