import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '../database/prisma.module';
import { FeatureFlagsService } from './feature-flags.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
