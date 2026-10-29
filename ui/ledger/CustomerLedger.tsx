"use client";

import { useState } from "react";
import { useSession } from "@/auth/session";
import { formatKES } from "@/domain/money";
import type { Id, Txn } from "@/domain/types";
import { type MessageKey, t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import {
  useBusinessDb,
  useCustomerLedgerRows,
  useCustomerStanding,
} from "@/local/queries";
import { focusRing } from "@/ui/landing/primitives";
import { RecordPaymentSheet } from "./RecordPaymentSheet";
import { TxnDetailSheet } from "./TxnDetailSheet";

const buttonClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;
const entryLabels: Record<Txn["type"], MessageKey> = {
  sale: "ledger.deni.entrySale",
  expense: "ledger.deni.entryExpense",
  customer_payment: "ledger.deni.entryPayment",
  opening_balance: "ledger.deni.entryOpening",
  stock_adjustment: "ledger.deni.entryStock",
  void: "ledger.deni.entryVoid",
};

export function CustomerLedger({ customerId }: { customerId: Id }) {
  const locale = useLocale();
  const session = useSession();
  const business = useBusinessDb();
  const standing = useCustomerStanding(customerId);
  const rows = useCustomerLedgerRows(customerId);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [detailId, setDetailId] = useState<Id | null>(null);

  if (!session || !business) {
    return (
      <p role="alert" className="mt-6 rounded-card bg-surface p-4 text-ink">
        {t("ledger.deni.sessionRequired", locale)}
      </p>
    );
  }
  if (standing === undefined || rows === undefined) {
    return (
      <p
        aria-live="polite"
        className="mt-6 rounded-card bg-surface p-4 text-moss"
      >
        {t("ledger.deni.loading", locale)}
      </p>
    );
  }
  if (!standing.customer) {
    return (
      <p
        role="alert"
        className="mt-6 rounded-card bg-tomato-tint p-4 text-tomato"
      >
        {t("ledger.deni.customerNotFound", locale)}
      </p>
    );
  }

  const name = standing.customer.name;
  const balanceMessage =
    standing.standing.kind === "owes"
      ? t("ledger.deni.owesLine", locale)
          .replace("{name}", name)
          .replace("{amount}", formatKES(standing.standing.amount))
      : standing.standing.kind === "credit"
        ? t("ledger.deni.inCredit", locale)
            .replace("{name}", name)
            .replace("{amount}", formatKES(standing.standing.amount))
        : t("ledger.deni.owesNothing", locale).replace("{name}", name);
  const balanceColor =
    standing.standing.kind === "owes" && standing.overdue
      ? "text-tomato"
      : standing.standing.kind === "credit"
        ? "text-maize"
        : "text-ink";

  const formatDate = (at: string) =>
    new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Nairobi",
    }).format(new Date(at));

  return (
    <section className="mt-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg text-ink">{name}</h2>
          <p className={`mt-2 text-xl font-semibold tabular ${balanceColor}`}>
            {balanceMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPaymentOpen(true)}
          className={`${buttonClass} bg-sukuma text-surface hover:bg-sukuma-pressed`}
        >
          {t("ledger.deni.recordPayment", locale)}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-ink">
          {t("ledger.deni.ledgerEmpty", locale)}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {rows.map((row) => {
            const label = t(entryLabels[row.type], locale);
            const crossedOut = row.voided || row.type === "void";
            return (
              <li key={row.txnId}>
                <button
                  type="button"
                  onClick={() => setDetailId(row.txnId)}
                  aria-label={`${t("ledger.deni.details", locale)}, ${label}, ${formatDate(row.at)}`}
                  className={`flex min-h-12 w-full flex-col gap-2 rounded-card border border-line bg-surface p-4 text-left hover:border-sukuma ${focusRing} ${
                    crossedOut ? "opacity-70" : ""
                  }`}
                >
                  <span className="flex w-full items-start justify-between gap-3">
                    <span className={crossedOut ? "line-through" : ""}>
                      <span className="block text-sm text-moss">
                        {formatDate(row.at)}
                      </span>
                      <span className="mt-1 block font-medium text-ink">
                        {label}
                        {row.lineSummary ? ` · ${row.lineSummary}` : ""}
                      </span>
                    </span>
                    <strong
                      className={`shrink-0 tabular ${
                        crossedOut ? "line-through" : ""
                      }`}
                    >
                      {formatKES(row.amount)}
                    </strong>
                  </span>
                  <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-moss">
                      {row.broughtForward ? (
                        <span className="rounded-card bg-maize-tint px-2 py-1 text-ink">
                          {t("ledger.deni.broughtForward", locale)}
                        </span>
                      ) : null}
                      {row.paymentMethod ? (
                        <span>
                          {t(`ledger.sale.${row.paymentMethod}`, locale)}
                        </span>
                      ) : null}
                      {row.externalReference ? (
                        <span>{row.externalReference}</span>
                      ) : null}
                      {crossedOut ? (
                        <span className="font-semibold text-tomato">
                          {t("ledger.deni.voided", locale)}
                        </span>
                      ) : null}
                    </span>
                    <span className="tabular text-ink">
                      {t("ledger.deni.runningBalance", locale)}{" "}
                      {formatKES(row.runningBalance)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {paymentOpen ? (
        <RecordPaymentSheet
          customerId={customerId}
          onDone={() => setPaymentOpen(false)}
        />
      ) : null}
      {detailId ? (
        <TxnDetailSheet txnId={detailId} onClose={() => setDetailId(null)} />
      ) : null}
    </section>
  );
}
