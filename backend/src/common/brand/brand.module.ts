import { Global, Module } from '@nestjs/common';

import { BrandService } from './brand.service';

@Global()
@Module({
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandModule {}
