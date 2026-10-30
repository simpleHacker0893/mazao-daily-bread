"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/auth/session";
import { type DueRule, resolveDueRule, todayInNairobi } from "@/domain/dates";
import type { Issue, IssueCode } from "@/domain/grill";
import {
  formatKES,
  fromCents,
  linesTotal,
  lineTotal,
  toCents,
} from "@/domain/money";
import type {
  DraftLine,
  DraftSale,
  Id,
  Item,
  PaymentMethod,
} from "@/domain/types";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { CommitError, commitSale, NeedsOverride } from "@/local/commit";
import {
  useBusinessDb,
  useCustomers,
  useItemsWithStock,
  useOperatingProfile,
  useRecentItems,
} from "@/local/queries";
import { focusRing } from "@/ui/landing/primitives";

type SaleLineState = {
  key: string;
  item: Item;
  quantity: string;
  unitPrice: string;
};

type ParsedLine = {
  state: SaleLineState;
  quantity: number;
  unitPrice: number;
  total: number;
};

type CustomerChoice = "" | "new" | Id;
type RuleChoice = DueRule | null;

const dueRules: DueRule[] = [
  "kesho",
  "ijumaa",
  "wiki_ijayo",
  "mwisho_wa_mwezi",
];

const fieldClass = `min-h-12 w-full rounded-card border border-line bg-surface px-3 text-ink placeholder:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma ${focusRing}`;
const buttonBase = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;

function parseQuantity(raw: string, allowsFractional: boolean): number | null {
  if (!/^\d+(?:\.\d{0,3})?$/.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (!allowsFractional && !Number.isInteger(value)) return null;
  return value;
}

function parseKes(raw: string): number | null {
  if (!/^\d+(?:\.\d{0,2})?$/.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return toCents(raw);
}

export function NewSaleForm() {
  const locale = useLocale();
  const router = useRouter();
  const session = useSession();
  const db = useBusinessDb();
  const stockItems = useItemsWithStock();
  const recentItems = useRecentItems(8);
  const customers = useCustomers();
  const profile = useOperatingProfile();

  const [lines, setLines] = useState<SaleLineState[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paidRaw, setPaidRaw] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [customerChoice, setCustomerChoice] = useState<CustomerChoice>("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [dueRule, setDueRule] = useState<RuleChoice>(null);
  const [dueRuleReady, setDueRuleReady] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<Issue[]>([]);
  const [hardIssues, setHardIssues] = useState<Issue[]>([]);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const savingLock = useRef(false);
  const successTimer = useRef<number | null>(null);
  const initializedDueRule = useRef(false);

  useEffect(() => {
    if (profile && !initializedDueRule.current) {
      initializedDueRule.current = true;
      setDueRule(profile.defaultDueRule);
      setDueRuleReady(true);
    }
  }, [profile]);

  useEffect(
    () => () => {
      if (successTimer.current !== null)
        window.clearTimeout(successTimer.current);
    },
    [],
  );

  const activeItems = stockItems?.map(({ item }) => item) ?? [];
  const activeById = new Map(activeItems.map((item) => [item.id, item]));
  const recent = (recentItems ?? []).flatMap((item) => {
    const active = activeById.get(item.id);
    return active ? [active] : [];
  });
  const recentIds = new Set(recent.map((item) => item.id));
  const allOtherItems = activeItems.filter((item) => !recentIds.has(item.id));
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const matching = (items: Item[]) =>
    items.filter((item) =>
      item.name.toLocaleLowerCase().includes(normalizedSearch),
    );
  const visibleRecent = matching(recent);
  const visibleOther = matching(allOtherItems);

  const parsedLines: ParsedLine[] = lines.flatMap((line) => {
    const quantity = parseQuantity(line.quantity, line.item.allowsFractional);
    const unitPrice = parseKes(line.unitPrice);
    if (quantity === null || unitPrice === null) return [];
    return [
      {
        state: line,
        quantity,
        unitPrice,
        total: lineTotal(quantity, unitPrice),
      },
    ];
  });
  const total = linesTotal(
    parsedLines.map(({ quantity, unitPrice }) => ({ quantity, unitPrice })),
  );
  const paidRawValue = paidRaw ?? fromCents(total).toFixed(2);
  const amountPaid = parseKes(paidRawValue);
  const isCredit = amountPaid !== null && amountPaid < total;
  const customerId =
    customerChoice && customerChoice !== "new" ? customerChoice : undefined;
  const newName = newCustomerName.trim();

  const validationCodes: IssueCode[] = [];
  if (lines.length === 0) validationCodes.push("SCHEMA");
  if (parsedLines.length !== lines.length) {
    for (const line of lines) {
      if (parseQuantity(line.quantity, line.item.allowsFractional) === null) {
        const rawQuantity = Number(line.quantity);
        if (
          !line.item.allowsFractional &&
          Number.isFinite(rawQuantity) &&
          rawQuantity > 0 &&
          !Number.isInteger(rawQuantity)
        ) {
          validationCodes.push("NON_FRACTIONAL_QUANTITY");
        } else {
          validationCodes.push("SCHEMA");
        }
      }
      if (parseKes(line.unitPrice) === null) validationCodes.push("SCHEMA");
    }
  }
  if (amountPaid === null || amountPaid > total) {
    validationCodes.push("PAID_EXCEEDS_TOTAL");
  }
  if (isCredit && !customerId && customerChoice !== "new") {
    validationCodes.push("DENI_NEEDS_CUSTOMER");
  }
  if (customerChoice === "new" && !newName) validationCodes.push("SCHEMA");

  const canSave =
    lines.length > 0 &&
    parsedLines.length === lines.length &&
    amountPaid !== null &&
    amountPaid <= total &&
    (!isCredit || Boolean(customerId) || customerChoice === "new") &&
    (customerChoice !== "new" || Boolean(newName)) &&
    dueRuleReady;

  const issuesByCode: Partial<Record<IssueCode, string>> = {
    SCHEMA: t("ledger.grill.schema", locale),
    PAID_EXCEEDS_TOTAL: t("ledger.sale.amountPaidInvalid", locale),
    DENI_NEEDS_CUSTOMER: t("ledger.grill.deniNeedsCustomer", locale),
    NON_FRACTIONAL_QUANTITY: t("ledger.grill.nonFractionalQuantity", locale),
  };

  function changed() {
    setPendingOverride([]);
    setHardIssues([]);
    setSaveFailed(false);
    setSaved(false);
  }

  function addItem(item: Item) {
    changed();
    setLines((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        item,
        quantity: "1",
        unitPrice: fromCents(item.sellingPrice).toFixed(2),
      },
    ]);
    setSearch("");
  }

  function updateLine(
    key: string,
    patch: Partial<Pick<SaleLineState, "quantity" | "unitPrice">>,
  ) {
    changed();
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function makeDraft(): DraftSale | null {
    if (!canSave || amountPaid === null) return null;
    const draftLines: DraftLine[] = parsedLines.map(
      ({ state, quantity, unitPrice }) => ({
        itemId: state.item.id,
        itemKind: state.item.kind,
        description: state.item.name,
        quantity,
        unit: state.item.unit,
        unitPrice,
      }),
    );
    const creditDate =
      isCredit && dueRule
        ? resolveDueRule(dueRule, todayInNairobi(new Date()))
        : undefined;

    return {
      lines: draftLines,
      totalAmount: total,
      amountPaid,
      paymentMethod,
      ...(customerId ? { customerId } : {}),
      ...(customerChoice === "new"
        ? {
            newCustomer: {
              name: newName,
              ...(newCustomerPhone.trim()
                ? { phone: newCustomerPhone.trim() }
                : {}),
            },
          }
        : {}),
      ...(creditDate ? { dueDate: creditDate } : {}),
      ...(paymentMethod === "mpesa" && reference.trim()
        ? { externalReference: reference.trim() }
        : {}),
    };
  }

  async function save(override = false) {
    if (savingLock.current) return;
    setAttempted(true);
    const draft = makeDraft();
    if (!draft || !db || !session) return;

    savingLock.current = true;
    setSaving(true);
    setPendingOverride([]);
    setHardIssues([]);
    setSaveFailed(false);
    try {
      await commitSale(
        { db, businessId: session.businessId, profileId: session.profileId },
        draft,
        override ? { override: true } : {},
      );
      setSaved(true);
      successTimer.current = window.setTimeout(
        () => router.push("/sales"),
        500,
      );
    } catch (error) {
      if (error instanceof NeedsOverride) {
        setPendingOverride(error.issues);
      } else if (error instanceof CommitError) {
        setHardIssues(error.issues);
        if (error.issues.length === 0) setSaveFailed(true);
      } else {
        setSaveFailed(true);
      }
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(false);
  }

  if (!session || !db) {
    return (
      <p role="alert" className="rounded-card bg-surface p-4 text-ink">
        {t("ledger.sale.sessionRequired", locale)}
      </p>
    );
  }

  const loading =
    stockItems === undefined ||
    recentItems === undefined ||
    customers === undefined ||
    profile === undefined;

  if (loading) {
    return (
      <p aria-live="polite" className="rounded-card bg-surface p-4 text-moss">
        {t("ledger.sale.loading", locale)}
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-24"
    >
      <section
        aria-labelledby="sale-items-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex items-end justify-between gap-4 border-line border-b pb-2">
          <h2
            id="sale-items-heading"
            className="font-semibold text-lg text-ink"
          >
            {t("ledger.sale.lines", locale)}
          </h2>
          {lines.length > 0 ? (
            <span className="text-sm text-moss">{lines.length}</span>
          ) : null}
        </div>

        {activeItems.length === 0 ? (
          <p className="rounded-card bg-surface p-4 text-moss">
            {t("ledger.sale.noItems", locale)}
          </p>
        ) : (
          <>
            <label
              className="flex flex-col gap-1.5 font-medium text-ink"
              htmlFor="sale-item-search"
            >
              {t("ledger.sale.searchItems", locale)}
              <input
                id="sale-item-search"
                type="search"
                value={search}
                onChange={(event) => {
                  changed();
                  setSearch(event.target.value);
                }}
                placeholder={t("ledger.sale.searchItems", locale)}
                className={fieldClass}
              />
            </label>

            <div className="flex flex-col gap-4">
              {visibleRecent.length > 0 ? (
                <ItemChoices
                  title={t("ledger.sale.recentItems", locale)}
                  items={visibleRecent}
                  stockItems={stockItems}
                  onSelect={addItem}
                  locale={locale}
                />
              ) : null}
              {visibleOther.length > 0 ? (
                <ItemChoices
                  title={t("ledger.sale.allItems", locale)}
                  items={visibleOther}
                  stockItems={stockItems}
                  onSelect={addItem}
                  locale={locale}
                />
              ) : null}
              {visibleRecent.length + visibleOther.length === 0 ? (
                <p className="text-moss">
                  {t("ledger.sale.noItemMatches", locale)}
                </p>
              ) : null}
            </div>
          </>
        )}

        {lines.map((line) => {
          const quantity = parseQuantity(
            line.quantity,
            line.item.allowsFractional,
          );
          const unitPrice = parseKes(line.unitPrice);
          const rowTotal =
            quantity !== null && unitPrice !== null
              ? lineTotal(quantity, unitPrice)
              : null;
          return (
            <fieldset
              key={line.key}
              className="grid grid-cols-[minmax(0,1fr)_3rem] gap-x-3 gap-y-3 border-line border-t pt-4"
            >
              <legend className="col-span-2 flex w-full items-center justify-between gap-3 font-semibold text-ink">
                <span>
                  {line.item.name}
                  <span className="ml-2 font-normal text-moss">
                    /{line.item.unit}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`${t("ledger.sale.removeLine", locale)} ${line.item.name}`}
                  onClick={() => {
                    changed();
                    setLines((current) =>
                      current.filter((entry) => entry.key !== line.key),
                    );
                  }}
                  className={`${buttonBase} px-3 text-tomato hover:bg-tomato-tint`}
                >
                  ×
                </button>
              </legend>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                {t("ledger.sale.quantity", locale)}
                <input
                  aria-label={`${t("ledger.sale.quantity", locale)} ${line.item.name}`}
                  type="number"
                  min="0.001"
                  step={line.item.allowsFractional ? "0.001" : "1"}
                  inputMode="decimal"
                  value={line.quantity}
                  aria-invalid={attempted && quantity === null}
                  onChange={(event) =>
                    updateLine(line.key, { quantity: event.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                {t("ledger.sale.unitPrice", locale)} · {line.item.unit}
                <input
                  aria-label={`${t("ledger.sale.unitPrice", locale)} ${line.item.name}`}
                  type="text"
                  inputMode="decimal"
                  value={line.unitPrice}
                  aria-invalid={attempted && unitPrice === null}
                  onChange={(event) =>
                    updateLine(line.key, { unitPrice: event.target.value })
                  }
                  className={fieldClass}
                />
              </label>
              <p className="col-span-2 flex justify-between border-line border-t pt-2 text-sm">
                <span className="text-moss">
                  {t("ledger.sale.lineTotal", locale)}
                </span>
                <strong className="tabular text-ink">
                  {rowTotal === null ? "—" : formatKES(rowTotal)}
                </strong>
              </p>
              {attempted && quantity === null ? (
                <p className="col-span-2 text-sm text-tomato">
                  {t("ledger.sale.quantityInvalid", locale)}
                </p>
              ) : null}
              {attempted && unitPrice === null ? (
                <p className="col-span-2 text-sm text-tomato">
                  {t("ledger.sale.priceInvalid", locale)}
                </p>
              ) : null}
            </fieldset>
          );
        })}
      </section>

      <section
        aria-labelledby="sale-total-heading"
        className="flex items-center justify-between border-line border-y py-4"
      >
        <h2 id="sale-total-heading" className="font-semibold text-lg">
          {t("ledger.sale.total", locale)}
        </h2>
        <p className="tabular font-bold text-2xl">{formatKES(total)}</p>
      </section>

      <section
        aria-labelledby="sale-payment-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="sale-payment-heading" className="font-semibold text-lg">
          {t("ledger.sale.paymentMethod", locale)}
        </h2>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">
            {t("ledger.sale.paymentMethod", locale)}
          </legend>
          {(["cash", "mpesa", "other"] as const).map((method) => (
            <button
              key={method}
              type="button"
              aria-pressed={paymentMethod === method}
              onClick={() => {
                changed();
                setPaymentMethod(method);
              }}
              className={`${buttonBase} border border-line ${paymentMethod === method ? "bg-sukuma text-surface" : "bg-surface text-ink hover:bg-chalk"}`}
            >
              {t(`ledger.sale.${method}`, locale)}
            </button>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1.5 font-medium text-ink">
          {t("ledger.sale.amountPaid", locale)}
          <input
            type="text"
            inputMode="decimal"
            value={paidRawValue}
            aria-invalid={
              attempted && (amountPaid === null || amountPaid > total)
            }
            onChange={(event) => {
              changed();
              setPaidRaw(event.target.value);
            }}
            className={fieldClass}
          />
        </label>
        {attempted && (amountPaid === null || amountPaid > total) ? (
          <p role="alert" className="text-sm text-tomato">
            {t("ledger.sale.amountPaidInvalid", locale)}
          </p>
        ) : null}
        {paymentMethod === "mpesa" ? (
          <label className="flex flex-col gap-1.5 font-medium text-ink">
            {t("ledger.sale.mpesaReference", locale)}
            <input
              type="text"
              value={reference}
              onChange={(event) => {
                changed();
                setReference(event.target.value);
              }}
              className={fieldClass}
            />
          </label>
        ) : null}
      </section>

      {isCredit ? (
        <section
          aria-labelledby="sale-customer-heading"
          className="flex flex-col gap-4 rounded-card bg-maize-tint p-4"
        >
          <h2 id="sale-customer-heading" className="font-semibold text-lg">
            {t("ledger.sale.customer", locale)}
          </h2>
          <p className="text-sm text-ink">
            {t("ledger.sale.customerRequired", locale)}
          </p>
          <label className="flex flex-col gap-1.5 font-medium text-ink">
            {t("ledger.sale.customer", locale)}
            <select
              value={customerChoice}
              aria-invalid={customerChoice === ""}
              onChange={(event) => {
                changed();
                setCustomerChoice(event.target.value as CustomerChoice);
              }}
              className={fieldClass}
            >
              <option value="">
                {t("ledger.sale.chooseCustomer", locale)}
              </option>
              {(customers ?? []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
              <option value="new">
                {t("ledger.sale.newCustomer", locale)}
              </option>
            </select>
          </label>
          {customerChoice === "new" ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 font-medium text-ink">
                {t("ledger.sale.customerName", locale)}
                <input
                  type="text"
                  autoComplete="name"
                  value={newCustomerName}
                  aria-invalid={attempted && !newName}
                  onChange={(event) => {
                    changed();
                    setNewCustomerName(event.target.value);
                  }}
                  className={fieldClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 font-medium text-ink">
                {t("ledger.sale.customerPhone", locale)}
                <input
                  type="tel"
                  autoComplete="tel"
                  value={newCustomerPhone}
                  onChange={(event) => {
                    changed();
                    setNewCustomerPhone(event.target.value);
                  }}
                  className={fieldClass}
                />
              </label>
            </div>
          ) : null}
          <label className="flex flex-col gap-1.5 font-medium text-ink">
            {t("ledger.sale.dueDate", locale)}
            <select
              value={dueRule ?? "none"}
              onChange={(event) => {
                changed();
                setDueRule(
                  event.target.value === "none"
                    ? null
                    : (event.target.value as DueRule),
                );
              }}
              className={fieldClass}
            >
              <option value="none">{t("ledger.sale.noDueDate", locale)}</option>
              {dueRules.map((rule) => (
                <option key={rule} value={rule}>
                  {t(`ledger.sale.due.${rule}`, locale)}
                </option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      {attempted && validationCodes.length > 0 ? (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-card bg-tomato-tint p-4 text-tomato"
        >
          <h2 className="font-semibold">
            {t("ledger.sale.validationHeading", locale)}
          </h2>
          {[...new Set(validationCodes)].map((code) => (
            <p key={code}>
              {issuesByCode[code] ?? t("ledger.grill.schema", locale)}
            </p>
          ))}
        </div>
      ) : null}
      {pendingOverride.length > 0 ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-card bg-maize-tint p-4 text-ink"
        >
          {pendingOverride.map((issue) => (
            <p key={`${issue.code}-${issue.lineIndex ?? "sale"}`}>
              {t(issue.messageKey, locale)}
            </p>
          ))}
        </div>
      ) : null}
      {hardIssues.length > 0 ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-card bg-tomato-tint p-4 text-tomato"
        >
          {hardIssues.map((issue) => (
            <p key={`${issue.code}-${issue.lineIndex ?? "sale"}`}>
              {t(issue.messageKey, locale)}
            </p>
          ))}
        </div>
      ) : null}
      {saveFailed ? (
        <p role="alert" className="rounded-card bg-tomato-tint p-4 text-tomato">
          {t("ledger.sale.saveError", locale)}
        </p>
      ) : null}
      {saved ? (
        <output
          aria-live="polite"
          className="rounded-card bg-surface p-4 text-ink"
        >
          {t("ledger.sale.saved", locale)}
        </output>
      ) : null}

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 flex gap-3 border-line border-t bg-chalk/95 py-3 backdrop-blur-sm">
        <button
          type="submit"
          disabled={saving || saved}
          className={`${buttonBase} min-h-[52px] flex-1 bg-sukuma text-surface hover:bg-sukuma-pressed disabled:cursor-not-allowed disabled:bg-moss`}
        >
          {saving
            ? t("ledger.sale.saving", locale)
            : t("ledger.sale.save", locale)}
        </button>
        {pendingOverride.length > 0 ? (
          <button
            type="button"
            disabled={saving || saved}
            onClick={() => void save(true)}
            className={`${buttonBase} border border-line bg-surface text-ink disabled:opacity-60`}
          >
            {t("ledger.sale.saveAnyway", locale)}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function ItemChoices({
  title,
  items,
  stockItems,
  onSelect,
  locale,
}: {
  title: string;
  items: Item[];
  stockItems: NonNullable<ReturnType<typeof useItemsWithStock>>;
  onSelect: (item: Item) => void;
  locale: ReturnType<typeof useLocale>;
}) {
  const stockById = new Map(
    stockItems.map(({ item, onHand }) => [item.id, onHand]),
  );
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-moss">{title}</h3>
      <ul className="divide-y divide-line border-line border-y">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              aria-label={`${t("ledger.sale.addItem", locale)} ${item.name}`}
              className={`flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-ink hover:bg-surface ${focusRing}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{item.name}</span>
                <span className="text-sm text-moss">
                  {formatKES(item.sellingPrice)} / {item.unit}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-sukuma">
                {t("ledger.sale.addItem", locale)}
              </span>
            </button>
            {item.kind === "goods" && stockById.get(item.id) !== undefined ? (
              <span className="sr-only">
                {stockById.get(item.id)} {item.unit}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
