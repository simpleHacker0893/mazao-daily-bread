import type { Id } from "@/domain/types";
import { getBusinessDb } from "./business-db";

// Keep first-run routing in one place. A saved operating profile means onboarding
// has been completed or skipped; the app home is /dashboard (D-055).
export async function nextRouteAfterPin(businessId: Id): Promise<string> {
  const db = getBusinessDb(businessId);
  const profile = await db.settings.get("operatingProfile");
  return profile ? "/dashboard" : "/onboarding";
}
