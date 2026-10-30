"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useSession } from "@/auth/session";
import { formatNairobiDate, formatNairobiTime } from "@/domain/dates";
import { formatKES } from "@/domain/money";
import {
  type DayCustomer,
  type DayEntry,
  type DaySummaryStrings,
  formatDaySummaryText,
} from "@/domain/summary";
import type { Id } from "@/domain/types";
import { type MessageKey, t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import {
  useBusinessHeader,
  useCustomers,
  useDayReport,
  useItemsWithStock,
  useToday,
} from "@/local/queries";
import { focusRing } from "@/ui/landing/primitives";
import { TxnDetailSheet } from "@/ui/ledger/TxnDetailSheet";
import { PageTitle } from "@/ui/PageTitle";
import { type ShareResult, shareSummary } from "./share-summary";

const buttonClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;

const kindKeys: Record<DayEntry["kind"], MessageKey> = {
  sale: "ledger.deni.entrySale",
  expense: "ledger.deni.entryExpense",
  payment: "ledger.deni.entryPayment",
  void: "ledger.deni.entryVoid",
  brought_forward: "ledger.leo.broughtForward",
};

/**
 * Leo / Today report. Totals, rows and the shared text all come from `useDayReport`, whose
 * totals are `daySummary`, so they match Muhtasari. No money is calculated here.
 */
export function Leo() {
  const locale = useLocale();
  const session = useSession();
  const today = useToday();
  const report = useDayReport(today);
  const header = useBusinessHeader();
  const customers = useCustomers();
  const items = useItemsWithStock();
  const [selectedId, setSelectedId] = useState<Id | null>(null);
  const [includeNames, setIncludeNames] = useState(false);
  const [status, setStatus] = useState<ShareResult | null>(null);
  const [manualText, setManualText] = useState<string | null>(null);
  const sharing = useRef(false);

  const title = <PageTitle title={t("shell.page.today", locale)} />;

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
  if (report === undefined || customers === undefined || items === undefined) {
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

  const customerNames = new Map(customers.map((c) => [c.id, c.name]));
  const itemNames = new Map(items.map(({ item }) => [item.id, item.name]));
  const dateLabel = formatNairobiDate(today, locale);
  const { totals } = report;
  const mainEntries = report.entries.filter(
    (e) => e.kind !== "brought_forward",
  );
  const broughtForward = report.entries.filter(
    (e) => e.kind === "brought_forward",
  );

  const strings: DaySummaryStrings = {
    sales: t("ledger.leo.text.sales", locale),
    cogs: t("ledger.leo.text.cogs", locale),
    expenses: t("ledger.leo.text.expenses", locale),
    faidaHalisi: t("ledger.leo.text.faidaHalisi", locale),
    cashIn: t("ledger.leo.text.cashIn", locale),
    mpesaIn: t("ledger.leo.text.mpesaIn", locale),
    deniGiven: t("ledger.leo.text.deniGiven", locale),
    customers: t("ledger.leo.text.customers", locale),
    walkIn: t("ledger.leo.text.walkIn", locale),
    bought: t("ledger.leo.text.bought", locale),
    paid: t("ledger.leo.text.paid", locale),
    owes: t("ledger.leo.text.owes", locale),
    owesNothing: t("ledger.leo.text.owesNothing", locale),
    inCredit: t("ledger.leo.text.inCredit", locale),
  };

  async function share() {
    if (!report || sharing.current) return;
    sharing.current = true;
    setStatus(null);
    setManualText(null);
    const text = formatDaySummaryText(
      report,
      { businessName: header?.businessName ?? "", dateLabel },
      strings,
      { includeCustomerNames: includeNames },
    );
    try {
      const result = await shareSummary(text);
      setStatus(result);
      if (result === "manual") setManualText(text);
    } finally {
      sharing.current = false;
    }
  }

  function entryLabel(entry: DayEntry): string {
    const kind = t(kindKeys[entry.kind], locale);
    if (entry.kind === "expense") return entry.expenseCategory || kind;
    if (entry.kind === "sale") {
      const names = entry.lines
        .map(
          (l) => l.description || (l.itemId && itemNames.get(l.itemId)) || "",
        )
        .filter(Boolean)
        .join(", ");
      return names || kind;
    }
    return kind;
  }

  function entryParty(entry: DayEntry): string {
    const id = entry.customerId;
    return id ? (customerNames.get(id) ?? "") : "";
  }

  function standingLabel(row: DayCustomer): string {
    if (row.standing.kind === "owes") {
      return t("ledger.leo.owes", locale).replace(
        "{amount}",
        formatKES(row.standing.amount),
      );
    }
    if (row.standing.kind === "credit") {
      return t("ledger.leo.inCredit", locale).replace(
        "{amount}",
        formatKES(row.standing.amount),
      );
    }
    return t("ledger.leo.owesNothing", locale);
  }

  function renderEntry(entry: DayEntry) {
    const party = entryParty(entry);
    const voidedLook = entry.voided;
    return (
      <li key={entry.txnId}>
        <button
          type="button"
          onClick={() => setSelectedId(entry.txnId)}
          aria-label={`${t("ledger.leo.openEntry", locale)}: ${entryLabel(entry)}, ${formatNairobiTime(entry.at)}`}
          className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-card border border-line bg-surface px-3 py-2 text-left ${focusRing}`}
        >
          <span className="flex min-w-0 flex-col">
            <span className="tabular text-sm text-moss">
              {formatNairobiTime(entry.at)}
            </span>
            <span
              className={`truncate font-semibold text-ink ${voidedLook ? "line-through" : ""}`}
            >
              {entryLabel(entry)}
            </span>
            {party ? (
              <span className="truncate text-sm text-moss">{party}</span>
            ) : null}
            {entry.kind === "sale" && entry.deni > 0 ? (
              <span className="text-sm text-maize">
                {t("ledger.leo.deni", locale).replace(
                  "{amount}",
                  formatKES(entry.deni),
                )}
              </span>
            ) : null}
            {voidedLook ? (
              <span className="text-sm text-tomato">
                {t("ledger.leo.voided", locale)}
              </span>
            ) : null}
            {entry.kind === "void" && entry.voidsEarlierDay ? (
              <span className="text-sm text-tomato">
                {t("ledger.leo.changedEarlier", locale).replace(
                  "{day}",
                  formatNairobiDate(entry.voidsEarlierDay, locale),
                )}
              </span>
            ) : null}
            {entry.kind === "brought_forward" && entry.lines.length > 0
              ? entry.lines.map((l) => (
                  <span
                    key={`${entry.txnId}-${l.itemId}`}
                    className="text-sm text-moss"
                  >
                    {`${l.quantity} ${l.unit} ${(l.itemId && itemNames.get(l.itemId)) || l.description}`.trim()}
                  </span>
                ))
              : null}
          </span>
          {entry.kind !== "brought_forward" || entry.amount > 0 ? (
            <span
              className={`tabular font-semibold text-ink ${voidedLook ? "line-through" : ""}`}
            >
              {formatKES(entry.amount)}
            </span>
          ) : null}
        </button>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        {title}
        <p className="mt-1 text-sm text-moss">{dateLabel}</p>
      </header>

      <section aria-labelledby="leo-totals" className="flex flex-col gap-2">
        <h2 id="leo-totals" className="font-semibold text-ink">
          {t("ledger.leo.totals", locale)}
        </h2>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          <dt className="text-moss">{t("ledger.muhtasari.sales", locale)}</dt>
          <dd className="tabular text-right text-ink">
            {formatKES(totals.sales)}
          </dd>
          <dt className="text-moss">{t("ledger.leo.text.cogs", locale)}</dt>
          <dd className="tabular text-right text-ink">
            {formatKES(totals.cogs)}
          </dd>
          <dt className="text-moss">{t("ledger.leo.text.expenses", locale)}</dt>
          <dd className="tabular text-right text-ink">
            {formatKES(totals.expenses)}
          </dd>
          <dt className="font-semibold text-ink">
            {t("ledger.muhtasari.heroLabel", locale)}
          </dt>
          <dd className="tabular text-right font-bold text-ink">
            {formatKES(totals.faidaHalisi)}
          </dd>
          <dt className="text-moss">{t("ledger.muhtasari.cash", locale)}</dt>
          <dd className="tabular text-right text-ink">
            {formatKES(totals.cashIn)}
          </dd>
          <dt className="text-moss">{t("ledger.muhtasari.mpesa", locale)}</dt>
          <dd className="tabular text-right text-ink">
            {formatKES(totals.mpesaIn)}
          </dd>
          <dt className="text-maize">
            {t("ledger.muhtasari.deniGiven", locale)}
          </dt>
          <dd className="tabular text-right text-maize">
            {formatKES(report.deniGiven)}
          </dd>
        </dl>
      </section>

      <section aria-labelledby="leo-entries" className="flex flex-col gap-3">
        <h2 id="leo-entries" className="font-semibold text-ink">
          {t("ledger.leo.entries", locale)}
        </h2>
        {report.entries.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-card bg-surface p-4">
            <p className="text-ink">{t("ledger.leo.empty", locale)}</p>
            <Link
              href="/sales/new"
              className={`${buttonClass} bg-sukuma text-surface hover:bg-sukuma-pressed`}
            >
              {t("ledger.muhtasari.newSale", locale)}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {mainEntries.map(renderEntry)}
          </ul>
        )}
        {broughtForward.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-ink">
              {t("ledger.leo.broughtForward", locale)}
            </h3>
            <p className="text-sm text-moss">
              {t("ledger.leo.notCounted", locale)}
            </p>
            <ul className="flex flex-col gap-2">
              {broughtForward.map(renderEntry)}
            </ul>
          </div>
        ) : null}
      </section>

      {report.customers.length > 0 ? (
        <section
          aria-labelledby="leo-customers"
          className="flex flex-col gap-2"
        >
          <h2 id="leo-customers" className="font-semibold text-ink">
            {t("ledger.leo.customers", locale)}
          </h2>
          <ul className="flex flex-col gap-2">
            {report.customers.map((row) => {
              const body = (
                <>
                  <span className="font-semibold text-ink">
                    {row.name ?? t("ledger.leo.walkIn", locale)}
                  </span>
                  <span className="text-sm text-moss">
                    {t("ledger.leo.bought", locale).replace(
                      "{amount}",
                      formatKES(row.bought),
                    )}
                    {" · "}
                    {t("ledger.leo.paid", locale).replace(
                      "{amount}",
                      formatKES(row.paid),
                    )}
                  </span>
                  <span
                    className={`text-sm ${row.standing.kind === "owes" ? "text-maize" : "text-moss"}`}
                  >
                    {row.customerId === null ? "" : standingLabel(row)}
                  </span>
                </>
              );
              const rowClass = `flex min-h-12 flex-col justify-center rounded-card border border-line bg-surface px-3 py-2 ${focusRing}`;
              return (
                <li key={row.customerId ?? "walk-in"}>
                  {row.customerId === null ? (
                    <div className={rowClass}>{body}</div>
                  ) : (
                    <Link
                      href={`/debts/customer?id=${encodeURIComponent(row.customerId)}`}
                      className={rowClass}
                    >
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section
        aria-label={t("ledger.leo.share", locale)}
        className="flex flex-col gap-3"
      >
        <label className="flex min-h-12 items-center gap-3 text-ink">
          <input
            type="checkbox"
            checked={includeNames}
            onChange={(event) => setIncludeNames(event.target.checked)}
            className="size-6"
          />
          {t("ledger.leo.includeNames", locale)}
        </label>
        <button
          type="button"
          onClick={share}
          className={`${buttonClass} bg-sukuma text-surface hover:bg-sukuma-pressed`}
        >
          {t("ledger.leo.share", locale)}
        </button>
        {status === "copied" ? (
          <output className="text-sm text-moss">
            {t("ledger.leo.copied", locale)}
          </output>
        ) : null}
        {status === "shared" ? (
          <output className="text-sm text-moss">
            {t("ledger.leo.shared", locale)}
          </output>
        ) : null}
        {manualText !== null ? (
          <div className="flex flex-col gap-2">
            <p role="alert" className="text-sm text-tomato">
              {t("ledger.leo.copyManually", locale)}
            </p>
            <textarea
              readOnly
              aria-label={t("ledger.leo.summaryText", locale)}
              value={manualText}
              rows={10}
              onFocus={(event) => event.currentTarget.select()}
              className="w-full rounded-card border border-line bg-surface p-3 text-ink"
            />
          </div>
        ) : null}
      </section>

      {selectedId ? (
        <TxnDetailSheet
          txnId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}
