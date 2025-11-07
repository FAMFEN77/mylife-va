import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { BoardsModule } from './modules/boards/boards.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { GoogleModule } from './modules/google/google.module';
import { TeamModule } from './modules/team/team.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { PlanningModule } from './modules/planning/planning.module';
import { BillingModule } from './modules/billing/billing.module';
import { TimeModule } from './modules/time/time.module';
import { TripsModule } from './modules/trips/trips.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { LeaveModule } from './modules/leave/leave.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { FeatureFlagsModule } from './common/feature-flags/feature-flags.module';
import { BrandModule } from './common/brand/brand.module';
import { RecurrenceModule } from './modules/recurrence/recurrence.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    BrandModule,
    FeatureFlagsModule,
    AuthModule,
    TasksModule,
    BoardsModule,
    RemindersModule,
    GoogleModule,
    AssistantModule,
    TeamModule,
    AvailabilityModule,
    PlanningModule,
    BillingModule,
    TimeModule,
    TripsModule,
    InvoicesModule,
    ExpensesModule,
    LeaveModule,
    InspectionsModule,
    RecurrenceModule,
    CustomerModule,
    DocumentsModule,
  ],
})
export class AppModule {}
