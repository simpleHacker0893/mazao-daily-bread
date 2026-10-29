"use client";

import { t } from "@/i18n/t";
import { PageTitle } from "@/ui/PageTitle";
import { SalesList } from "@/ui/sales/SalesList";

export default function SalesPage() {
  return (
    <div className="p-4">
      <PageTitle title={t("shell.page.sales")} />
      <SalesList />
    </div>
  );
}
