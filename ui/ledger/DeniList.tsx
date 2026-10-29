"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/auth/session";
import { formatKES } from "@/domain/money";
import type { Id } from "@/domain/types";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { useDeniList, useToday } from "@/local/queries";
import { focusRing } from "@/ui/landing/primitives";
import { RecordPaymentSheet } from "./RecordPaymentSheet";

const buttonClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;

export function DeniList() {
  const locale = useLocale();
  const session = useSession();
  const today = useToday();
  const list = useDeniList(today);
  const [paymentCustomerId, setPaymentCustomerId] = useState<Id | null>(null);

  if (!session) {
    return (
      <p role="alert" className="mt-6 rounded-card bg-surface p-4 text-ink">
        {t("ledger.deni.sessionRequired", locale)}
      </p>
    );
  }

  if (list === undefined) {
    return (
      <p
        aria-live="polite"
        className="mt-6 rounded-card bg-surface p-4 text-moss"
      >
        {t("ledger.deni.loading", locale)}
      </p>
    );
  }

  return (
    <section
      aria-labelledby="deni-list-heading"
      className="mt-6 flex flex-col gap-5"
    >
      <h2 id="deni-list-heading" className="font-semibold text-lg text-ink">
        {t("ledger.deni.listHeading", locale)}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-card bg-surface p-4">
          <p className="text-sm text-moss">
            {t("ledger.deni.totalOutstanding", locale)}
          </p>
          <p className="mt-1 tabular text-2xl font-bold text-ink">
            {formatKES(list.totalOutstanding)}
          </p>
        </div>
        <div className="rounded-card bg-tomato-tint p-4">
          <p className="text-sm text-tomato">
            {t("ledger.deni.overdueTotal", locale)}
          </p>
          <p className="mt-1 tabular text-2xl font-bold text-tomato">
            {formatKES(list.overdueTotal)}
          </p>
        </div>
      </div>

      {list.rows.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-ink">
          {t("ledger.deni.empty", locale)}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.rows.map((row) => {
            const dueLabel = row.overdue
              ? t("ledger.deni.overdueLabel", locale)
              : row.earliestDue
                ? t("ledger.deni.dueOn", locale).replace(
                    "{date}",
                    new Intl.DateTimeFormat(
                      locale === "sw" ? "sw-KE" : "en-KE",
                      { dateStyle: "medium", timeZone: "Africa/Nairobi" },
                    ).format(new Date(`${row.earliestDue}T12:00:00+03:00`)),
                  )
                : t("ledger.deni.noDueDate", locale);
            return (
              <li
                key={row.customerId}
                className={`overflow-hidden rounded-card border border-line bg-surface ${
                  row.overdue
                    ? "border-l-4 border-l-tomato"
                    : "border-l-4 border-l-maize"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 pl-4">
                  <Link
                    href={`/debts/customer?id=${encodeURIComponent(row.customerId)}`}
                    aria-label={`${t("ledger.deni.viewLedger", locale)}: ${row.name}`}
                    className={`flex min-h-12 min-w-0 flex-1 flex-col justify-center rounded-card text-left ${focusRing}`}
                  >
                    <span className="font-semibold text-ink">{row.name}</span>
                    <span
                      className={`mt-1 text-sm ${
                        row.overdue ? "text-tomato" : "text-maize"
                      }`}
                    >
                      {dueLabel}
                    </span>
                  </Link>
                  <div className="flex items-center gap-3">
                    <strong className="tabular text-lg text-ink">
                      {formatKES(row.balance)}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setPaymentCustomerId(row.customerId)}
                      className={`${buttonClass} bg-sukuma text-surface hover:bg-sukuma-pressed`}
                    >
                      {t("ledger.deni.recordPayment", locale)}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {paymentCustomerId ? (
        <RecordPaymentSheet
          customerId={paymentCustomerId}
          onDone={() => setPaymentCustomerId(null)}
        />
      ) : null}
    </section>
  );
}
