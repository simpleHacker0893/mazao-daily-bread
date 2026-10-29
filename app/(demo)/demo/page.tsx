import type { Metadata } from "next";
import { t } from "@/i18n/t";
import { DemoIntro } from "@/ui/demo/DemoIntro";

export const metadata: Metadata = {
  title: t("landing.demo.intro.title"),
  description: t("landing.demo.intro.description"),
};

export default function DemoPage() {
  return <DemoIntro />;
}
