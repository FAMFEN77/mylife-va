import { Module } from '@nestjs/common';

import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, TenantGuard, RolesGuard],
})
export class CustomerModule {}
