import type { Metadata } from "next";
import { t } from "@/i18n/t";
import { LandingFooter, LandingHeader } from "@/ui/landing/chrome";
import {
  ClosingBand,
  Debts,
  Faq,
  GoodsAndServices,
  Hero,
  NotebookVsMazao,
  OfflineStory,
  StartInThree,
  YourData,
} from "@/ui/landing/sections";

// Static: no Clerk, no data fetching, no /api call (#22). `/` stays the app (D-044).
export const metadata: Metadata = {
  title: t("landing.meta.title"),
  description: t("landing.meta.description"),
};

export default function WelcomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-chalk">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <NotebookVsMazao />
        <OfflineStory />
        <Debts />
        <GoodsAndServices />
        <StartInThree />
        <YourData />
        <Faq />
        <ClosingBand />
      </main>
      <LandingFooter />
    </div>
  );
}
