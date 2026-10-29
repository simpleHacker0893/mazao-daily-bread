"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/auth/session";
import type { Issue } from "@/domain/grill";
import { toCents } from "@/domain/money";
import type { PaymentMethod } from "@/domain/types";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { useBusinessDb, useOperatingProfile, useToday } from "@/local/queries";
import { saveExpense, saveSettings } from "@/local/save";
import { focusRing } from "@/ui/landing/primitives";

const buttonClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;
const fieldClass = `min-h-12 w-full rounded-card border border-line bg-surface px-3 text-ink placeholder:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma ${focusRing}`;
const allMethods: PaymentMethod[] = ["cash", "mpesa", "other"];

function parseAmount(raw: string): number | null {
  if (!/^\d+(?:\.\d{0,2})?$/.test(raw)) return null;
  const amount = toCents(raw);
  return amount > 0 ? amount : null;
}

export function NewExpenseForm() {
  const locale = useLocale();
  const router = useRouter();
  const session = useSession();
  const db = useBusinessDb();
  const profile = useOperatingProfile();
  const today = useToday();
  const saveLock = useRef(false);
  const categoryLock = useRef(false);
  const [amountRaw, setAmountRaw] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<Issue[]>([]);
  const amount = parseAmount(amountRaw);

  useEffect(() => {
    if (!profile) return;
    setMethod(
      profile.paymentMethods.includes("cash")
        ? "cash"
        : (profile.paymentMethods[0] ?? "cash"),
    );
  }, [profile]);

  if (!session || !db) {
    return (
      <p role="alert" className="rounded-card bg-surface p-4 text-ink">
        {t("ledger.expense.sessionRequired", locale)}
      </p>
    );
  }
  if (profile === undefined) {
    return (
      <p aria-live="polite" className="rounded-card bg-surface p-4 text-moss">
        {t("ledger.expense.loadingForm", locale)}
      </p>
    );
  }

  const methods = profile.paymentMethods.length
    ? profile.paymentMethods
    : ["cash" as const];
  const visibleMethods = allMethods.filter((value) => methods.includes(value));
  const categoryValid = category.length > 0;
  async function addCategory() {
    if (!session || !db || !profile || categoryLock.current) return;
    const name = newCategory.trim();
    if (!name) {
      setCategoryError(true);
      return;
    }
    categoryLock.current = true;
    setCategorySaving(true);
    setCategoryError(false);
    try {
      const existing = profile.expenseCategories.find(
        (value) => value.toLocaleLowerCase() === name.toLocaleLowerCase(),
      );
      if (existing) {
        setCategory(existing);
      } else {
        const updatedProfile = {
          ...profile,
          expenseCategories: [...profile.expenseCategories, name],
        };
        await saveSettings(
          { db, businessId: session.businessId, profileId: session.profileId },
          updatedProfile,
        );
        setCategory(name);
      }
      setNewCategory("");
      setAddingCategory(false);
    } catch {
      setCategoryError(true);
    } finally {
      categoryLock.current = false;
      setCategorySaving(false);
    }
  }

  async function submit(override = false) {
    if (saveLock.current || !session || !db || amount === null || !category)
      return;
    saveLock.current = true;
    setSaving(true);
    setPendingOverride([]);
    setSaveError(false);
    try {
      const outcome = await saveExpense(
        { db, businessId: session.businessId, profileId: session.profileId },
        {
          amount,
          paymentMethod: method,
          expenseCategory: category,
          ...(note.trim() ? { description: note.trim() } : {}),
        },
        override ? { override: true } : {},
      );
      if (outcome.kind === "saved") {
        router.push("/expenses");
      } else if (outcome.kind === "needs_override") {
        setPendingOverride(outcome.issues);
      } else {
        setSaveError(true);
      }
    } catch {
      setSaveError(true);
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    void submit(pendingOverride.length > 0);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-24"
    >
      <label className="flex flex-col gap-1.5 font-medium text-ink">
        {t("ledger.expense.amount", locale)}
        <input
          type="text"
          inputMode="decimal"
          value={amountRaw}
          aria-invalid={attempted && amount === null}
          onChange={(event) => {
            setAmountRaw(event.target.value);
            setPendingOverride([]);
            setSaveError(false);
          }}
          className={`${fieldClass} text-lg tabular`}
        />
      </label>
      {attempted && amount === null ? (
        <p role="alert" className="-mt-4 text-sm text-tomato">
          {t("ledger.expense.amountInvalid", locale)}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold text-lg text-ink">
          {t("ledger.expense.category", locale)}
        </legend>
        <div className="flex flex-wrap gap-2">
          {profile.expenseCategories.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => {
                setCategory(value);
                setCategoryError(false);
              }}
              className={`${buttonClass} border border-line ${
                category === value
                  ? "bg-sukuma text-surface"
                  : "bg-surface text-ink hover:bg-chalk"
              }`}
            >
              {value}
            </button>
          ))}
          <button
            type="button"
            aria-expanded={addingCategory}
            onClick={() => setAddingCategory((open) => !open)}
            className={`${buttonClass} border border-sukuma bg-surface text-sukuma hover:bg-chalk`}
          >
            {t("ledger.expense.addCategory", locale)}
          </button>
        </div>
        {addingCategory ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1.5 font-medium">
              {t("ledger.expense.newCategory", locale)}
              <input
                type="text"
                value={newCategory}
                aria-invalid={categoryError && !newCategory.trim()}
                onChange={(event) => {
                  setNewCategory(event.target.value);
                  setCategoryError(false);
                }}
                className={fieldClass}
              />
            </label>
            <button
              type="button"
              disabled={categorySaving}
              onClick={() => void addCategory()}
              className={`${buttonClass} self-end bg-sukuma text-surface disabled:opacity-60`}
            >
              {categorySaving
                ? t("ledger.expense.saving", locale)
                : t("ledger.expense.saveCategory", locale)}
            </button>
          </div>
        ) : null}
        {categoryError ? (
          <p role="alert" className="text-sm text-tomato">
            {addingCategory && !newCategory.trim()
              ? t("ledger.expense.categoryNameRequired", locale)
              : t("ledger.expense.categorySaveError", locale)}
          </p>
        ) : null}
        {attempted && !categoryValid ? (
          <p role="alert" className="text-sm text-tomato">
            {t("ledger.expense.categoryRequired", locale)}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold text-lg text-ink">
          {t("ledger.expense.paymentMethod", locale)}
        </legend>
        <div className="flex flex-wrap gap-2">
          {visibleMethods.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={method === value}
              onClick={() => setMethod(value)}
              className={`${buttonClass} border border-line ${
                method === value
                  ? "bg-sukuma text-surface"
                  : "bg-surface text-ink hover:bg-chalk"
              }`}
            >
              {t(`ledger.sale.${value}`, locale)}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5 font-medium text-ink">
        {t("ledger.expense.noteOptional", locale)}
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={fieldClass}
        />
      </label>

      <div className="rounded-card bg-surface p-4">
        <p className="text-sm text-moss">
          {t("ledger.expense.todayDate", locale)}
        </p>
        <p className="mt-1 font-medium text-ink">
          {new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", {
            dateStyle: "long",
            timeZone: "Africa/Nairobi",
          }).format(new Date(`${today}T12:00:00+03:00`))}
        </p>
      </div>

      {pendingOverride.length > 0 ? (
        <div role="alert" className="rounded-card bg-maize-tint p-4 text-ink">
          <h2 className="font-semibold">
            {t("ledger.sale.validationHeading", locale)}
          </h2>
          {pendingOverride.map((issue) => (
            <p key={issue.code}>{t(issue.messageKey, locale)}</p>
          ))}
        </div>
      ) : null}
      {saveError ? (
        <p role="alert" className="rounded-card bg-tomato-tint p-4 text-tomato">
          {t("ledger.expense.saveError", locale)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={saving}
        className={`${buttonClass} min-h-[52px] w-full bg-sukuma text-surface hover:bg-sukuma-pressed disabled:opacity-60`}
      >
        {saving
          ? t("ledger.expense.saving", locale)
          : pendingOverride.length > 0
            ? t("ledger.sale.saveAnyway", locale)
            : t("ledger.expense.save", locale)}
      </button>
    </form>
  );
}
