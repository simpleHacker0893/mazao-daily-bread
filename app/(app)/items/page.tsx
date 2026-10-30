"use client";

import { t } from "@/i18n/t";
import { ItemsScreen } from "@/ui/ledger/ItemsScreen";
import { PageTitle } from "@/ui/PageTitle";

export default function ItemsPage() {
  return (
    <div className="p-4">
      <PageTitle title={t("shell.page.items")} />
      <ItemsScreen />
    </div>
  );
}
