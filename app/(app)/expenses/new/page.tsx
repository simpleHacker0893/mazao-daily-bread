"use client";

import { t } from "@/i18n/t";
import { NewExpenseForm } from "@/ui/ledger/NewExpenseForm";
import { PageTitle } from "@/ui/PageTitle";

export default function NewExpensePage() {
  return (
    <div className="p-4">
      <PageTitle title={t("shell.page.expenses.new")} />
      <div className="mt-6">
        <NewExpenseForm />
      </div>
    </div>
  );
}
