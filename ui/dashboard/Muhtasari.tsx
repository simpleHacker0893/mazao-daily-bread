"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/auth/session";
import { formatNairobiDate } from "@/domain/dates";
import { formatKES } from "@/domain/money";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { useBusinessHeader, useDashboard, useToday } from "@/local/queries";
import { focusRing } from "@/ui/landing/primitives";
import { RecordPaymentSheet } from "@/ui/ledger/RecordPaymentSheet";
import { PageTitle } from "@/ui/PageTitle";

const buttonClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;
const linkClass = `inline-flex min-h-12 items-center font-semibold text-sukuma underline underline-offset-4 ${focusRing}`;

/**
 * Muhtasari / Overview. Every figure comes from `useDashboard` (domain functions over Dexie);
 * this component only formats and lays them out, and never calculates money.
 */
export function Muhtasari() {
  const locale = useLocale();
  const session = useSession();
  const today = useToday();
  const dashboard = useDashboard(today);
  const header = useBusinessHeader();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const title = <PageTitle title={t("shell.page.overview", locale)} />;

  if (!session) {
    return (
      <>
        {title}
        <p role="alert" className="mt-6 rounded-card bg-surface p-4 text-ink">
          {t("ledger.muhtasari.sessionRequired", locale)}
        </p>
      </>
    );
  }

  if (dashboard === undefined) {
    return (
      <>
        {title}
        <p
          aria-live="polite"
          className="mt-6 rounded-card bg-surface p-4 text-moss"
        >
          {t("ledger.muhtasari.loading", locale)}
        </p>
      </>
    );
  }

  const { totals } = dashboard;
  const dateLine = [
    header?.businessName,
    header?.location,
    formatNairobiDate(today, locale),
  ]
    .filter(Boolean)
    .join(" · ");
  const heroAmount = formatKES(totals.faidaHalisi);
  const moneyInRows = [
    {
      key: "cash",
      label: t("ledger.muhtasari.cash", locale),
      amount: totals.cashIn,
      share: dashboard.moneyIn.cash,
      bar: "bg-sukuma",
    },
    {
      key: "mpesa",
      label: t("ledger.muhtasari.mpesa", locale),
      amount: totals.mpesaIn,
      share: dashboard.moneyIn.mpesa,
      bar: "bg-mpesa",
    },
    {
      key: "other",
      label: t("ledger.muhtasari.other", locale),
      amount: totals.otherIn,
      share: dashboard.moneyIn.other,
      bar: "bg-moss",
    },
  ];
  const hasMoneyIn = moneyInRows.some((row) => row.share > 0);
  const topDeni = dashboard.deni.rows.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <header>
        {title}
        <p className="mt-1 text-sm text-moss">{dateLine}</p>
      </header>

      <section
        aria-labelledby="muhtasari-hero"
        data-testid="muhtasari-hero"
        className="flex flex-col gap-3"
      >
        <div>
          <h2 id="muhtasari-hero" className="font-semibold text-ink">
            {t("ledger.muhtasari.heroLabel", locale)}
          </h2>
          <p className="text-sm text-moss">
            {t("ledger.muhtasari.heroSub", locale)}
          </p>
          <p className="tabular mt-1 font-bold text-[36px] text-ink leading-[44px]">
            <span className="sr-only">
              {t("ledger.muhtasari.heroAria", locale).replace(
                "{amount}",
                heroAmount,
              )}
            </span>
            <span aria-hidden="true" data-testid="muhtasari-amount">
              {heroAmount}
            </span>
          </p>
        </div>
        <dl
          aria-label={t("ledger.muhtasari.statement", locale)}
          className="ml-auto grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm"
        >
          <dt className="text-moss">{t("ledger.muhtasari.sales", locale)}</dt>
          <dd className="tabular text-right text-ink">
            {formatKES(totals.sales)}
          </dd>
          <dt className="text-moss">
            {t("ledger.muhtasari.lessCogs", locale)}
          </dt>
          <dd className="tabular text-right text-ink">
            {formatKES(totals.cogs)}
          </dd>
          <dt className="text-moss">
            {t("ledger.muhtasari.lessExpenses", locale)}
          </dt>
          <dd className="tabular text-right text-ink">
            {formatKES(totals.expenses)}
          </dd>
        </dl>
      </section>

      {totals.sales === 0 && dashboard.recordCount === 0 ? (
        <p className="rounded-card bg-surface p-4 text-ink">
          {t("ledger.muhtasari.empty", locale)}
        </p>
      ) : null}

      <section
        aria-labelledby="muhtasari-actions"
        className="flex flex-col gap-3"
      >
        <h2 id="muhtasari-actions" className="sr-only">
          {t("ledger.muhtasari.actions", locale)}
        </h2>
        <Link
          href="/sales/new"
          className={`${buttonClass} w-full bg-sukuma text-surface hover:bg-sukuma-pressed`}
        >
          {t("ledger.muhtasari.newSale", locale)}
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/expenses/new"
            className={`${buttonClass} border border-line bg-surface text-ink`}
          >
            {t("ledger.muhtasari.newExpense", locale)}
          </Link>
          <button
            type="button"
            onClick={() => setPaymentOpen(true)}
            className={`${buttonClass} border border-line bg-surface text-ink`}
          >
            {t("ledger.muhtasari.recordPayment", locale)}
          </button>
        </div>
      </section>

      <section
        aria-labelledby="muhtasari-money-in"
        className="flex flex-col gap-3"
      >
        <h2 id="muhtasari-money-in" className="font-semibold text-ink">
          {t("ledger.muhtasari.moneyIn", locale)}
        </h2>
        {hasMoneyIn ? (
          <div
            aria-hidden="true"
            className="flex h-3 w-full overflow-hidden rounded-card bg-line"
          >
            {moneyInRows.map((row) => (
              <span
                key={row.key}
                className={row.bar}
                style={{ flexGrow: row.share, flexBasis: 0 }}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-moss">
            {t("ledger.muhtasari.noMoneyIn", locale)}
          </p>
        )}
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          {moneyInRows.map((row) => (
            <div key={row.key} className="contents">
              <dt className="text-moss">{row.label}</dt>
              <dd className="tabular text-right font-semibold text-ink">
                {formatKES(row.amount)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center justify-between gap-4 text-maize">
          <span>{t("ledger.muhtasari.deniGiven", locale)}</span>
          <span className="tabular font-semibold">
            {formatKES(dashboard.deniGiven)}
          </span>
        </p>
      </section>

      <section aria-labelledby="muhtasari-owes" className="flex flex-col gap-3">
        <h2 id="muhtasari-owes" className="font-semibold text-ink">
          {t("ledger.muhtasari.whoOwes", locale)}
        </h2>
        <p className="flex items-center justify-between gap-4">
          <span className="text-moss">
            {t("ledger.muhtasari.totalOwed", locale)}
          </span>
          <span className="tabular font-semibold text-ink">
            {formatKES(dashboard.deni.totalOutstanding)}
          </span>
        </p>
        {dashboard.deni.overdueTotal > 0 ? (
          <p className="flex items-center justify-between gap-4 text-tomato">
            <span>{t("ledger.muhtasari.overdue", locale)}</span>
            <span className="tabular font-semibold">
              {formatKES(dashboard.deni.overdueTotal)}
            </span>
          </p>
        ) : null}
        {topDeni.length === 0 ? (
          <p className="text-sm text-moss">
            {t("ledger.muhtasari.noDeni", locale)}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {topDeni.map((row) => (
              <li key={row.customerId}>
                <Link
                  href={`/debts/customer?id=${encodeURIComponent(row.customerId)}`}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-card border border-line border-l-4 bg-surface px-3 ${
                    row.overdue ? "border-l-tomato" : "border-l-maize"
                  } ${focusRing}`}
                >
                  <span className="min-w-0 truncate font-semibold text-ink">
                    {row.name}
                  </span>
                  <span className="flex items-center gap-2">
                    {row.overdue ? (
                      <span className="text-sm text-tomato">
                        {t("ledger.muhtasari.overdue", locale)}
                      </span>
                    ) : null}
                    <strong className="tabular text-ink">
                      {formatKES(row.balance)}
                    </strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/debts" className={linkClass}>
          {t("ledger.muhtasari.seeDebts", locale)}
        </Link>
      </section>

      {dashboard.supplierDeniTotal > 0 ? (
        <p className="flex items-center justify-between gap-4 text-maize">
          <span>{t("ledger.muhtasari.supplierDeni", locale)}</span>
          <span className="tabular font-semibold">
            {formatKES(dashboard.supplierDeniTotal)}
          </span>
        </p>
      ) : null}

      <section aria-labelledby="muhtasari-low" className="flex flex-col gap-2">
        <h2 id="muhtasari-low" className="font-semibold text-ink">
          {t("ledger.muhtasari.lowStock", locale)}
        </h2>
        {dashboard.lowStock.length === 0 ? (
          <p className="text-sm text-moss">
            {t("ledger.muhtasari.noLowStock", locale)}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {dashboard.lowStock.map((row) => (
              <li key={row.itemId} className="flex justify-between gap-3">
                <span className="text-ink">{row.name}</span>
                <span className="tabular text-moss">
                  {t("ledger.muhtasari.lowStockLeft", locale)
                    .replace("{quantity}", String(row.onHand))
                    .replace("{unit}", row.unit)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/today" className={linkClass}>
        {t("ledger.muhtasari.seeToday", locale).replace(
          "{count}",
          String(dashboard.recordCount),
        )}
      </Link>

      {paymentOpen ? (
        <RecordPaymentSheet onDone={() => setPaymentOpen(false)} />
      ) : null}
    </div>
  );
}
