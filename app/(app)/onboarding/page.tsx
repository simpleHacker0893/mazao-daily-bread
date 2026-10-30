"use client";

import { Suspense } from "react";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { OnboardingFlow } from "@/ui/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  const locale = useLocale();
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[50dvh] items-center justify-center p-5">
          <output aria-live="polite" className="text-base text-ink">
            {t("ledger.onboarding.loading", locale)}
          </output>
        </main>
      }
    >
      <OnboardingFlow />
    </Suspense>
  );
}
