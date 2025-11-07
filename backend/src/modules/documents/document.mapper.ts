import { Document, DocumentSource, DocumentStatus, DocumentType } from '@prisma/client';

export interface DocumentResponse {
  id: string;
  customerId: string;
  title: string;
  documentType: DocumentType;
  source: DocumentSource;
  fileUrl: string | null;
  status: DocumentStatus;
  createdAt: string;
  archivedAt: string | null;
  createdById: string | null;
}

export const mapDocument = (document: Document): DocumentResponse => ({
  id: document.id,
  customerId: document.customerId,
  title: document.title,
  documentType: document.documentType,
  source: document.source,
  fileUrl: document.source === DocumentSource.EXTERNAL ? document.fileUrl ?? null : null,
  status: document.status,
  createdAt: document.createdAt.toISOString(),
  archivedAt: document.archivedAt ? document.archivedAt.toISOString() : null,
  createdById: document.createdById ?? null,
});
