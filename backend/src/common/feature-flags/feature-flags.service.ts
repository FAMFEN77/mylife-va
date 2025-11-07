import { Injectable, Logger } from '@nestjs/common';
import { PlanType } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { DEFAULT_PLAN_FEATURES } from './feature-flags.constants';

type FeatureOverride = {
  key: string;
  enabled: boolean;
};

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns a feature map for a given user by resolving its organisation.
   */
  async getFlagsForUser(userId: string): Promise<Record<string, boolean>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organisationId: true },
    });

    return this.getFlagsForOrganisation(user?.organisationId ?? null);
  }

  /**
   * Returns the enabled features for an organisation. Falls back to PRO defaults when no organisation is linked.
   */
  async getFlagsForOrganisation(organisationId: string | null): Promise<Record<string, boolean>> {
    if (!organisationId) {
      return this.composeFlagMap('PRO', []);
    }

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: {
        plan: true,
        featureFlags: {
          select: { key: true, enabled: true },
        },
      },
    });

    if (!organisation) {
      this.logger.warn(`Organisation ${organisationId} not found while resolving feature flags.`);
      return this.composeFlagMap('PRO', []);
    }

    return this.composeFlagMap(organisation.plan, organisation.featureFlags);
  }

  async hasFeatureForUser(userId: string, featureKey: string): Promise<boolean> {
    const flags = await this.getFlagsForUser(userId);
    return this.isEnabled(featureKey, flags);
  }

  async hasFeatureForOrganisation(organisationId: string | null, featureKey: string): Promise<boolean> {
    const flags = await this.getFlagsForOrganisation(organisationId);
    return this.isEnabled(featureKey, flags);
  }

  isEnabled(featureKey: string, flagMap: Record<string, boolean>): boolean {
    return Boolean(flagMap[featureKey]);
  }

  private composeFlagMap(plan: PlanType, overrides: FeatureOverride[]): Record<string, boolean> {
    const planFeatures = DEFAULT_PLAN_FEATURES[plan] ?? [];
    const map: Record<string, boolean> = {};

    planFeatures.forEach((featureKey) => {
      map[featureKey] = true;
    });

    overrides.forEach(({ key, enabled }) => {
      map[key] = Boolean(enabled);
    });

    return map;
  }
}
