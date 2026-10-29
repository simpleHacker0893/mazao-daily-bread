"use client";

import {
  Component,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useSession } from "@/auth/session";
import { formatKES } from "@/domain/money";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { CommitError, commitVoid } from "@/local/commit";
import type { ListedSale } from "@/local/queries";
import {
  useBusinessDb,
  useCustomers,
  useTodaySalesWithLines,
} from "@/local/queries";
import { focusRing } from "@/ui/landing/primitives";

const actionClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;

export function SalesList() {
  const locale = useLocale();
  const [retryKey, setRetryKey] = useState(0);
  return (
    <SalesQueryBoundary
      key={retryKey}
      fallback={
        <div
          role="alert"
          className="mt-6 rounded-card bg-tomato-tint p-4 text-tomato"
        >
          <p>{t("ledger.sale.listError", locale)}</p>
          <button
            type="button"
            className={`${actionClass} mt-3 bg-surface text-ink`}
            onClick={() => setRetryKey((current) => current + 1)}
          >
            {t("ledger.sale.retry", locale)}
          </button>
        </div>
      }
    >
      <SalesListContent />
    </SalesQueryBoundary>
  );
}

function SalesListContent() {
  const locale = useLocale();
  const session = useSession();
  const db = useBusinessDb();
  const sales = useTodaySalesWithLines();
  const customers = useCustomers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  const voidLock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const detailTitleId = useId();

  const selectedSale = sales?.find((sale) => sale.id === selectedId) ?? null;
  const customerName = selectedSale?.customerId
    ? customers?.find((customer) => customer.id === selectedSale.customerId)
        ?.name
    : undefined;

  useEffect(() => {
    const element = dialog.current;
    if (selectedSale && element && !element.open) element.showModal();
    if (!selectedSale && element?.open) element.close();
  }, [selectedSale]);

  if (!session || !db) {
    return (
      <p role="alert" className="mt-6 rounded-card bg-surface p-4 text-ink">
        {t("ledger.sale.sessionRequiredList", locale)}
      </p>
    );
  }

  if (sales === undefined || customers === undefined) {
    return (
      <p
        aria-live="polite"
        className="mt-6 rounded-card bg-surface p-4 text-moss"
      >
        {t("ledger.sale.listLoading", locale)}
      </p>
    );
  }

  const time = (occurredAt: string) =>
    new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Africa/Nairobi",
    }).format(new Date(occurredAt));

  async function confirmVoid() {
    if (
      voidLock.current ||
      !session ||
      !db ||
      !selectedSale ||
      selectedSale.voided
    )
      return;
    voidLock.current = true;
    setVoiding(true);
    setVoidError(null);
    try {
      await commitVoid(
        { db, businessId: session.businessId, profileId: session.profileId },
        selectedSale.id,
      );
      setConfirmingVoid(false);
    } catch (error) {
      setVoidError(
        error instanceof CommitError && error.codes.includes("CANNOT_VOID")
          ? t("ledger.sale.voidUnavailable", locale)
          : t("ledger.sale.voidError", locale),
      );
    } finally {
      voidLock.current = false;
      setVoiding(false);
    }
  }

  return (
    <section
      aria-labelledby="today-sales-heading"
      className="mt-6 flex flex-col gap-4"
    >
      <h2 id="today-sales-heading" className="font-semibold text-lg text-ink">
        {t("ledger.sale.today", locale)}
      </h2>
      {sales.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-moss">
          {t("ledger.sale.noSales", locale)}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sales.map((sale) => (
            <li key={sale.id}>
              <SaleCard
                sale={sale}
                time={time(sale.occurredAt)}
                customerName={
                  sale.customerId
                    ? customers.find(
                        (customer) => customer.id === sale.customerId,
                      )?.name
                    : undefined
                }
                locale={locale}
                onOpen={() => {
                  setVoidError(null);
                  setConfirmingVoid(false);
                  setSelectedId(sale.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        aria-labelledby={detailTitleId}
        onClose={() => {
          setSelectedId(null);
          setConfirmingVoid(false);
          setVoidError(null);
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-sheet border-line border-t bg-chalk p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-ink backdrop:bg-ink/40 sm:inset-x-1/2 sm:bottom-1/2 sm:w-[min(34rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:translate-y-1/2 sm:rounded-card sm:border"
      >
        {selectedSale ? (
          <SaleDetails
            sale={selectedSale}
            time={time(selectedSale.occurredAt)}
            customerName={customerName}
            locale={locale}
            titleId={detailTitleId}
            confirmingVoid={confirmingVoid}
            voiding={voiding}
            voidError={voidError}
            onStartVoid={() => {
              setVoidError(null);
              setConfirmingVoid(true);
            }}
            onCancelVoid={() => {
              setConfirmingVoid(false);
              setVoidError(null);
            }}
            onConfirmVoid={() => void confirmVoid()}
            onClose={() => dialog.current?.close()}
          />
        ) : null}
      </dialog>
    </section>
  );
}

function SaleCard({
  sale,
  time,
  customerName,
  locale,
  onOpen,
}: {
  sale: ListedSale;
  time: string;
  customerName: string | undefined;
  locale: ReturnType<typeof useLocale>;
  onOpen: () => void;
}) {
  const names = sale.lines
    .map((line) => line.label)
    .filter(Boolean)
    .join(", ");
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${t("ledger.sale.viewDetails", locale)}, ${time}, ${names}, ${formatKES(sale.totalAmount)}`}
      className={`flex min-h-12 w-full flex-col gap-2 rounded-card border border-line bg-surface p-4 text-left text-ink hover:border-sukuma ${focusRing} ${sale.voided ? "opacity-70" : ""}`}
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span className={sale.voided ? "line-through" : ""}>
          <span className="block text-sm text-moss">{time}</span>
          <span className="mt-1 block font-medium">{names || "—"}</span>
        </span>
        <strong
          className={`shrink-0 tabular ${sale.voided ? "line-through" : ""}`}
        >
          {formatKES(sale.totalAmount)}
        </strong>
      </span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>
          {t("ledger.sale.paid", locale)} · {formatKES(sale.amountPaid)}
        </span>
        {sale.paymentMethod ? (
          <span>{t(`ledger.sale.${sale.paymentMethod}`, locale)}</span>
        ) : null}
        {customerName ? (
          <span>
            {t("ledger.sale.customer", locale)} · {customerName}
          </span>
        ) : null}
        {sale.outstandingBalance > 0 ? (
          <span className="rounded-full bg-maize-tint px-2 py-1 text-ink">
            {t("ledger.sale.outstanding", locale)} ·{" "}
            {formatKES(sale.outstandingBalance)}
          </span>
        ) : null}
        {sale.voided ? (
          <span className="font-semibold text-tomato">
            {t("ledger.sale.voided", locale)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function SaleDetails({
  sale,
  time,
  customerName,
  locale,
  titleId,
  confirmingVoid,
  voiding,
  voidError,
  onStartVoid,
  onCancelVoid,
  onConfirmVoid,
  onClose,
}: {
  sale: ListedSale;
  time: string;
  customerName: string | undefined;
  locale: ReturnType<typeof useLocale>;
  titleId: string;
  confirmingVoid: boolean;
  voiding: boolean;
  voidError: string | null;
  onStartVoid: () => void;
  onCancelVoid: () => void;
  onConfirmVoid: () => void;
  onClose: () => void;
}) {
  const payment = sale.paymentMethod
    ? t(`ledger.sale.${sale.paymentMethod}`, locale)
    : "—";
  return (
    <div className="flex max-h-[80dvh] flex-col gap-4 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="font-semibold text-xl">
            {t("ledger.sale.details", locale)}
          </h2>
          <p className="mt-1 text-sm text-moss">{time}</p>
        </div>
        <button
          type="button"
          aria-label={t("ledger.sale.closeDetails", locale)}
          onClick={onClose}
          className={`${actionClass} px-3 text-ink`}
        >
          ×
        </button>
      </div>

      <ul className="divide-y divide-line rounded-card border border-line bg-surface px-4">
        {sale.lines.map((line) => (
          <li
            key={line.id}
            className="flex min-h-12 items-center justify-between gap-3 py-3"
          >
            <span>
              {line.label || "—"}{" "}
              <span className="text-moss">
                ×{" "}
                {new Intl.NumberFormat(locale === "sw" ? "sw-KE" : "en-KE", {
                  maximumFractionDigits: 3,
                }).format(line.quantity)}{" "}
                {line.unit}
              </span>
            </span>
            <span className="shrink-0 text-right font-medium tabular">
              {formatKES(line.unitPrice)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-moss">{t("ledger.sale.total", locale)}</dt>
        <dd className="text-right font-semibold tabular">
          {formatKES(sale.totalAmount)}
        </dd>
        <dt className="text-moss">{t("ledger.sale.paid", locale)}</dt>
        <dd className="text-right tabular">{formatKES(sale.amountPaid)}</dd>
        {sale.outstandingBalance > 0 ? (
          <>
            <dt className="text-moss">
              {t("ledger.sale.outstanding", locale)}
            </dt>
            <dd className="text-right font-semibold tabular">
              {formatKES(sale.outstandingBalance)}
            </dd>
          </>
        ) : null}
        <dt className="text-moss">{t("ledger.sale.paymentMethod", locale)}</dt>
        <dd className="text-right">{payment}</dd>
        {customerName ? (
          <>
            <dt className="text-moss">{t("ledger.sale.customer", locale)}</dt>
            <dd className="text-right">{customerName}</dd>
          </>
        ) : null}
        {sale.dueDate ? (
          <>
            <dt className="text-moss">{t("ledger.sale.dueDate", locale)}</dt>
            <dd className="text-right">{sale.dueDate}</dd>
          </>
        ) : null}
        {sale.externalReference ? (
          <>
            <dt className="text-moss">{t("ledger.sale.reference", locale)}</dt>
            <dd className="text-right">{sale.externalReference}</dd>
          </>
        ) : null}
      </dl>

      {sale.voided ? (
        <p className="rounded-card bg-tomato-tint p-3 font-semibold text-tomato line-through">
          {t("ledger.sale.voided", locale)}
        </p>
      ) : null}
      {voidError ? (
        <p role="alert" className="rounded-card bg-tomato-tint p-3 text-tomato">
          {voidError}
        </p>
      ) : null}

      {confirmingVoid && !sale.voided ? (
        <section
          aria-labelledby="confirm-void-title"
          className="rounded-card border border-tomato/40 bg-tomato-tint p-4"
        >
          <h3 id="confirm-void-title" className="font-semibold">
            {t("ledger.sale.confirmVoidTitle", locale)}
          </h3>
          <p className="mt-2 text-sm">
            {t("ledger.sale.confirmVoidBody", locale)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={voiding}
              onClick={onCancelVoid}
              className={`${actionClass} border border-line bg-surface text-ink disabled:opacity-60`}
            >
              {t("ledger.sale.cancel", locale)}
            </button>
            <button
              type="button"
              disabled={voiding}
              onClick={onConfirmVoid}
              className={`${actionClass} bg-tomato px-5 text-surface disabled:opacity-60`}
            >
              {voiding
                ? t("ledger.sale.voiding", locale)
                : t("ledger.sale.confirmVoid", locale)}
            </button>
          </div>
        </section>
      ) : null}

      {!sale.voided && !confirmingVoid ? (
        <button
          type="button"
          disabled={voiding}
          onClick={onStartVoid}
          className={`${actionClass} bg-tomato text-surface disabled:opacity-60`}
        >
          {t("ledger.sale.void", locale)}
        </button>
      ) : null}
    </div>
  );
}

class SalesQueryBoundary extends Component<
  {
    children: ReactNode;
    fallback: ReactNode;
  },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
