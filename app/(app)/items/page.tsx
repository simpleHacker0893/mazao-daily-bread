"use client";

import { t } from "@/i18n/t";
import { PageTitle } from "@/ui/PageTitle";

export default function ItemsPage() {
  return (
    <div className="p-4">
      <PageTitle title={t("shell.page.items")} />
    </div>
  );
}
