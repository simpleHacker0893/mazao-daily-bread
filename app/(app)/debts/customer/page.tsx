"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { t } from "@/i18n/t";
import { PageTitle } from "@/ui/PageTitle";

// D-041: the customer id travels in the query string (/debts/customer?id=<uuid>)
// so the page stays static and precacheable.
function CustomerDebt() {
  const customerId = useSearchParams().get("id") ?? "";
  return (
    <div className="p-4" data-customer-id={customerId}>
      <PageTitle title={t("shell.page.debts.customer")} />
    </div>
  );
}

export default function CustomerDebtPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4">
          <PageTitle title={t("shell.page.debts.customer")} />
        </div>
      }
    >
      <CustomerDebt />
    </Suspense>
  );
}
