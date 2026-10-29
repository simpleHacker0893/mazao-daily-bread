"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/auth/session";
import type { Issue } from "@/domain/grill";
import { formatKES, fromCents, toCents } from "@/domain/money";
import type { Id, PaymentMethod } from "@/domain/types";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import {
  useBusinessDb,
  useCustomers,
  useOperatingProfile,
  usePaymentPreview,
} from "@/local/queries";
import { savePayment } from "@/local/save";
import { focusRing } from "@/ui/landing/primitives";

const buttonClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;
const fieldClass = `min-h-12 w-full rounded-card border border-line bg-surface px-3 text-ink placeholder:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma ${focusRing}`;
const paymentMethods: PaymentMethod[] = ["cash", "mpesa", "other"];

function parseAmount(raw: string): number | null {
  if (!/^\d+(?:\.\d{0,2})?$/.test(raw)) return null;
  const parsed = toCents(raw);
  return parsed > 0 ? parsed : null;
}

export function RecordPaymentSheet({
  customerId,
  onDone,
}: {
  customerId?: Id;
  onDone: () => void;
}) {
  const locale = useLocale();
  const session = useSession();
  const db = useBusinessDb();
  const customers = useCustomers();
  const profile = useOperatingProfile();
  const dialog = useRef<HTMLDialogElement>(null);
  const saveLock = useRef(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customerId ?? "",
  );
  const [search, setSearch] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [pendingOverride, setPendingOverride] = useState<Issue[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const amount = parseAmount(amountRaw) ?? 0;
  const preview = usePaymentPreview(selectedCustomerId || undefined, amount);
  const selectedCustomer = customers?.find(
    (customer) => customer.id === selectedCustomerId,
  );
  const methods = profile?.paymentMethods.length
    ? profile.paymentMethods
    : paymentMethods;

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  useEffect(() => {
    if (!profile) return;
    setMethod(
      profile.paymentMethods.includes("cash")
        ? "cash"
        : (profile.paymentMethods[0] ?? "cash"),
    );
  }, [profile]);

  const matchingCustomers = (customers ?? []).filter((customer) =>
    customer.name
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );

  function close() {
    if (saving) return;
    const element = dialog.current;
    if (element?.open) element.close();
    else onDone();
  }

  async function submit(override = false) {
    if (
      saveLock.current ||
      !session ||
      !db ||
      !selectedCustomerId ||
      amount === 0
    )
      return;
    saveLock.current = true;
    setSaving(true);
    setPendingOverride([]);
    setSaveError(null);
    try {
      const outcome = await savePayment(
        { db, businessId: session.businessId, profileId: session.profileId },
        {
          customerId: selectedCustomerId,
          amount,
          paymentMethod: method,
          ...(method === "mpesa" && reference.trim()
            ? { externalReference: reference.trim() }
            : {}),
        },
        override ? { override: true } : {},
      );
      if (outcome.kind === "saved") {
        const element = dialog.current;
        if (element?.open) element.close();
        else onDone();
      } else if (outcome.kind === "needs_override") {
        setPendingOverride(outcome.issues);
      } else {
        setSaveError(
          outcome.issues.length > 0
            ? outcome.issues
                .map((issue) => t(issue.messageKey, locale))
                .join(" ")
            : t("ledger.deni.paymentSaveError", locale),
        );
      }
    } catch {
      setSaveError(t("ledger.deni.paymentSaveError", locale));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  const standingMessage =
    preview && selectedCustomer
      ? preview.nextStanding.kind === "owes"
        ? t("ledger.deni.owesLine", locale)
            .replace("{name}", selectedCustomer.name)
            .replace("{amount}", formatKES(preview.nextStanding.amount))
        : preview.nextStanding.kind === "credit"
          ? t("ledger.deni.inCredit", locale)
              .replace("{name}", selectedCustomer.name)
              .replace("{amount}", formatKES(preview.nextStanding.amount))
          : t("ledger.deni.owesNothing", locale).replace(
              "{name}",
              selectedCustomer.name,
            )
      : null;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="record-payment-title"
      onClose={onDone}
      onCancel={(event) => {
        if (saving) event.preventDefault();
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-sheet border-line border-t bg-chalk p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-ink backdrop:bg-ink/40 sm:inset-x-1/2 sm:bottom-1/2 sm:w-[min(34rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:translate-y-1/2 sm:rounded-card sm:border"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="record-payment-title" className="text-xl font-semibold">
            {t("ledger.deni.paymentTitle", locale)}
          </h2>
          {selectedCustomer ? (
            <p className="mt-1 text-sm text-moss">{selectedCustomer.name}</p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={t("ledger.deni.closeDetails", locale)}
          onClick={close}
          className={`${buttonClass} px-3 text-ink`}
        >
          ×
        </button>
      </div>

      {!customerId && !selectedCustomerId ? (
        <section className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 font-medium">
            {t("ledger.deni.chooseCustomer", locale)}
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("ledger.deni.searchCustomers", locale)}
              className={fieldClass}
            />
          </label>
          {matchingCustomers.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto rounded-card border border-line bg-surface">
              {matchingCustomers.map((customer) => (
                <li
                  key={customer.id}
                  className="border-b border-line last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`min-h-12 w-full px-3 text-left hover:bg-chalk ${focusRing}`}
                  >
                    {customer.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-moss">
              {t("ledger.deni.noCustomers", locale)}
            </p>
          )}
        </section>
      ) : null}

      {selectedCustomerId ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(pendingOverride.length > 0);
          }}
          className="mt-5 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 font-medium">
            {t("ledger.deni.amount", locale)}
            <input
              type="text"
              inputMode="decimal"
              value={amountRaw}
              aria-invalid={amountRaw.length > 0 && amount === 0}
              onChange={(event) => {
                setAmountRaw(event.target.value);
                setPendingOverride([]);
                setSaveError(null);
              }}
              className={fieldClass}
            />
          </label>
          {amountRaw.length > 0 && amount === 0 ? (
            <p role="alert" className="text-sm text-tomato">
              {t("ledger.deni.paymentAmountInvalid", locale)}
            </p>
          ) : null}

          {preview ? (
            <>
              <fieldset className="flex flex-wrap gap-2">
                <legend className="mb-2 w-full text-sm font-medium text-ink">
                  {t("ledger.deni.paymentTitle", locale)}
                </legend>
                {preview.quick.all !== null ? (
                  <button
                    type="button"
                    onClick={() =>
                      setAmountRaw(fromCents(preview.quick.all ?? 0).toString())
                    }
                    className={`${buttonClass} border border-maize bg-maize-tint text-ink hover:bg-maize-tint/80`}
                  >
                    {t("ledger.deni.payAll", locale)}{" "}
                    {formatKES(preview.quick.all)}
                  </button>
                ) : null}
                {preview.quick.rounds.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() =>
                      setAmountRaw(fromCents(quickAmount).toString())
                    }
                    className={`${buttonClass} border border-line bg-surface text-ink hover:bg-chalk`}
                  >
                    {formatKES(quickAmount)}
                  </button>
                ))}
              </fieldset>
              <div className="rounded-card bg-surface p-3">
                <p className="text-sm text-moss">
                  {t("ledger.deni.newBalance", locale)}
                </p>
                <p className="mt-1 font-semibold tabular text-ink">
                  {standingMessage}
                </p>
                {preview.preview.creditCreated > 0 && selectedCustomer ? (
                  <p className="mt-2 text-sm text-maize">
                    {t("ledger.deni.creditCreated", locale)
                      .replace(
                        "{amount}",
                        formatKES(preview.preview.creditCreated),
                      )
                      .replace("{name}", selectedCustomer.name)}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-2 w-full text-sm font-medium text-ink">
              {t("ledger.deni.paymentMethod", locale)}
            </legend>
            {methods.map((paymentMethod) => (
              <button
                key={paymentMethod}
                type="button"
                aria-pressed={method === paymentMethod}
                onClick={() => setMethod(paymentMethod)}
                className={`${buttonClass} border border-line ${
                  method === paymentMethod
                    ? "bg-sukuma text-surface"
                    : "bg-surface text-ink hover:bg-chalk"
                }`}
              >
                {t(`ledger.sale.${paymentMethod}`, locale)}
              </button>
            ))}
          </fieldset>
          {method === "mpesa" ? (
            <label className="flex flex-col gap-1.5 font-medium">
              {t("ledger.deni.mpesaReference", locale)}
              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className={fieldClass}
              />
            </label>
          ) : null}

          {pendingOverride.length > 0 ? (
            <div
              role="alert"
              className="rounded-card bg-maize-tint p-3 text-ink"
            >
              {pendingOverride.map((issue) => (
                <p key={issue.code}>{t(issue.messageKey, locale)}</p>
              ))}
            </div>
          ) : null}
          {saveError ? (
            <p
              role="alert"
              className="rounded-card bg-tomato-tint p-3 text-tomato"
            >
              {saveError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={close}
              className={`${buttonClass} border border-line bg-surface text-ink disabled:opacity-60`}
            >
              {t("ledger.deni.cancel", locale)}
            </button>
            <button
              type="submit"
              disabled={
                !session || !db || amount === 0 || !selectedCustomer || saving
              }
              className={`${buttonClass} flex-1 bg-sukuma text-surface hover:bg-sukuma-pressed disabled:opacity-60`}
            >
              {saving
                ? t("ledger.deni.savingPayment", locale)
                : pendingOverride.length > 0
                  ? t("ledger.sale.saveAnyway", locale)
                  : t("ledger.deni.savePayment", locale)}
            </button>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
