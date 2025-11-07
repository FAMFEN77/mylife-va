-- ===========================
-- ✅ Taskee - CLEAN INIT MIGRATION (FINAL + COMPLETE)
-- Matches schema.prisma EXACTLY
-- ===========================

-- ENUMS
CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'MEDEWERKER');
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- USERS
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT,
    "refreshTokenHash" TEXT,
    "premium" BOOLEAN NOT NULL DEFAULT FALSE,
    "role" "UserRole" NOT NULL DEFAULT 'MEDEWERKER',
    "stripeCustomerId" TEXT UNIQUE,
    "stripeSubscriptionId" TEXT UNIQUE,
    "stripePriceId" TEXT,
    "stripeStatus" TEXT,
    "premiumSince" TIMESTAMP(3),
    "premiumUntil" TIMESTAMP(3),
    "organisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ORGANISATION
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'PRO',
    "billingCustomerId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "User"
  ADD CONSTRAINT "User_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ORGANISATION FEATURES
CREATE TABLE "OrganisationFeature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "OrganisationFeature"
  ADD CONSTRAINT "OrganisationFeature_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "OrganisationFeature_org_key_unique"
  ON "OrganisationFeature"("organisationId", "key");

-- BOARD
CREATE TABLE "Board" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Board"
  ADD CONSTRAINT "Board_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Board_org_idx" ON "Board"("organisationId");

-- PROJECT
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Project_org_idx" ON "Project"("organisationId");
CREATE INDEX "Project_active_idx" ON "Project"("active");

ALTER TABLE "Board"
  ADD CONSTRAINT "Board_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- COLUMN
CREATE TABLE "Column" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL
);

ALTER TABLE "Column"
  ADD CONSTRAINT "Column_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Column_board_idx" ON "Column"("boardId");

-- TASK
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT,
    "dueDate" TIMESTAMP(3),
    "recurrenceId" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_columnId_fkey"
  FOREIGN KEY ("columnId") REFERENCES "Column"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Task_board_idx" ON "Task"("boardId");
CREATE INDEX "Task_column_idx" ON "Task"("columnId");
CREATE INDEX "Task_assignee_idx" ON "Task"("assigneeId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_due_idx" ON "Task"("dueDate");

-- LABEL
CREATE TABLE "Label" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT
);

ALTER TABLE "Label"
  ADD CONSTRAINT "Label_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Label_board_idx" ON "Label"("boardId");

-- TASKLABEL
CREATE TABLE "TaskLabel" (
    "taskId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    PRIMARY KEY ("taskId","labelId")
);

ALTER TABLE "TaskLabel"
  ADD CONSTRAINT "TaskLabel_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskLabel"
  ADD CONSTRAINT "TaskLabel_labelId_fkey"
  FOREIGN KEY ("labelId") REFERENCES "Label"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CHECKLIST
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "doneAt" TIMESTAMP(3)
);

ALTER TABLE "ChecklistItem"
  ADD CONSTRAINT "ChecklistItem_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ChecklistItem_task_idx" ON "ChecklistItem"("taskId");

-- ATTACHMENT
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "ocrPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Attachment_task_idx" ON "Attachment"("taskId");

-- COMMENT
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Comment_task_idx" ON "Comment"("taskId");
CREATE INDEX "Comment_author_idx" ON "Comment"("authorId");

-- RECURRENCE
CREATE TABLE "Recurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rule" TEXT NOT NULL,
    "nextOccurrence" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Recurrence_next_idx" ON "Recurrence"("nextOccurrence");
CREATE INDEX "Recurrence_active_idx" ON "Recurrence"("active");

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_recurrenceId_fkey"
  FOREIGN KEY ("recurrenceId") REFERENCES "Recurrence"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- TIME ENTRY
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "projectId" TEXT,
    "minutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "TimeEntry"
  ADD CONSTRAINT "TimeEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TimeEntry"
  ADD CONSTRAINT "TimeEntry_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TimeEntry"
  ADD CONSTRAINT "TimeEntry_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "TimeEntry_userId_idx" ON "TimeEntry"("userId");
CREATE INDEX "TimeEntry_projectId_idx" ON "TimeEntry"("projectId");
CREATE INDEX "TimeEntry_taskId_idx" ON "TimeEntry"("taskId");

-- MEETING ROOM
CREATE TABLE "MeetingRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "location" TEXT,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- ROOM RESERVATION
CREATE TABLE "RoomReservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "attendees" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "RoomReservation"
  ADD CONSTRAINT "RoomReservation_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "MeetingRoom"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoomReservation"
  ADD CONSTRAINT "RoomReservation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "RoomReservation_room_idx" ON "RoomReservation"("roomId","start","end");
CREATE INDEX "RoomReservation_user_idx" ON "RoomReservation"("userId","start");

-- TRIP
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Trip"
  ADD CONSTRAINT "Trip_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Trip_user_idx" ON "Trip"("userId","date");
CREATE INDEX "Trip_approved_idx" ON "Trip"("approved");

-- EXPENSE
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Expense_user_idx" ON "Expense"("userId","date");
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- INVOICE
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalEx" DOUBLE PRECISION NOT NULL,
    "totalInc" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Invoice_user_idx" ON "Invoice"("userId","date");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- LEAVE REQUEST
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "calendarEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "LeaveRequest"
  ADD CONSTRAINT "LeaveRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LeaveRequest_user_idx" ON "LeaveRequest"("userId","startDate");
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- INSPECTION
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectorId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Inspection"
  ADD CONSTRAINT "Inspection_inspectorId_fkey"
  FOREIGN KEY ("inspectorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Inspection_inspector_idx" ON "Inspection"("inspectorId","date");

-- INSPECTION ITEM
CREATE TABLE "InspectionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "InspectionItem"
  ADD CONSTRAINT "InspectionItem_inspectionId_fkey"
  FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "InspectionItem_inspection_idx" ON "InspectionItem"("inspectionId");

-- GOOGLE ACCOUNT
CREATE TABLE "GoogleAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenType" TEXT,
    "scope" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "GoogleAccount"
  ADD CONSTRAINT "GoogleAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- MAGIC LINK
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "MagicLink"
  ADD CONSTRAINT "MagicLink_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "MagicLink_user_idx" ON "MagicLink"("userId","expiresAt");

-- PASSWORD RESET TOKEN
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PasswordResetToken_user_idx" ON "PasswordResetToken"("userId","expiresAt");

-- ✅ REMINDER
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Reminder"
  ADD CONSTRAINT "Reminder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Reminder_user_idx" ON "Reminder"("userId","remindAt");

-- ✅ AVAILABILITY
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "maxHoursPerWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Availability"
  ADD CONSTRAINT "Availability_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Availability_user_idx" ON "Availability"("userId","weekday");
