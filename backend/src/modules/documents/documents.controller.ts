import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ExternalDocumentDto } from './dto/external-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { DocumentsService } from './documents.service';
import { UserRole } from '@prisma/client';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post(':customerId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        documentType: { type: 'string', enum: ['CONTRACT', 'INSPECTIE', 'BEHANDELPLAN', 'RAPPORT', 'OVERIG'] },
      },
      required: ['file'],
    },
  })
  upload(
    @CurrentUser() user: JwtPayload,
    @Param('customerId') customerId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.upload(user, customerId, file, dto);
  }

  @Post(':customerId/external')
  external(
    @CurrentUser() user: JwtPayload,
    @Param('customerId') customerId: string,
    @Body() dto: ExternalDocumentDto,
  ) {
    return this.documentsService.registerExternal(user, customerId, dto);
  }

  @Get('customer/:customerId')
  list(
    @CurrentUser() user: JwtPayload,
    @Param('customerId') customerId: string,
    @Query() query: QueryDocumentsDto,
  ) {
    return this.documentsService.list(user, customerId, query);
  }

  @Get(':id/file')
  async file(@CurrentUser() user: JwtPayload, @Param('id') documentId: string) {
    const { stream, filename } = await this.documentsService.getFile(user, documentId);
    return new StreamableFile(stream, {
      disposition: `inline; filename="${this.sanitizeFilename(filename)}"`,
      type: 'application/pdf',
    });
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  archive(@CurrentUser() user: JwtPayload, @Param('id') documentId: string) {
    return this.documentsService.archive(user, documentId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  restore(@CurrentUser() user: JwtPayload, @Param('id') documentId: string) {
    return this.documentsService.restore(user, documentId);
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9_.-]/gi, '_');
  }
}
