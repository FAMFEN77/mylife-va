/*
  Warnings:

  - You are about to drop the column `minutes` on the `TimeEntry` table. All the data in the column will be lost.
  - Added the required column `date` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationMin` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organisationId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "TimeEntry_userId_idx";

-- AlterTable
ALTER TABLE "InspectionItem" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TimeEntry" DROP COLUMN "minutes",
ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "durationMin" INTEGER NOT NULL,
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "companyName" VARCHAR(200),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "street" VARCHAR(200),
    "houseNumber" VARCHAR(20),
    "postalCode" VARCHAR(20),
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "kvkNumber" VARCHAR(50),
    "vatNumber" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_organisationId_lastName_idx" ON "Customer"("organisationId", "lastName");

-- CreateIndex
CREATE INDEX "Customer_organisationId_email_idx" ON "Customer"("organisationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organisationId_email_key" ON "Customer"("organisationId", "email");

-- CreateIndex
CREATE INDEX "Board_projectId_idx" ON "Board"("projectId");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MeetingRoom_name_idx" ON "MeetingRoom"("name");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_date_idx" ON "TimeEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_approved_idx" ON "TimeEntry"("approved");

-- CreateIndex
CREATE INDEX "User_organisationId_idx" ON "User"("organisationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Attachment_task_idx" RENAME TO "Attachment_taskId_idx";

-- RenameIndex
ALTER INDEX "Availability_user_idx" RENAME TO "Availability_userId_weekday_idx";

-- RenameIndex
ALTER INDEX "Board_org_idx" RENAME TO "Board_organisationId_idx";

-- RenameIndex
ALTER INDEX "ChecklistItem_task_idx" RENAME TO "ChecklistItem_taskId_idx";

-- RenameIndex
ALTER INDEX "Column_board_idx" RENAME TO "Column_boardId_idx";

-- RenameIndex
ALTER INDEX "Comment_author_idx" RENAME TO "Comment_authorId_idx";

-- RenameIndex
ALTER INDEX "Comment_task_idx" RENAME TO "Comment_taskId_idx";

-- RenameIndex
ALTER INDEX "Expense_user_idx" RENAME TO "Expense_userId_date_idx";

-- RenameIndex
ALTER INDEX "Inspection_inspector_idx" RENAME TO "Inspection_inspectorId_date_idx";

-- RenameIndex
ALTER INDEX "InspectionItem_inspection_idx" RENAME TO "InspectionItem_inspectionId_idx";

-- RenameIndex
ALTER INDEX "Invoice_user_idx" RENAME TO "Invoice_userId_date_idx";

-- RenameIndex
ALTER INDEX "Label_board_idx" RENAME TO "Label_boardId_idx";

-- RenameIndex
ALTER INDEX "LeaveRequest_user_idx" RENAME TO "LeaveRequest_userId_startDate_idx";

-- RenameIndex
ALTER INDEX "MagicLink_user_idx" RENAME TO "MagicLink_userId_expiresAt_idx";

-- RenameIndex
ALTER INDEX "OrganisationFeature_org_key_unique" RENAME TO "OrganisationFeature_organisationId_key_key";

-- RenameIndex
ALTER INDEX "PasswordResetToken_user_idx" RENAME TO "PasswordResetToken_userId_expiresAt_idx";

-- RenameIndex
ALTER INDEX "Project_org_idx" RENAME TO "Project_organisationId_idx";

-- RenameIndex
ALTER INDEX "Recurrence_next_idx" RENAME TO "Recurrence_nextOccurrence_idx";

-- RenameIndex
ALTER INDEX "Reminder_user_idx" RENAME TO "Reminder_userId_remindAt_idx";

-- RenameIndex
ALTER INDEX "RoomReservation_room_idx" RENAME TO "RoomReservation_roomId_start_end_idx";

-- RenameIndex
ALTER INDEX "RoomReservation_user_idx" RENAME TO "RoomReservation_userId_start_idx";

-- RenameIndex
ALTER INDEX "Task_assignee_idx" RENAME TO "Task_assigneeId_idx";

-- RenameIndex
ALTER INDEX "Task_board_idx" RENAME TO "Task_boardId_idx";

-- RenameIndex
ALTER INDEX "Task_column_idx" RENAME TO "Task_columnId_idx";

-- RenameIndex
ALTER INDEX "Task_due_idx" RENAME TO "Task_dueDate_idx";

-- RenameIndex
ALTER INDEX "Trip_user_idx" RENAME TO "Trip_userId_date_idx";
