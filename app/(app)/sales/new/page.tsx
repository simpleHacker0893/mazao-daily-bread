"use client";

import { t } from "@/i18n/t";
import { PageTitle } from "@/ui/PageTitle";
import { NewSaleForm } from "@/ui/sales/NewSaleForm";

export default function NewSalePage() {
  return (
    <div className="p-4">
      <PageTitle title={t("shell.page.sales.new")} />
      <div className="mt-6">
        <NewSaleForm />
      </div>
    </div>
  );
}
