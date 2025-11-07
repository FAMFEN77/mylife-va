-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('UPLOAD', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'INSPECTIE', 'BEHANDELPLAN', 'RAPPORT', 'OVERIG');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'OVERIG',
    "source" "DocumentSource" NOT NULL,
    "filePath" VARCHAR(500),
    "fileUrl" VARCHAR(1000),
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_customerId_createdAt_idx" ON "Document"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Document_customerId_status_idx" ON "Document"("customerId", "status");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add check constraint ensuring path/url xor logic
ALTER TABLE "Document"
ADD CONSTRAINT "Document_source_xor_path_url_chk"
CHECK (
  ("source" = 'UPLOAD' AND "filePath" IS NOT NULL AND "fileUrl" IS NULL)
  OR
  ("source" = 'EXTERNAL' AND "fileUrl" IS NOT NULL AND "filePath" IS NULL)
);
