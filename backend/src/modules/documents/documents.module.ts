import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageService } from './storage/storage.service';
import { LocalStorageService } from './storage/local-storage.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    TenantGuard,
    RolesGuard,
    {
      provide: StorageService,
      useClass: LocalStorageService,
    },
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
