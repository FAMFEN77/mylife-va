"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import type { PlanType } from "@/lib/api";

export function usePlan(): PlanType {
  const { authenticatedUser } = useAuth();
  return authenticatedUser?.plan ?? "STARTER";
}
