import { PlanType } from '@prisma/client';

export const DEFAULT_PLAN_FEATURES: Record<PlanType, readonly string[]> = {
  STARTER: [],
  PRO: ['core.tasks', 'core.reminders'],
  ENTERPRISE: [
    'core.tasks',
    'core.reminders',
    'enterprise.sso',
    'enterprise.api',
    'enterprise.audit-log',
    'enterprise.dedicated-support',
  ],
};
