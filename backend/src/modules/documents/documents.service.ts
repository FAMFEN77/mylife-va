import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { DocumentSource, DocumentStatus, DocumentType, Prisma, UserRole } from '@prisma/client';
import type { Express } from 'express';
import type { Readable } from 'node:stream';

import { PrismaService } from '../../common/database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ExternalDocumentDto } from './dto/external-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { DocumentResponse, mapDocument } from './document.mapper';
import { StorageService } from './storage/storage.service';

export interface DocumentListResponse {
  items: DocumentResponse[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  async upload(
    user: JwtPayload,
    customerId: string,
    file: Express.Multer.File | undefined,
    dto: UploadDocumentDto,
  ): Promise<DocumentResponse> {
    if (!file) {
      throw new BadRequestException('Upload een PDF-bestand.');
    }
    this.ensurePdf(file);

    const organisationId = this.requireOrganisation(user);
    await this.ensureCustomerAccess(organisationId, customerId);

    const saveResult = await this.storage.save(file);
    const title = dto.title?.trim() || this.deriveTitle(saveResult.originalName);

    const document = await this.prisma.document.create({
      data: {
        customerId,
        title,
        documentType: dto.documentType ?? DocumentType.OVERIG,
        source: DocumentSource.UPLOAD,
        filePath: saveResult.path,
        status: DocumentStatus.ACTIVE,
        createdById: user.sub,
      },
    });

    return mapDocument(document);
  }

  async registerExternal(
    user: JwtPayload,
    customerId: string,
    dto: ExternalDocumentDto,
  ): Promise<DocumentResponse> {
    const organisationId = this.requireOrganisation(user);
    await this.ensureCustomerAccess(organisationId, customerId);

    const document = await this.prisma.document.create({
      data: {
        customerId,
        title: dto.title.trim(),
        documentType: dto.documentType ?? DocumentType.OVERIG,
        source: DocumentSource.EXTERNAL,
        fileUrl: dto.fileUrl.trim(),
        status: DocumentStatus.ACTIVE,
        createdById: user.sub,
      },
    });

    return mapDocument(document);
  }

  async list(
    user: JwtPayload,
    customerId: string,
    query: QueryDocumentsDto,
  ): Promise<DocumentListResponse> {
    const organisationId = this.requireOrganisation(user);
    await this.ensureCustomerAccess(organisationId, customerId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const where: Prisma.DocumentWhereInput = { customerId };
    if (query.status === 'ACTIVE') {
      where.status = DocumentStatus.ACTIVE;
    } else if (query.status === 'ARCHIVED') {
      where.status = DocumentStatus.ARCHIVED;
    }

    const [total, documents] = await this.prisma.$transaction([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: documents.map(mapDocument),
      total,
      page,
      pageSize,
    };
  }

  async archive(user: JwtPayload, documentId: string): Promise<DocumentResponse> {
    this.ensureManagerRole(user.role);
    const organisationId = this.requireOrganisation(user);
    const document = await this.getDocumentForOrganisation(documentId, organisationId);
    if (document.status === DocumentStatus.ARCHIVED) {
      return mapDocument(document);
    }
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.ARCHIVED, archivedAt: new Date() },
    });
    return mapDocument(updated);
  }

  async restore(user: JwtPayload, documentId: string): Promise<DocumentResponse> {
    this.ensureManagerRole(user.role);
    const organisationId = this.requireOrganisation(user);
    const document = await this.getDocumentForOrganisation(documentId, organisationId);
    if (document.status === DocumentStatus.ACTIVE) {
      return mapDocument(document);
    }
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.ACTIVE, archivedAt: null },
    });
    return mapDocument(updated);
  }

  async getFile(user: JwtPayload, documentId: string): Promise<{ filename: string; stream: Readable }> {
    const organisationId = this.requireOrganisation(user);
    const document = await this.getDocumentForOrganisation(documentId, organisationId);
    if (document.source !== DocumentSource.UPLOAD || !document.filePath) {
      throw new BadRequestException('Dit document heeft geen lokaal bestand.');
    }
    return {
      filename: `${document.title}.pdf`,
      stream: await this.storage.stream(document.filePath),
    };
  }

  private ensurePdf(file: Express.Multer.File): void {
    if (file.mimetype !== 'application/pdf') {
      throw new UnsupportedMediaTypeException('Alleen PDF-bestanden zijn toegestaan.');
    }
    const signature = file.buffer?.subarray(0, 4).toString();
    if (!signature?.includes('%PDF')) {
      throw new UnsupportedMediaTypeException('Bestand lijkt geen geldige PDF.');
    }
  }

  private deriveTitle(originalName: string): string {
    const name = originalName?.trim();
    if (!name) {
      return 'Document';
    }
    const withoutExtension = name.replace(/\.[^.]+$/, '');
    return withoutExtension || 'Document';
  }

  private requireOrganisation(user: JwtPayload): string {
    if (!user.organisationId) {
      throw new ForbiddenException('Geen organisatie gekoppeld aan gebruiker.');
    }
    return user.organisationId;
  }

  private ensureManagerRole(role: UserRole): void {
    if (role !== UserRole.MANAGER) {
      throw new ForbiddenException('Alleen managers mogen deze actie uitvoeren.');
    }
  }

  private async ensureCustomerAccess(organisationId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organisationId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Klant niet gevonden.');
    }
  }

  private async getDocumentForOrganisation(documentId: string, organisationId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        customer: { organisationId },
      },
    });
    if (!document) {
      throw new NotFoundException('Document niet gevonden.');
    }
    return document;
  }
}
