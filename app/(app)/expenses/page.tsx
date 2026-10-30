"use client";

import { t } from "@/i18n/t";
import { ExpensesList } from "@/ui/ledger/ExpensesList";
import { PageTitle } from "@/ui/PageTitle";

export default function ExpensesPage() {
  return (
    <div className="p-4">
      <PageTitle title={t("shell.page.expenses")} />
      <ExpensesList />
    </div>
  );
}
