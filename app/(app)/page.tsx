"use client";

import { t } from "@/i18n/t";
import { PageTitle } from "@/ui/PageTitle";

export default function OverviewPage() {
  return (
    <div className="p-4">
      <PageTitle title={t("shell.page.overview")} />
    </div>
  );
}
