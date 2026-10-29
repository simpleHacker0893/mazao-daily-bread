"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/auth/session";
import { formatKES, toCents } from "@/domain/money";
import type { ItemKind } from "@/domain/types";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import type { NewItem } from "@/local/commit";
import { useBusinessDb, useItemsWithStock } from "@/local/queries";
import { addItem } from "@/local/save";
import { focusRing } from "@/ui/landing/primitives";

const buttonClass = `inline-flex min-h-12 items-center justify-center rounded-card px-4 font-semibold ${focusRing}`;
const fieldClass = `min-h-12 w-full rounded-card border border-line bg-surface px-3 text-ink placeholder:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma ${focusRing}`;
const goodsUnits = [
  "kilo",
  "gunia",
  "tray",
  "piece",
  "crate",
  "bag",
  "litre",
  "fundo",
  "ndume",
  "other",
] as const;
const serviceUnits = ["trip", "job", "piece"] as const;

function parsePrice(value: string): number | null {
  if (!/^\d+(?:\.\d{0,2})?$/.test(value)) return null;
  return toCents(value);
}

function parseThreshold(value: string): number | null {
  if (!value.trim()) return null;
  if (!/^\d+(?:\.\d{0,3})?$/.test(value)) return Number.NaN;
  return Number(value);
}

export function ItemsScreen() {
  const locale = useLocale();
  const session = useSession();
  const items = useItemsWithStock();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!session) {
    return (
      <p role="alert" className="mt-6 rounded-card bg-surface p-4 text-ink">
        {t("ledger.items.sessionRequired", locale)}
      </p>
    );
  }
  if (items === undefined) {
    return (
      <p
        aria-live="polite"
        className="mt-6 rounded-card bg-surface p-4 text-moss"
      >
        {t("ledger.items.loading", locale)}
      </p>
    );
  }

  const goods = items.filter(({ item }) => item.kind === "goods");
  const services = items.filter(({ item }) => item.kind === "service");
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="max-w-prose text-sm text-moss">
          {t("ledger.items.goods", locale)} · {goods.length}{" "}
          <span aria-hidden="true">/</span> {t("ledger.items.services", locale)}{" "}
          · {services.length}
        </p>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={`${buttonClass} shrink-0 bg-sukuma text-surface hover:bg-sukuma-pressed`}
        >
          {t("ledger.items.addItem", locale)}
        </button>
      </div>

      <ItemGroup
        heading={t("ledger.items.goods", locale)}
        empty={t("ledger.items.noGoods", locale)}
        rows={goods}
        locale={locale}
      />
      <ItemGroup
        heading={t("ledger.items.services", locale)}
        empty={t("ledger.items.noServices", locale)}
        rows={services}
        locale={locale}
      />

      {sheetOpen ? <AddItemSheet onClose={() => setSheetOpen(false)} /> : null}
    </div>
  );
}

function ItemGroup({
  heading,
  empty,
  rows,
  locale,
}: {
  heading: string;
  empty: string;
  rows: NonNullable<ReturnType<typeof useItemsWithStock>>;
  locale: ReturnType<typeof useLocale>;
}) {
  return (
    <section aria-label={heading} className="flex flex-col gap-3">
      <h2 className="font-semibold text-lg text-ink">{heading}</h2>
      {rows.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-moss">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ item, onHand }) => {
            const low =
              item.kind === "goods" &&
              item.lowStockThreshold !== null &&
              onHand !== null &&
              onHand <= item.lowStockThreshold;
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-4"
              >
                <div className="min-w-[10rem] flex-1">
                  <h3 className="font-semibold text-ink">{item.name}</h3>
                  <p className="mt-1 text-sm text-moss">
                    {item.kind === "service"
                      ? t("ledger.items.serviceNoStock", locale)
                      : item.unit}
                  </p>
                </div>
                {item.kind === "goods" ? (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <p>
                      <span className="block text-moss">
                        {t("ledger.items.sellingPrice", locale)}
                      </span>
                      <strong className="tabular text-ink">
                        {formatKES(item.sellingPrice)}
                      </strong>
                    </p>
                    <p>
                      <span className="block text-moss">
                        {t("ledger.items.buyingPrice", locale)}
                      </span>
                      <strong className="tabular text-ink">
                        {formatKES(item.buyingPrice)}
                      </strong>
                    </p>
                    <p>
                      <span className="block text-moss">
                        {t("ledger.items.stockOnHand", locale)}
                      </span>
                      <strong className="tabular text-ink">
                        {onHand} {item.unit}
                      </strong>
                    </p>
                    {low ? (
                      <span className="rounded-card bg-maize-tint px-3 py-2 font-semibold text-maize">
                        {t("ledger.items.low", locale)}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-moss">
                    {t("ledger.items.sellingPrice", locale)}{" "}
                    <strong className="tabular text-ink">
                      {formatKES(item.sellingPrice)}
                    </strong>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function AddItemSheet({ onClose }: { onClose: () => void }) {
  const locale = useLocale();
  const session = useSession();
  const db = useBusinessDb();
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<ItemKind>("goods");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<
    (typeof goodsUnits)[number] | "trip" | "job"
  >("kilo");
  const [sellingRaw, setSellingRaw] = useState("");
  const [buyingRaw, setBuyingRaw] = useState("");
  const [thresholdRaw, setThresholdRaw] = useState("");
  const [allowsFractional, setAllowsFractional] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const saveLock = useRef(false);
  const sellingPrice = parsePrice(sellingRaw);
  const buyingPrice = kind === "service" ? 0 : parsePrice(buyingRaw);
  const threshold = kind === "service" ? null : parseThreshold(thresholdRaw);
  const valid =
    name.trim().length > 0 &&
    sellingPrice !== null &&
    buyingPrice !== null &&
    (threshold === null || Number.isFinite(threshold));

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  function close() {
    if (saving) return;
    const element = dialog.current;
    if (element?.open) element.close();
    else onClose();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (!valid || sellingPrice === null || buyingPrice === null) return;
    if (!session || !db || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setSaveError(false);
    const draft: NewItem = {
      kind,
      name: name.trim(),
      unit,
      allowsFractional: kind === "goods" && allowsFractional,
      sellingPrice,
      buyingPrice,
      lowStockThreshold: threshold,
    };
    try {
      await addItem(
        { db, businessId: session.businessId, profileId: session.profileId },
        draft,
      );
      close();
    } catch {
      setSaveError(true);
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  const units = kind === "goods" ? goodsUnits : serviceUnits;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="add-item-title"
      onClose={onClose}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-sheet border-line border-t bg-chalk p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-ink backdrop:bg-ink/40 sm:inset-x-1/2 sm:bottom-1/2 sm:w-[min(34rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:translate-y-1/2 sm:rounded-card sm:border"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="add-item-title" className="text-xl font-semibold">
          {t("ledger.items.addTitle", locale)}
        </h2>
        <button
          type="button"
          aria-label={t("ledger.items.closeAdd", locale)}
          onClick={close}
          className={`${buttonClass} px-3 text-ink`}
        >
          ×
        </button>
      </div>
      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 w-full text-sm font-medium">
            {t("ledger.items.kind", locale)}
          </legend>
          {(["goods", "service"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={kind === option}
              onClick={() => {
                setKind(option);
                setUnit(option === "goods" ? "kilo" : "trip");
              }}
              className={`${buttonClass} border border-line ${
                kind === option
                  ? "bg-sukuma text-surface"
                  : "bg-surface text-ink hover:bg-chalk"
              }`}
            >
              {t(
                option === "goods"
                  ? "ledger.items.goodsKind"
                  : "ledger.items.serviceKind",
                locale,
              )}
            </button>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1.5 font-medium">
          {t("ledger.items.name", locale)}
          <input
            type="text"
            autoComplete="off"
            value={name}
            aria-invalid={attempted && name.trim().length === 0}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 font-medium">
          {t("ledger.items.unit", locale)}
          <select
            value={unit}
            onChange={(event) => setUnit(event.target.value as typeof unit)}
            className={fieldClass}
          >
            {units.map((value) => (
              <option key={value} value={value}>
                {t(`ledger.onboarding.unit.${value}`, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-medium">
          {t("ledger.items.sellingPriceInput", locale)}
          <input
            type="text"
            inputMode="decimal"
            value={sellingRaw}
            aria-invalid={attempted && sellingPrice === null}
            onChange={(event) => setSellingRaw(event.target.value)}
            className={fieldClass}
          />
        </label>
        {kind === "goods" ? (
          <>
            <label className="flex flex-col gap-1.5 font-medium">
              {t("ledger.items.buyingPriceInput", locale)}
              <input
                type="text"
                inputMode="decimal"
                value={buyingRaw}
                aria-invalid={attempted && buyingPrice === null}
                onChange={(event) => setBuyingRaw(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 font-medium">
              {t("ledger.items.lowStockThreshold", locale)}
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.001"
                value={thresholdRaw}
                aria-invalid={
                  attempted && threshold !== null && !Number.isFinite(threshold)
                }
                onChange={(event) => setThresholdRaw(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-card bg-surface px-3 font-medium">
              <input
                type="checkbox"
                checked={allowsFractional}
                onChange={(event) => setAllowsFractional(event.target.checked)}
                className="size-5 accent-sukuma"
              />
              {t("ledger.items.allowsFractional", locale)}
            </label>
          </>
        ) : null}
        {attempted && name.trim().length === 0 ? (
          <p role="alert" className="text-sm text-tomato">
            {t("ledger.items.nameRequired", locale)}
          </p>
        ) : null}
        {attempted && (sellingPrice === null || buyingPrice === null) ? (
          <p role="alert" className="text-sm text-tomato">
            {t("ledger.items.priceInvalid", locale)}
          </p>
        ) : null}
        {attempted && threshold !== null && !Number.isFinite(threshold) ? (
          <p role="alert" className="text-sm text-tomato">
            {t("ledger.items.thresholdInvalid", locale)}
          </p>
        ) : null}
        {saveError ? (
          <p
            role="alert"
            className="rounded-card bg-tomato-tint p-3 text-tomato"
          >
            {t("ledger.items.itemSaveError", locale)}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={close}
            className={`${buttonClass} border border-line bg-surface text-ink`}
          >
            {t("ledger.items.cancel", locale)}
          </button>
          <button
            type="submit"
            disabled={!session || !db || saving}
            className={`${buttonClass} flex-1 bg-sukuma text-surface hover:bg-sukuma-pressed disabled:opacity-60`}
          >
            {saving
              ? t("ledger.items.savingItem", locale)
              : t("ledger.items.saveItem", locale)}
          </button>
        </div>
      </form>
    </dialog>
  );
}
