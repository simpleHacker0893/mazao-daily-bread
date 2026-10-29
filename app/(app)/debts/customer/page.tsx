"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { t } from "@/i18n/t";
import { CustomerLedger } from "@/ui/ledger/CustomerLedger";
import { PageTitle } from "@/ui/PageTitle";

// D-041: the customer id travels in the query string (/debts/customer?id=<uuid>)
// so the page stays static and precacheable.
function CustomerDebt() {
  const customerId = useSearchParams().get("id") ?? "";
  return (
    <div className="p-4" data-customer-id={customerId}>
      <PageTitle title={t("shell.page.debts.customer")} />
      {customerId ? (
        <CustomerLedger customerId={customerId} />
      ) : (
        <p
          role="alert"
          className="mt-6 rounded-card bg-tomato-tint p-4 text-tomato"
        >
          {t("ledger.deni.customerNotFound")}
        </p>
      )}
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
