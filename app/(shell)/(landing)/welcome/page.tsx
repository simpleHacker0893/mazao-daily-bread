import type { Metadata } from "next";
import { t } from "@/i18n/t";
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
    <>
      <Hero />
      <NotebookVsMazao />
      <OfflineStory />
      <Debts />
      <GoodsAndServices />
      <StartInThree />
      <YourData />
      <Faq />
      <ClosingBand />
    </>
  );
}
