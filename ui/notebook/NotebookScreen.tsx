"use client";

import { useRouter } from "next/navigation";
import {
  Component,
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useSession } from "@/auth/session";
import type { Issue } from "@/domain/grill";
import { formatKES, toCents } from "@/domain/money";
import type {
  DraftOpening,
  DraftStockAdjustment,
  Id,
  Item,
} from "@/domain/types";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import {
  type BroughtForwardEntry,
  useBroughtForward,
  useBusinessDb,
  useCustomers,
  useItemsWithStock,
  useSupplierSearch,
} from "@/local/queries";
import {
  type SaveOutcome,
  saveOpening,
  saveStockAdjustment,
  saveVoid,
} from "@/local/save";

type Tab = "customers" | "suppliers" | "stock";
type SaveRequest =
  | { kind: "opening"; draft: DraftOpening }
  | { kind: "stock"; draft: DraftStockAdjustment };
type PartyMode = "existing" | "new";

const tabs: Tab[] = ["customers", "suppliers", "stock"];
const buttonBase =
  "inline-flex min-h-12 items-center justify-center rounded-card px-4 text-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma disabled:cursor-not-allowed disabled:opacity-60";
const fieldClass =
  "min-h-12 w-full rounded-card border border-line bg-surface px-3 text-ink placeholder:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma";

function parseAmount(raw: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;
  const cents = toCents(raw);
  return cents > 0 ? cents : null;
}

function parseQuantity(raw: string, allowsFractional: boolean): number | null {
  if (!/^\d+(?:\.\d{1,3})?$/.test(raw)) return null;
  const quantity = Number(raw);
  if (!Number.isFinite(quantity) || quantity < 0) return null;
  if (!allowsFractional && !Number.isInteger(quantity)) return null;
  return quantity;
}

function formatQuantity(quantity: number, locale: "en" | "sw"): string {
  return new Intl.NumberFormat(locale === "sw" ? "sw-KE" : "en-KE", {
    maximumFractionDigits: 3,
  }).format(quantity);
}

function formatTime(value: string, locale: "en" | "sw"): string {
  return new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function formatDay(value: string, locale: "en" | "sw"): string {
  return new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", {
    dateStyle: "medium",
    timeZone: "Africa/Nairobi",
  }).format(new Date(`${value}T12:00:00`));
}

function IssueList({
  issues,
  locale,
  heading,
}: {
  issues: Issue[];
  locale: "en" | "sw";
  heading: string;
}) {
  if (issues.length === 0) return null;

  return (
    <section
      role="alert"
      aria-label={heading}
      className="rounded-card bg-maize-tint p-4 text-ink"
    >
      <h2 className="font-semibold">{heading}</h2>
      <ul className="mt-2 list-inside list-disc">
        {issues.map((issue, index) => (
          <li key={`${issue.code}-${index}`}>{t(issue.messageKey, locale)}</li>
        ))}
      </ul>
    </section>
  );
}

function SaveAnywayDialog({
  issues,
  locale,
  saving,
  onCancel,
  onConfirm,
}: {
  issues: Issue[];
  locale: "en" | "sw";
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!element.open) element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onCancel();
      }}
      className="fixed inset-x-0 bottom-0 m-0 w-full max-w-none rounded-t-sheet bg-chalk p-5 text-ink backdrop:bg-ink/40 sm:inset-x-1/2 sm:bottom-1/2 sm:w-[min(34rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:translate-y-1/2 sm:rounded-card"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {t("ledger.notebook.saveAnywayTitle", locale)}
      </h2>
      <p id={bodyId} className="mt-2 text-moss">
        {t("ledger.notebook.saveAnywayBody", locale)}
      </p>
      <div className="mt-4">
        <IssueList
          issues={issues}
          locale={locale}
          heading={t("ledger.notebook.checkEntry", locale)}
        />
      </div>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className={`${buttonBase} border border-line bg-surface text-ink`}
        >
          {t("ledger.notebook.cancel", locale)}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onConfirm}
          className={`${buttonBase} bg-sukuma text-surface hover:bg-sukuma-pressed`}
        >
          {saving
            ? t("ledger.notebook.saving", locale)
            : t("ledger.notebook.saveAnyway", locale)}
        </button>
      </div>
    </dialog>
  );
}

export function NotebookScreen() {
  const locale = useLocale();
  const [retry, setRetry] = useState(0);

  return (
    <NotebookQueryBoundary
      key={retry}
      fallback={
        <div
          role="alert"
          className="mt-6 rounded-card bg-tomato-tint p-4 text-ink"
        >
          <p>{t("ledger.notebook.loadError", locale)}</p>
          <button
            type="button"
            className={`${buttonBase} mt-3 bg-surface`}
            onClick={() => setRetry((current) => current + 1)}
          >
            {t("ledger.notebook.retry", locale)}
          </button>
        </div>
      }
    >
      <NotebookContent />
    </NotebookQueryBoundary>
  );
}

function NotebookContent() {
  const locale = useLocale();
  const router = useRouter();
  const session = useSession();
  const db = useBusinessDb();
  const customers = useCustomers();
  const [supplierSearch, setSupplierSearch] = useState("");
  const suppliers = useSupplierSearch(supplierSearch);
  const items = useItemsWithStock();
  const broughtForward = useBroughtForward();

  const [tab, setTab] = useState<Tab>("customers");
  const [customerMode, setCustomerMode] = useState<PartyMode | null>(null);
  const [supplierMode, setSupplierMode] = useState<PartyMode | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState<Id | "">("");
  const [supplierId, setSupplierId] = useState<Id | "">("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [stockQuantities, setStockQuantities] = useState<Record<Id, string>>(
    {},
  );
  const [attempted, setAttempted] = useState(false);
  const [stockAttempted, setStockAttempted] = useState<Id | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingLock, setSavingLock] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<SaveRequest | null>(
    null,
  );
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showEmptySaveError, setShowEmptySaveError] = useState(false);
  const [unknownSaveError, setUnknownSaveError] = useState(false);
  const [voidingId, setVoidingId] = useState<Id | null>(null);
  const [confirmingVoidId, setConfirmingVoidId] = useState<Id | null>(null);
  const [notice, setNotice] = useState("");
  const requestLock = useRef(false);
  const tabButtons = useRef<Array<HTMLButtonElement | null>>([]);

  const isLoading =
    customers === undefined ||
    items === undefined ||
    broughtForward === undefined;

  if (!session || !db) {
    return (
      <p role="alert" className="mt-6 rounded-card bg-surface p-4 text-ink">
        {t("ledger.notebook.sessionRequired", locale)}
      </p>
    );
  }

  const activeSession = session;
  const businessDb = db;

  if (isLoading) {
    return (
      <div aria-live="polite" className="mt-6 flex flex-col gap-4">
        <span className="sr-only">{t("ledger.notebook.loading", locale)}</span>
        <div className="h-14 animate-pulse rounded-card bg-surface motion-reduce:animate-none" />
        <div className="h-48 animate-pulse rounded-card bg-surface motion-reduce:animate-none" />
      </div>
    );
  }

  const tabLabels: Record<Tab, string> = {
    customers: t("ledger.notebook.customersTab", locale),
    suppliers: t("ledger.notebook.suppliersTab", locale),
    stock: t("ledger.notebook.stockTab", locale),
  };
  const modeForCustomer =
    customerMode ?? (customers.length === 0 ? "new" : "existing");
  const modeForSupplier =
    supplierMode ?? (suppliers?.length === 0 ? "new" : "existing");
  const goodsItems = items.filter(
    ({ item }) => item.isActive && item.kind === "goods",
  );

  function moveTab(current: Tab, direction: -1 | 1) {
    const currentIndex = tabs.indexOf(current);
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex] ?? "customers";
    setTab(nextTab);
    tabButtons.current[nextIndex]?.focus();
  }

  function resetOpeningForm(party: "customer" | "supplier") {
    setAmount("");
    setDueDate("");
    setAttempted(false);
    setIssues([]);
    setShowEmptySaveError(false);
    setUnknownSaveError(false);
    setNotice(t("ledger.notebook.saved", locale));
    if (party === "customer") {
      setCustomerId("");
      setCustomerSearch("");
      setNewCustomerName("");
      setNewCustomerPhone("");
      setCustomerMode(null);
    } else {
      setSupplierId("");
      setSupplierSearch("");
      setNewSupplierName("");
      setSupplierMode(null);
    }
  }

  function resetStockForm(itemId: Id) {
    setStockQuantities((current) => ({ ...current, [itemId]: "" }));
    setStockAttempted(null);
    setIssues([]);
    setShowEmptySaveError(false);
    setUnknownSaveError(false);
    setNotice(t("ledger.notebook.saved", locale));
  }

  async function saveRequest(
    request: SaveRequest,
    override = false,
  ): Promise<boolean> {
    if (requestLock.current) return false;
    requestLock.current = true;
    setSavingLock(true);
    setSaving(true);
    setIssues([]);
    setShowEmptySaveError(false);
    setUnknownSaveError(false);
    setNotice("");
    setPendingOverride(null);

    try {
      const context = {
        db: businessDb,
        businessId: activeSession.businessId,
        profileId: activeSession.profileId,
      };
      const outcome: SaveOutcome =
        request.kind === "opening"
          ? await saveOpening(
              context,
              request.draft,
              override ? { override: true } : {},
            )
          : await saveStockAdjustment(
              context,
              request.draft,
              override ? { override: true } : {},
            );

      if (outcome.kind === "saved") {
        const savedIssues =
          "issues" in outcome && Array.isArray(outcome.issues)
            ? outcome.issues
            : [];
        if (request.kind === "opening") {
          resetOpeningForm(request.draft.party);
        } else {
          resetStockForm(request.draft.itemId);
        }
        if (savedIssues.length > 0) setIssues(savedIssues);
        return true;
      }
      if (outcome.kind === "needs_override") {
        setIssues(outcome.issues);
        setPendingOverride(request);
        return false;
      }
      setIssues(outcome.issues);
      setShowEmptySaveError(outcome.issues.length === 0);
      return false;
    } catch {
      // The local transaction may have committed before an unexpected error surfaced.
      // Keep the draft and tell the merchant to check the live list before retrying.
      setUnknownSaveError(true);
      return false;
    } finally {
      requestLock.current = false;
      setSavingLock(false);
      setSaving(false);
    }
  }

  function submitOpening(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    setIssues([]);
    setNotice("");

    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) return;

    let draft: DraftOpening;
    if (tab === "customers") {
      if (modeForCustomer === "existing") {
        if (!customerId) return;
        draft = {
          party: "customer",
          customerId,
          amount: parsedAmount,
          source: "onboarding",
          ...(dueDate ? { dueDate } : {}),
        };
      } else {
        const name = newCustomerName.trim();
        if (!name) return;
        draft = {
          party: "customer",
          newCustomer: {
            name,
            ...(newCustomerPhone.trim()
              ? { phone: newCustomerPhone.trim() }
              : {}),
          },
          amount: parsedAmount,
          source: "onboarding",
          ...(dueDate ? { dueDate } : {}),
        };
      }
    } else if (tab === "suppliers") {
      if (modeForSupplier === "existing") {
        if (!supplierId) return;
        draft = {
          party: "supplier",
          supplierId,
          amount: parsedAmount,
          source: "onboarding",
          ...(dueDate ? { dueDate } : {}),
        };
      } else {
        const name = newSupplierName.trim();
        if (!name) return;
        draft = {
          party: "supplier",
          newSupplier: { name },
          amount: parsedAmount,
          source: "onboarding",
          ...(dueDate ? { dueDate } : {}),
        };
      }
    } else {
      return;
    }
    void saveRequest({ kind: "opening", draft });
  }

  async function submitStock(item: Item) {
    const raw = stockQuantities[item.id] ?? "";
    setStockAttempted(item.id);
    setIssues([]);
    setNotice("");
    const quantity = parseQuantity(raw, item.allowsFractional);
    if (quantity === null) return;
    if (quantity === 0) {
      setStockQuantities((current) => ({ ...current, [item.id]: "" }));
      setStockAttempted(null);
      return;
    }
    await saveRequest({
      kind: "stock",
      draft: { itemId: item.id, quantity, source: "onboarding" },
    });
  }

  async function voidEntry(entry: BroughtForwardEntry) {
    if (requestLock.current || entry.voided) return;
    requestLock.current = true;
    setSavingLock(true);
    setVoidingId(entry.id);
    setIssues([]);
    setShowEmptySaveError(false);
    setUnknownSaveError(false);
    setNotice("");
    try {
      const outcome = await saveVoid(
        {
          db: businessDb,
          businessId: activeSession.businessId,
          profileId: activeSession.profileId,
        },
        entry.id,
      );
      if (outcome.kind === "saved") {
        setConfirmingVoidId(null);
        setNotice(t("ledger.notebook.voidedNotice", locale));
      } else {
        setIssues(outcome.issues);
        setShowEmptySaveError(outcome.issues.length === 0);
      }
    } catch {
      setUnknownSaveError(true);
    } finally {
      requestLock.current = false;
      setSavingLock(false);
      setVoidingId(null);
    }
  }

  const activeEntries =
    tab === "customers"
      ? broughtForward.customers
      : tab === "suppliers"
        ? broughtForward.suppliers
        : [];
  const total =
    tab === "customers"
      ? broughtForward.totals.customers
      : broughtForward.totals.suppliers;

  return (
    <div className="mt-5 flex flex-col gap-5">
      <p className="max-w-3xl text-base leading-6 text-ink">
        {t("ledger.notebook.intro", locale)}
      </p>

      <div
        role="tablist"
        aria-label={t("ledger.notebook.tabsLabel", locale)}
        className="grid grid-cols-3 border-b border-line"
      >
        {tabs.map((tabKey, index) => (
          <button
            key={tabKey}
            ref={(element) => {
              tabButtons.current[index] = element;
            }}
            id={`notebook-tab-${tabKey}`}
            type="button"
            role="tab"
            aria-selected={tab === tabKey}
            aria-controls={`notebook-panel-${tabKey}`}
            tabIndex={tab === tabKey ? 0 : -1}
            onClick={() => {
              setTab(tabKey);
              setAttempted(false);
              setIssues([]);
              setShowEmptySaveError(false);
              setUnknownSaveError(false);
              setNotice("");
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveTab(tabKey, 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveTab(tabKey, -1);
              }
            }}
            className={`min-h-14 border-b-4 px-2 py-2 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sukuma sm:text-base ${
              tab === tabKey
                ? "border-sukuma text-sukuma"
                : "border-transparent text-moss hover:text-ink"
            }`}
          >
            {tabLabels[tabKey]}
          </button>
        ))}
      </div>

      <section
        id={`notebook-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`notebook-tab-${tab}`}
        className="flex flex-col gap-5"
      >
        {tab === "customers" || tab === "suppliers" ? (
          <>
            <section
              aria-labelledby="notebook-total-heading"
              className="rounded-card bg-maize-tint p-4"
            >
              <h2
                id="notebook-total-heading"
                className="text-lg font-semibold text-ink"
              >
                {t("ledger.notebook.broughtForwardTotal", locale)}:{" "}
                <span className="tabular text-xl font-bold">
                  {formatKES(total)}
                </span>
              </h2>
            </section>

            <OpeningForm
              tab={tab}
              customers={customers}
              suppliers={suppliers}
              customerSearch={customerSearch}
              supplierSearch={supplierSearch}
              customerId={customerId}
              supplierId={supplierId}
              customerMode={modeForCustomer}
              supplierMode={modeForSupplier}
              newCustomerName={newCustomerName}
              newCustomerPhone={newCustomerPhone}
              newSupplierName={newSupplierName}
              amount={amount}
              dueDate={dueDate}
              attempted={attempted}
              saving={saving}
              locale={locale}
              onCustomerSearch={setCustomerSearch}
              onSupplierSearch={setSupplierSearch}
              onCustomerId={setCustomerId}
              onSupplierId={setSupplierId}
              onCustomerMode={setCustomerMode}
              onSupplierMode={setSupplierMode}
              onNewCustomerName={setNewCustomerName}
              onNewCustomerPhone={setNewCustomerPhone}
              onNewSupplierName={setNewSupplierName}
              onAmount={setAmount}
              onDueDate={setDueDate}
              onSubmit={submitOpening}
            />

            <NotebookEntries
              entries={activeEntries}
              customers={customers}
              locale={locale}
              emptyText={
                tab === "customers"
                  ? t("ledger.notebook.emptyCustomers", locale)
                  : t("ledger.notebook.emptySuppliers", locale)
              }
              confirmingVoidId={confirmingVoidId}
              voidingId={voidingId}
              saving={savingLock}
              onConfirm={(entry) => void voidEntry(entry)}
              onAskVoid={(id) => {
                setConfirmingVoidId(id);
                setIssues([]);
                setShowEmptySaveError(false);
                setUnknownSaveError(false);
                setNotice("");
              }}
              onCancelVoid={() => setConfirmingVoidId(null)}
            />
          </>
        ) : (
          <StockPanel
            items={goodsItems}
            stock={broughtForward.stock}
            quantities={stockQuantities}
            attemptedItemId={stockAttempted}
            saving={saving}
            locale={locale}
            onQuantity={(id, value) =>
              setStockQuantities((current) => ({ ...current, [id]: value }))
            }
            onSave={(item) => void submitStock(item)}
          />
        )}

        {issues.length > 0 ? (
          <IssueList
            issues={issues}
            locale={locale}
            heading={t("ledger.notebook.checkEntry", locale)}
          />
        ) : null}
        {showEmptySaveError ? (
          <p role="alert" className="rounded-card bg-tomato-tint p-4 text-ink">
            {t("ledger.notebook.saveError", locale)}
          </p>
        ) : null}
        {unknownSaveError ? (
          <p role="alert" className="rounded-card bg-tomato-tint p-4 text-ink">
            {t("ledger.notebook.unknownSaveError", locale)}
          </p>
        ) : null}
        {notice ? (
          <output className="rounded-card bg-surface p-4 text-ink">
            {notice}
          </output>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:justify-between">
        <button
          type="button"
          disabled={savingLock}
          onClick={() => router.replace("/dashboard")}
          className={`${buttonBase} border border-line bg-surface text-ink`}
        >
          {t("ledger.notebook.later", locale)}
        </button>
        <button
          type="button"
          disabled={savingLock}
          onClick={() => router.replace("/dashboard")}
          className={`${buttonBase} bg-sukuma text-surface hover:bg-sukuma-pressed`}
        >
          {t("ledger.notebook.done", locale)}
        </button>
      </div>

      {pendingOverride ? (
        <SaveAnywayDialog
          issues={issues}
          locale={locale}
          saving={saving}
          onCancel={() => {
            setPendingOverride(null);
            setIssues([]);
          }}
          onConfirm={() => void saveRequest(pendingOverride, true)}
        />
      ) : null}
    </div>
  );
}

function OpeningForm({
  tab,
  customers,
  suppliers,
  customerSearch,
  supplierSearch,
  customerId,
  supplierId,
  customerMode,
  supplierMode,
  newCustomerName,
  newCustomerPhone,
  newSupplierName,
  amount,
  dueDate,
  attempted,
  saving,
  locale,
  onCustomerSearch,
  onSupplierSearch,
  onCustomerId,
  onSupplierId,
  onCustomerMode,
  onSupplierMode,
  onNewCustomerName,
  onNewCustomerPhone,
  onNewSupplierName,
  onAmount,
  onDueDate,
  onSubmit,
}: {
  tab: "customers" | "suppliers";
  customers: NonNullable<ReturnType<typeof useCustomers>>;
  suppliers: ReturnType<typeof useSupplierSearch>;
  customerSearch: string;
  supplierSearch: string;
  customerId: Id | "";
  supplierId: Id | "";
  customerMode: PartyMode;
  supplierMode: PartyMode;
  newCustomerName: string;
  newCustomerPhone: string;
  newSupplierName: string;
  amount: string;
  dueDate: string;
  attempted: boolean;
  saving: boolean;
  locale: "en" | "sw";
  onCustomerSearch: (value: string) => void;
  onSupplierSearch: (value: string) => void;
  onCustomerId: (value: Id | "") => void;
  onSupplierId: (value: Id | "") => void;
  onCustomerMode: (value: PartyMode) => void;
  onSupplierMode: (value: PartyMode) => void;
  onNewCustomerName: (value: string) => void;
  onNewCustomerPhone: (value: string) => void;
  onNewSupplierName: (value: string) => void;
  onAmount: (value: string) => void;
  onDueDate: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const amountId = useId();
  const dueDateId = useId();
  const isCustomer = tab === "customers";
  const mode = isCustomer ? customerMode : supplierMode;
  const search = isCustomer ? customerSearch : supplierSearch;
  const selectedId = isCustomer ? customerId : supplierId;
  const parties = isCustomer ? customers : suppliers;
  const name = isCustomer ? newCustomerName : newSupplierName;
  const filteredCustomers = customers.filter((customer) =>
    customer.name
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const displayParties = isCustomer ? filteredCustomers : (parties ?? []);
  const partiesLoading = !isCustomer && parties === undefined;
  const noMatches = !partiesLoading && displayParties.length === 0;
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-card bg-surface p-4 sm:p-5"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold text-ink">
          {isCustomer
            ? t("ledger.notebook.customerChoice", locale)
            : t("ledger.notebook.supplierChoice", locale)}
        </legend>
        <label className="flex min-h-12 items-center gap-3 rounded-card px-3 hover:bg-chalk">
          <input
            type="radio"
            name={`${tab}-mode`}
            checked={mode === "existing"}
            onChange={() => {
              if (isCustomer) onCustomerMode("existing");
              else onSupplierMode("existing");
            }}
            className="size-5 accent-sukuma"
          />
          <span>
            {isCustomer
              ? t("ledger.notebook.useExistingCustomer", locale)
              : t("ledger.notebook.useExistingSupplier", locale)}
          </span>
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-card px-3 hover:bg-chalk">
          <input
            type="radio"
            name={`${tab}-mode`}
            checked={mode === "new"}
            onChange={() => {
              if (isCustomer) onCustomerMode("new");
              else onSupplierMode("new");
            }}
            className="size-5 accent-sukuma"
          />
          <span>
            {isCustomer
              ? t("ledger.notebook.addNewCustomer", locale)
              : t("ledger.notebook.addNewSupplier", locale)}
          </span>
        </label>
      </fieldset>

      {mode === "existing" ? (
        <div className="flex flex-col gap-3">
          <label htmlFor={`${tab}-search`} className="font-medium">
            {isCustomer
              ? t("ledger.notebook.searchCustomer", locale)
              : t("ledger.notebook.searchSupplier", locale)}
          </label>
          <input
            id={`${tab}-search`}
            type="search"
            value={search}
            onChange={(event) => {
              if (isCustomer) onCustomerSearch(event.target.value);
              else onSupplierSearch(event.target.value);
            }}
            className={fieldClass}
            autoComplete="off"
          />
          {partiesLoading ? (
            <p aria-live="polite" className="text-moss">
              {t("ledger.notebook.searching", locale)}
            </p>
          ) : noMatches ? (
            <p className="text-moss">
              {t("ledger.notebook.noMatches", locale)}
            </p>
          ) : (
            <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
              {displayParties.map((party) => (
                <li key={party.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === party.id}
                    onClick={() => {
                      if (isCustomer) onCustomerId(party.id);
                      else onSupplierId(party.id);
                    }}
                    className={`min-h-12 w-full rounded-card border px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma ${
                      selectedId === party.id
                        ? "border-sukuma bg-chalk font-semibold text-ink"
                        : "border-line bg-surface text-ink hover:bg-chalk"
                    }`}
                  >
                    {party.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {attempted && !selectedId ? (
            <p role="alert" className="text-sm text-tomato">
              {isCustomer
                ? t("ledger.notebook.chooseCustomer", locale)
                : t("ledger.notebook.chooseSupplier", locale)}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label htmlFor={`${tab}-name`} className="font-medium">
            {isCustomer
              ? t("ledger.notebook.customerName", locale)
              : t("ledger.notebook.supplierName", locale)}
          </label>
          <input
            id={`${tab}-name`}
            value={name}
            onChange={(event) => {
              if (isCustomer) onNewCustomerName(event.target.value);
              else onNewSupplierName(event.target.value);
            }}
            autoComplete="name"
            className={fieldClass}
            aria-invalid={attempted && name.trim().length === 0}
            aria-describedby={
              attempted && name.trim().length === 0
                ? `${tab}-name-error`
                : undefined
            }
          />
          {isCustomer ? (
            <>
              <label htmlFor="customer-phone" className="font-medium">
                {t("ledger.notebook.phoneOptional", locale)}
              </label>
              <input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={newCustomerPhone}
                onChange={(event) => onNewCustomerPhone(event.target.value)}
                className={fieldClass}
              />
            </>
          ) : null}
          {attempted && name.trim().length === 0 ? (
            <p
              id={`${tab}-name-error`}
              role="alert"
              className="text-sm text-tomato"
            >
              {t("ledger.notebook.nameRequired", locale)}
            </p>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={amountId} className="font-medium">
            {t("ledger.notebook.amount", locale)}
          </label>
          <input
            id={amountId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(event) => onAmount(event.target.value)}
            className={`${fieldClass} tabular`}
            aria-invalid={attempted && parseAmount(amount) === null}
            aria-describedby={attempted ? `${amountId}-error` : undefined}
          />
          {attempted && parseAmount(amount) === null ? (
            <p
              id={`${amountId}-error`}
              role="alert"
              className="text-sm text-tomato"
            >
              {t("ledger.notebook.amountInvalid", locale)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={dueDateId} className="font-medium">
            {t("ledger.notebook.dueDateOptional", locale)}
          </label>
          <input
            id={dueDateId}
            type="date"
            value={dueDate}
            onChange={(event) => onDueDate(event.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <p className="text-sm text-moss">
        {t("ledger.notebook.notSales", locale)}
      </p>
      <button
        type="submit"
        disabled={saving || partiesLoading}
        className={`${buttonBase} w-full bg-sukuma text-surface hover:bg-sukuma-pressed`}
      >
        {saving
          ? t("ledger.notebook.saving", locale)
          : isCustomer
            ? t("ledger.notebook.addCustomerBalance", locale)
            : t("ledger.notebook.addSupplierBalance", locale)}
      </button>
    </form>
  );
}

function NotebookEntries({
  entries,
  customers,
  locale,
  emptyText,
  confirmingVoidId,
  voidingId,
  saving,
  onConfirm,
  onAskVoid,
  onCancelVoid,
}: {
  entries: BroughtForwardEntry[];
  customers: NonNullable<ReturnType<typeof useCustomers>>;
  locale: "en" | "sw";
  emptyText: string;
  confirmingVoidId: Id | null;
  voidingId: Id | null;
  saving: boolean;
  onConfirm: (entry: BroughtForwardEntry) => void;
  onAskVoid: (id: Id) => void;
  onCancelVoid: () => void;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-lg font-semibold text-ink">
        {t("ledger.notebook.entries", locale)}
      </h2>
      {entries.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-ink">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => {
            const partyName =
              entry.partyName ??
              customers.find((customer) => customer.id === entry.customerId)
                ?.name ??
              t("ledger.notebook.unknownName", locale);
            const isConfirming = confirmingVoidId === entry.id;

            return (
              <li
                key={entry.id}
                className={`rounded-card bg-surface p-4 ${
                  entry.voided ? "opacity-75" : ""
                }`}
              >
                <div
                  className={`flex flex-col justify-between gap-2 sm:flex-row sm:items-start ${
                    entry.voided ? "line-through" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold text-ink">{partyName}</p>
                    <p className="mt-1 text-sm text-moss">
                      {formatTime(entry.occurredAt, locale)}
                    </p>
                  </div>
                  <p className="tabular text-lg font-bold text-ink">
                    {formatKES(entry.totalAmount)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                  <span className="font-medium">
                    {t("ledger.notebook.broughtForward", locale)}
                  </span>
                  {entry.dueDate ? (
                    <span>
                      {t("ledger.notebook.dueDateLabel", locale)}:{" "}
                      {formatDay(entry.dueDate, locale)}
                    </span>
                  ) : null}
                  {entry.voided ? (
                    <span className="font-semibold text-tomato">
                      {t("ledger.notebook.voided", locale)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-moss">
                  {t("ledger.notebook.notSales", locale)}
                </p>
                {!entry.voided ? (
                  <div className="mt-3">
                    {isConfirming ? (
                      <div className="flex flex-col gap-3 rounded-card bg-chalk p-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium">
                          {t("ledger.notebook.confirmVoidPrompt", locale)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={onCancelVoid}
                            className={`${buttonBase} border border-line bg-surface text-ink`}
                          >
                            {t("ledger.notebook.cancel", locale)}
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => onConfirm(entry)}
                            className={`${buttonBase} bg-tomato text-surface`}
                          >
                            {voidingId === entry.id
                              ? t("ledger.notebook.saving", locale)
                              : t("ledger.notebook.confirmVoid", locale)}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => onAskVoid(entry.id)}
                        className={`${buttonBase} text-tomato underline underline-offset-4 hover:bg-tomato-tint`}
                      >
                        {t("ledger.notebook.void", locale)}
                      </button>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StockPanel({
  items,
  stock,
  quantities,
  attemptedItemId,
  saving,
  locale,
  onQuantity,
  onSave,
}: {
  items: { item: Item; onHand: number | null }[];
  stock: { item: Item; quantity: number }[];
  quantities: Record<Id, string>;
  attemptedItemId: Id | null;
  saving: boolean;
  locale: "en" | "sw";
  onQuantity: (id: Id, value: string) => void;
  onSave: (item: Item) => void;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div>
        <h2 id={headingId} className="text-lg font-semibold text-ink">
          {t("ledger.notebook.stockHeading", locale)}
        </h2>
        <p className="mt-1 text-sm text-moss">
          {t("ledger.notebook.notSales", locale)}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-ink">
          {t("ledger.notebook.noGoods", locale)}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ item }) => {
            const currentQuantity =
              stock.find((entry) => entry.item.id === item.id)?.quantity ?? 0;
            const inputId = `stock-quantity-${item.id}`;
            const errorId = `${inputId}-error`;
            const attempted = attemptedItemId === item.id;
            const quantity = parseQuantity(
              quantities[item.id] ?? "",
              item.allowsFractional,
            );
            const invalidWhole =
              !item.allowsFractional &&
              /^\d+\.\d*[1-9]\d{0,2}$/.test(quantities[item.id] ?? "");

            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-card bg-surface p-4 sm:flex-row sm:items-end sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-ink">{item.name}</h3>
                  <p className="mt-1 text-sm text-moss">
                    {t("ledger.notebook.alreadyBroughtForward", locale)}:{" "}
                    <span className="tabular font-medium text-ink">
                      {formatQuantity(currentQuantity, locale)} {item.unit}
                    </span>
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:max-w-xs">
                  <label htmlFor={inputId} className="font-medium">
                    {t("ledger.notebook.quantity", locale)} ({item.unit})
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={inputId}
                      type="text"
                      inputMode="decimal"
                      value={quantities[item.id] ?? ""}
                      onChange={(event) =>
                        onQuantity(item.id, event.target.value)
                      }
                      className={`${fieldClass} tabular`}
                      aria-invalid={attempted && quantity === null}
                      aria-describedby={attempted ? errorId : undefined}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onSave(item)}
                      className={`${buttonBase} shrink-0 bg-sukuma text-surface hover:bg-sukuma-pressed`}
                    >
                      {t("ledger.notebook.addStock", locale)}
                    </button>
                  </div>
                  {attempted && quantity === null ? (
                    <p
                      id={errorId}
                      role="alert"
                      className="text-sm text-tomato"
                    >
                      {invalidWhole
                        ? t("ledger.notebook.wholeQuantityOnly", locale)
                        : t("ledger.notebook.quantityInvalid", locale)}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

class NotebookQueryBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
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
