"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/auth/session";
import { formatKES } from "@/domain/money";
import type { Id, Txn } from "@/domain/types";
import { type MessageKey, t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { useBusinessDb, useTxnDetail } from "@/local/queries";
import { saveVoid } from "@/local/save";
import { focusRing } from "@/ui/landing/primitives";

const buttonClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;
const overrideKeys = {
  NEGATIVE_STOCK: "ledger.grill.negativeStock",
  BELOW_COST: "ledger.grill.belowCost",
  PRICE_VARIANCE: "ledger.grill.priceVariance",
  POSSIBLE_DUPLICATE: "ledger.grill.possibleDuplicate",
} as const;
const recordTypeKeys: Record<Txn["type"], MessageKey> = {
  sale: "ledger.deni.entrySale",
  expense: "ledger.deni.entryExpense",
  customer_payment: "ledger.deni.entryPayment",
  opening_balance: "ledger.deni.entryOpening",
  stock_adjustment: "ledger.deni.entryStock",
  void: "ledger.deni.entryVoid",
};

export function TxnDetailSheet({
  txnId,
  onClose,
}: {
  txnId: Id;
  onClose: () => void;
}) {
  const locale = useLocale();
  const session = useSession();
  const db = useBusinessDb();
  const detail = useTxnDetail(txnId);
  const dialog = useRef<HTMLDialogElement>(null);
  const voidLock = useRef(false);
  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  const txn = detail?.txn;
  const title =
    txn?.type === "sale"
      ? t("ledger.sale.details", locale)
      : txn?.type === "expense"
        ? t("ledger.expense.details", locale)
        : txn?.type === "customer_payment"
          ? t("ledger.deni.entryPayment", locale)
          : txn?.type === "opening_balance"
            ? t("ledger.deni.entryOpening", locale)
            : txn?.type === "stock_adjustment"
              ? t("ledger.deni.entryStock", locale)
              : t("ledger.deni.entryVoid", locale);
  const time = txn
    ? new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Nairobi",
      }).format(new Date(txn.occurredAt))
    : "";

  async function confirmVoid() {
    if (voidLock.current || !session || !db || !detail?.canVoid || !txn) return;
    voidLock.current = true;
    setVoiding(true);
    setVoidError(null);
    try {
      const outcome = await saveVoid(
        { db, businessId: session.businessId, profileId: session.profileId },
        txn.id,
      );
      if (outcome.kind === "saved") {
        setConfirmingVoid(false);
      } else {
        setVoidError(t("ledger.deni.voidUnavailable", locale));
      }
    } catch {
      setVoidError(t("ledger.deni.voidError", locale));
    } finally {
      voidLock.current = false;
      setVoiding(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="txn-detail-title"
      onClose={onClose}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-sheet border-line border-t bg-chalk p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-ink backdrop:bg-ink/40 sm:inset-x-1/2 sm:bottom-1/2 sm:w-[min(34rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:translate-y-1/2 sm:rounded-card sm:border"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="txn-detail-title" className="text-xl font-semibold">
            {title}
          </h2>
          {time ? <p className="mt-1 text-sm text-moss">{time}</p> : null}
        </div>
        <button
          type="button"
          aria-label={t("ledger.deni.closeDetails", locale)}
          onClick={() => dialog.current?.close()}
          className={`${buttonClass} px-3 text-ink`}
        >
          ×
        </button>
      </div>

      {detail === undefined ? (
        <p
          aria-live="polite"
          className="mt-5 rounded-card bg-surface p-4 text-moss"
        >
          {t("ledger.deni.detailLoading", locale)}
        </p>
      ) : detail === null ? (
        <p
          role="alert"
          className="mt-5 rounded-card bg-tomato-tint p-4 text-tomato"
        >
          {t("ledger.deni.detailUnavailable", locale)}
        </p>
      ) : (
        <>
          <DetailContent detail={detail} time={time} locale={locale} />

          {detail.voided ? (
            <p className="mt-4 rounded-card bg-tomato-tint p-3 font-semibold text-tomato line-through">
              {t("ledger.deni.voided", locale)}
            </p>
          ) : null}
          {voidError ? (
            <p
              role="alert"
              className="mt-4 rounded-card bg-tomato-tint p-3 text-tomato"
            >
              {voidError}
            </p>
          ) : null}

          {confirmingVoid && detail.canVoid ? (
            <section
              aria-labelledby="confirm-void-title"
              className="mt-4 rounded-card bg-tomato-tint p-4"
            >
              <h3 id="confirm-void-title" className="font-semibold text-tomato">
                {txn?.type === "sale"
                  ? t("ledger.deni.confirmVoidSaleTitle", locale)
                  : t("ledger.deni.confirmVoidTitle", locale)}
              </h3>
              <p className="mt-2 text-sm text-ink">
                {txn?.type === "sale"
                  ? t("ledger.deni.confirmVoidSaleBody", locale)
                  : t("ledger.deni.confirmVoidBody", locale)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={voiding}
                  onClick={() => setConfirmingVoid(false)}
                  className={`${buttonClass} border border-line bg-surface text-ink disabled:opacity-60`}
                >
                  {t("ledger.deni.cancel", locale)}
                </button>
                <button
                  type="button"
                  disabled={voiding}
                  onClick={() => void confirmVoid()}
                  className={`${buttonClass} bg-tomato text-surface disabled:opacity-60`}
                >
                  {voiding
                    ? t("ledger.deni.voiding", locale)
                    : t("ledger.deni.confirmVoid", locale)}
                </button>
              </div>
            </section>
          ) : null}

          {detail.canVoid && !confirmingVoid ? (
            <button
              type="button"
              disabled={!session || !db || voiding}
              onClick={() => setConfirmingVoid(true)}
              className={`${buttonClass} mt-4 w-full bg-tomato text-surface disabled:opacity-60`}
            >
              {txn?.type === "sale"
                ? t("ledger.deni.voidSale", locale)
                : t("ledger.deni.voidRecord", locale)}
            </button>
          ) : null}
        </>
      )}
    </dialog>
  );
}

function DetailContent({
  detail,
  time,
  locale,
}: {
  detail: NonNullable<ReturnType<typeof useTxnDetail>>;
  time: string;
  locale: ReturnType<typeof useLocale>;
}) {
  const { txn } = detail;
  const method = txn.paymentMethod
    ? t(`ledger.sale.${txn.paymentMethod}`, locale)
    : undefined;
  const warningMessages = txn.overrides.flatMap((code) => {
    const key = overrideKeys[code as keyof typeof overrideKeys];
    return key ? [t(key, locale)] : [];
  });

  return (
    <div className="mt-5 flex flex-col gap-4">
      {txn.type === "sale" ? (
        <>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface px-4">
            {detail.lines.map((line) => (
              <li
                key={line.id}
                className="flex min-h-12 items-center justify-between gap-3 py-3"
              >
                <span>
                  {line.label}
                  <span className="ml-1 text-moss">
                    ×{" "}
                    {new Intl.NumberFormat(
                      locale === "sw" ? "sw-KE" : "en-KE",
                      { maximumFractionDigits: 3 },
                    ).format(line.quantity)}{" "}
                    {line.unit}
                  </span>
                </span>
                <strong className="shrink-0 tabular">
                  {formatKES(line.unitPrice)}
                </strong>
              </li>
            ))}
          </ul>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-moss">{t("ledger.sale.total", locale)}</dt>
            <dd className="text-right font-semibold tabular">
              {formatKES(txn.totalAmount)}
            </dd>
            <dt className="text-moss">{t("ledger.sale.paid", locale)}</dt>
            <dd className="text-right tabular">{formatKES(txn.amountPaid)}</dd>
            {detail.outstandingBalance > 0 ? (
              <>
                <dt className="text-moss">
                  {t("ledger.sale.outstanding", locale)}
                </dt>
                <dd className="text-right font-semibold tabular">
                  {formatKES(detail.outstandingBalance)}
                </dd>
              </>
            ) : null}
            {method ? (
              <DetailPair
                label={t("ledger.sale.paymentMethod", locale)}
                value={method}
              />
            ) : null}
            {detail.customerName ? (
              <DetailPair
                label={t("ledger.sale.customer", locale)}
                value={detail.customerName}
              />
            ) : null}
            {txn.dueDate ? (
              <DetailPair
                label={t("ledger.sale.dueDate", locale)}
                value={txn.dueDate}
              />
            ) : null}
            {txn.externalReference ? (
              <DetailPair
                label={t("ledger.sale.reference", locale)}
                value={txn.externalReference}
              />
            ) : null}
          </dl>
        </>
      ) : txn.type === "expense" ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <DetailPair
            label={t("ledger.expense.category", locale)}
            value={txn.expenseCategory ?? ""}
          />
          <DetailPair
            label={t("ledger.expense.amount", locale)}
            value={formatKES(txn.totalAmount)}
          />
          {method ? (
            <DetailPair
              label={t("ledger.expense.paymentMethod", locale)}
              value={method}
            />
          ) : null}
          {txn.description ? (
            <DetailPair
              label={t("ledger.expense.note", locale)}
              value={txn.description}
            />
          ) : null}
          <DetailPair label={t("ledger.expense.date", locale)} value={time} />
        </dl>
      ) : txn.type === "customer_payment" ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {detail.customerName ? (
            <DetailPair
              label={t("ledger.sale.customer", locale)}
              value={detail.customerName}
            />
          ) : null}
          <DetailPair
            label={t("ledger.deni.amount", locale)}
            value={formatKES(txn.amountPaid)}
          />
          {method ? (
            <DetailPair
              label={t("ledger.deni.paymentMethod", locale)}
              value={method}
            />
          ) : null}
          {txn.externalReference ? (
            <DetailPair
              label={t("ledger.sale.reference", locale)}
              value={txn.externalReference}
            />
          ) : null}
        </dl>
      ) : txn.type === "opening_balance" ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {detail.customerName ? (
            <DetailPair
              label={t("ledger.sale.customer", locale)}
              value={detail.customerName}
            />
          ) : null}
          <DetailPair
            label={t("ledger.expense.amount", locale)}
            value={formatKES(txn.totalAmount)}
          />
          {txn.source === "onboarding" ? (
            <>
              <dt className="text-moss">
                {t("ledger.deni.broughtForward", locale)}
              </dt>
              <dd className="text-right">
                {t("ledger.deni.broughtForward", locale)}
              </dd>
            </>
          ) : null}
          {txn.dueDate ? (
            <DetailPair
              label={t("ledger.sale.dueDate", locale)}
              value={txn.dueDate}
            />
          ) : null}
        </dl>
      ) : txn.type === "stock_adjustment" ? (
        <ul className="rounded-card bg-surface px-4">
          {detail.lines.map((line) => (
            <li
              key={line.id}
              className="flex min-h-12 items-center justify-between gap-3 py-3"
            >
              <span>{line.label}</span>
              <span className="tabular">
                {line.quantity} {line.unit}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-card bg-surface p-4">
          <p>
            {detail.voidedTxn
              ? t(recordTypeKeys[detail.voidedTxn.type], locale)
              : t("ledger.deni.detailUnavailable", locale)}
          </p>
          {detail.voidedTxn ? (
            <p className="mt-2 tabular font-semibold">
              {formatKES(detail.voidedTxn.totalAmount)}
            </p>
          ) : null}
        </div>
      )}

      {warningMessages.map((warning) => (
        <p key={warning} className="rounded-card bg-maize-tint p-3 text-ink">
          {t("ledger.deni.savedWarning", locale).replace("{warning}", warning)}
        </p>
      ))}
    </div>
  );
}

function DetailPair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-moss">{label}</dt>
      <dd className="text-right">{value}</dd>
    </>
  );
}
