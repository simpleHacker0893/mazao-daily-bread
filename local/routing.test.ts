import { afterEach, describe, expect, it } from "vitest";
import { defaultProfile } from "@/domain/operating-profile";
import { getBusinessDb } from "./business-db";
import { saveSettings } from "./commit";
import { nextRouteAfterPin } from "./routing";

const businessId = `routing-${crypto.randomUUID()}`;
const db = getBusinessDb(businessId);

afterEach(async () => {
  await db.settings.clear();
  await db.onboarding.clear();
});

describe("nextRouteAfterPin", () => {
  it("sends a first-time merchant to onboarding when no profile exists", async () => {
    await expect(nextRouteAfterPin(businessId)).resolves.toBe("/onboarding");
  });

  it("sends a merchant with saved or skipped setup to the dashboard", async () => {
    await saveSettings(
      { db, businessId, profileId: "profile-route" },
      defaultProfile(),
    );

    await expect(nextRouteAfterPin(businessId)).resolves.toBe("/dashboard");
  });
});
