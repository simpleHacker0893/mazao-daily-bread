"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/auth/session";
import { formatKES } from "@/domain/money";
import type { Id } from "@/domain/types";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { useTodayExpenses } from "@/local/queries";
import { focusRing } from "@/ui/landing/primitives";
import { TxnDetailSheet } from "./TxnDetailSheet";

const buttonClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;

export function ExpensesList() {
  const locale = useLocale();
  const session = useSession();
  const expenses = useTodayExpenses();
  const [selectedId, setSelectedId] = useState<Id | null>(null);

  if (!session) {
    return (
      <p role="alert" className="mt-6 rounded-card bg-surface p-4 text-ink">
        {t("ledger.expense.sessionRequiredList", locale)}
      </p>
    );
  }
  if (expenses === undefined) {
    return (
      <p
        aria-live="polite"
        className="mt-6 rounded-card bg-surface p-4 text-moss"
      >
        {t("ledger.expense.loadingList", locale)}
      </p>
    );
  }

  const formatTime = (at: string) =>
    new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Africa/Nairobi",
    }).format(new Date(at));

  return (
    <section
      aria-labelledby="today-expenses-heading"
      className="mt-6 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="today-expenses-heading"
          className="font-semibold text-lg text-ink"
        >
          {t("ledger.expense.today", locale)}
        </h2>
        <Link
          href="/expenses/new"
          className={`${buttonClass} bg-sukuma text-surface hover:bg-sukuma-pressed`}
        >
          {t("ledger.expense.newExpenseAction", locale)}
        </Link>
      </div>
      {expenses.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-ink">
          {t("ledger.expense.noExpenses", locale)}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <button
                type="button"
                onClick={() => setSelectedId(expense.id)}
                aria-label={`${t("ledger.deni.details", locale)}, ${expense.expenseCategory ?? ""}, ${formatTime(expense.occurredAt)}, ${formatKES(expense.totalAmount)}`}
                className={`flex min-h-12 w-full flex-col gap-2 rounded-card border border-line bg-surface p-4 text-left text-ink hover:border-sukuma ${focusRing} ${
                  expense.voided ? "opacity-70" : ""
                }`}
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className={expense.voided ? "line-through" : ""}>
                    <span className="block text-sm text-moss">
                      {formatTime(expense.occurredAt)}
                    </span>
                    <span className="mt-1 block font-medium">
                      {expense.expenseCategory}
                    </span>
                  </span>
                  <strong
                    className={`shrink-0 tabular ${
                      expense.voided ? "line-through" : ""
                    }`}
                  >
                    {formatKES(expense.totalAmount)}
                  </strong>
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {expense.paymentMethod ? (
                    <span>
                      {t(`ledger.sale.${expense.paymentMethod}`, locale)}
                    </span>
                  ) : null}
                  {expense.description ? (
                    <span>{expense.description}</span>
                  ) : null}
                  {expense.voided ? (
                    <span className="font-semibold text-tomato">
                      {t("ledger.deni.voided", locale)}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedId ? (
        <TxnDetailSheet
          txnId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </section>
  );
}
