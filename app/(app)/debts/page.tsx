"use client";

import { t } from "@/i18n/t";
import { DeniList } from "@/ui/ledger/DeniList";
import { PageTitle } from "@/ui/PageTitle";

export default function DebtsPage() {
  return (
    <div className="p-4">
      <PageTitle title={t("shell.page.debts")} />
      <DeniList />
    </div>
  );
}
