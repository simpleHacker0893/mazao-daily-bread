"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/auth/session";
import { fromCents, toCents } from "@/domain/money";
import {
  applicableSteps,
  canAddItem,
  type DraftOnboardingItem,
  MAX_ONBOARDING_ITEMS,
  type OnboardingAnswers,
  type OnboardingProgress,
  type OnboardingStepId,
  progressAfterStep,
  redoAnswers,
  resumeStep,
} from "@/domain/onboarding";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/domain/operating-profile";
import type { MessageKey } from "@/i18n/t";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { writeOnboardingProgress } from "@/local/onboarding-progress";
import {
  useBusinessDb,
  useOnboardingProgress,
  useOperatingProfile,
} from "@/local/queries";
import { saveOnboardingFinish } from "@/local/save";
import { PageTitle } from "@/ui/PageTitle";

const steps: OnboardingStepId[] = [
  "businessName",
  "businessType",
  "location",
  "sells",
  "items",
  "paymentMethods",
  "deni",
  "dueRule",
  "expenseCategories",
];

const stepCopy: Record<
  OnboardingStepId,
  { question: MessageKey; why: MessageKey }
> = {
  businessName: {
    question: "ledger.onboarding.businessName.question",
    why: "ledger.onboarding.businessName.why",
  },
  businessType: {
    question: "ledger.onboarding.businessType.question",
    why: "ledger.onboarding.businessType.why",
  },
  location: {
    question: "ledger.onboarding.location.question",
    why: "ledger.onboarding.location.why",
  },
  sells: {
    question: "ledger.onboarding.sells.question",
    why: "ledger.onboarding.sells.why",
  },
  items: {
    question: "ledger.onboarding.items.question",
    why: "ledger.onboarding.items.why",
  },
  paymentMethods: {
    question: "ledger.onboarding.paymentMethods.question",
    why: "ledger.onboarding.paymentMethods.why",
  },
  deni: {
    question: "ledger.onboarding.deni.question",
    why: "ledger.onboarding.deni.why",
  },
  dueRule: {
    question: "ledger.onboarding.dueRule.question",
    why: "ledger.onboarding.dueRule.why",
  },
  expenseCategories: {
    question: "ledger.onboarding.expenseCategories.question",
    why: "ledger.onboarding.expenseCategories.why",
  },
};

const businessTypes: { value: string; label: MessageKey }[] = [
  {
    value: "vegetable_trader",
    label: "ledger.onboarding.businessType.vegetableTrader",
  },
  { value: "shop", label: "ledger.onboarding.businessType.shop" },
  { value: "boda_transport", label: "ledger.onboarding.businessType.boda" },
  { value: "repair", label: "ledger.onboarding.businessType.repair" },
  { value: "other", label: "ledger.onboarding.businessType.other" },
];

const categoryLabels: Record<string, MessageKey> = {
  transport: "ledger.onboarding.category.transport",
  ushuru: "ledger.onboarding.category.ushuru",
  rent: "ledger.onboarding.category.rent",
  bags: "ledger.onboarding.category.bags",
  "county fees": "ledger.onboarding.category.countyFees",
  airtime: "ledger.onboarding.category.airtime",
  electricity: "ledger.onboarding.category.electricity",
  fuel: "ledger.onboarding.category.fuel",
  "repairs/matengenezo": "ledger.onboarding.category.repairs",
  "vehicle/bike costs": "ledger.onboarding.category.vehicleCosts",
  miscellaneous: "ledger.onboarding.category.miscellaneous",
};

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
const dueRules = ["kesho", "ijumaa", "wiki_ijayo", "mwisho_wa_mwezi"] as const;
const deniOptions: {
  label: MessageKey;
  value: boolean;
  choice: "often" | "sometimes" | "never";
}[] = [
  {
    label: "ledger.onboarding.deni.yesOften",
    value: true,
    choice: "often",
  },
  {
    label: "ledger.onboarding.deni.sometimes",
    value: true,
    choice: "sometimes",
  },
  {
    label: "ledger.onboarding.deni.never",
    value: false,
    choice: "never",
  },
];

const fieldClass =
  "min-h-12 w-full rounded-card border border-line bg-surface px-3 text-base text-ink placeholder:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma";
const choiceClass =
  "min-h-12 rounded-card border px-4 py-2 text-left text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma active:scale-[0.99]";
const primaryClass =
  "inline-flex min-h-[52px] items-center justify-center rounded-card bg-sukuma px-5 text-base font-semibold text-surface transition-colors hover:bg-sukuma-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma active:bg-sukuma-pressed disabled:cursor-not-allowed disabled:opacity-60";
const secondaryClass =
  "inline-flex min-h-12 items-center justify-center rounded-card border border-line bg-surface px-4 text-base font-semibold text-ink transition-colors hover:bg-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma active:bg-chalk disabled:cursor-not-allowed disabled:opacity-60";

function isStepId(value: string | null): value is OnboardingStepId {
  return value !== null && steps.includes(value as OnboardingStepId);
}

function persistedDrafts(items: DraftOnboardingItem[]): DraftOnboardingItem[] {
  return items.filter((item) => item.name.trim().length > 0);
}

function readKes(raw: string): number | null {
  if (!/^\d+(?:\.\d{0,2})?$/.test(raw)) return null;
  return toCents(raw);
}

function Choice({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`${choiceClass} ${
        selected
          ? "border-sukuma bg-sukuma text-surface"
          : "border-line bg-surface text-ink hover:bg-chalk"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Loading({ message }: { message: string }) {
  return (
    <main className="flex min-h-[50dvh] items-center justify-center p-5">
      <output aria-live="polite" className="text-base text-ink">
        {message}
      </output>
    </main>
  );
}

export function OnboardingFlow() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const db = useBusinessDb();
  const savedProgress = useOnboardingProgress();
  const profile = useOperatingProfile();
  const modeRedo = searchParams.get("mode") === "redo";
  const returnToReview = searchParams.get("return") === "review";
  const requestedStep = searchParams.get("step");

  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [draftItems, setDraftItems] = useState<DraftOnboardingItem[]>([]);
  const [stepId, setStepId] = useState<OnboardingStepId>("businessName");
  const [customCategory, setCustomCategory] = useState("");
  const [stepError, setStepError] = useState<MessageKey | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [skipError, setSkipError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deniChoice, setDeniChoice] = useState<
    "often" | "sometimes" | "never" | null
  >(null);
  const initialized = useRef(false);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (initialized.current || !session || !db) return;
    if (savedProgress === undefined || profile === undefined) return;

    const initialAnswers = modeRedo
      ? redoAnswers(profile, savedProgress?.answers)
      : (savedProgress?.answers ?? {});
    const initialItems = modeRedo
      ? (savedProgress?.draftItems ?? initialAnswers.items ?? [])
      : (savedProgress?.draftItems ?? initialAnswers.items ?? []);
    const validSteps = applicableSteps(initialAnswers);
    const initialStep =
      modeRedo && returnToReview && isStepId(requestedStep)
        ? resumeStep(requestedStep, initialAnswers)
        : modeRedo
          ? (validSteps[0] ?? "businessName")
          : resumeStep(savedProgress?.stepId ?? "businessName", initialAnswers);

    initialized.current = true;
    setAnswers(initialAnswers);
    setDraftItems(initialItems);
    setStepId(initialStep);
    setDeniChoice(
      initialAnswers.deniEnabled === true
        ? "often"
        : initialAnswers.deniEnabled === false
          ? "never"
          : null,
    );
    setReady(true);
  }, [
    db,
    modeRedo,
    profile,
    requestedStep,
    returnToReview,
    savedProgress,
    session,
  ]);

  function persistProgress(
    nextAnswers: OnboardingAnswers,
    nextItems: DraftOnboardingItem[],
    nextStep: OnboardingStepId,
  ): Promise<void> {
    if (!db) return Promise.reject(new Error("Business data is unavailable."));
    const safeItems = persistedDrafts(nextItems);
    const safeAnswers = nextAnswers.items
      ? { ...nextAnswers, items: safeItems }
      : nextAnswers;
    const value: OnboardingProgress = {
      status: "in_progress",
      stepId: nextStep,
      answers: safeAnswers,
      draftItems: safeItems,
      updatedAt: new Date().toISOString(),
    };
    const pending = writeQueue.current
      .catch(() => undefined)
      .then(() => writeOnboardingProgress(db, value));
    writeQueue.current = pending;
    return pending.catch((error: unknown) => {
      setSaveError(true);
      throw error;
    });
  }

  function updateAnswer(patch: Partial<OnboardingAnswers>) {
    const nextAnswers = { ...answers, ...patch };
    setAnswers(nextAnswers);
    setStepError(null);
    setSaveError(false);
    void persistProgress(nextAnswers, draftItems, stepId).catch(
      () => undefined,
    );
  }

  function updateDraftItems(nextItems: DraftOnboardingItem[]) {
    setDraftItems(nextItems);
    const nextAnswers = { ...answers, items: nextItems };
    setAnswers(nextAnswers);
    setStepError(null);
    setSaveError(false);
    void persistProgress(nextAnswers, nextItems, stepId).catch(() => undefined);
  }

  const applicable = applicableSteps(answers);
  const activeStep = resumeStep(stepId, answers);
  const index = Math.max(0, applicable.indexOf(activeStep));
  const lastStep = index === applicable.length - 1;
  const timeLeft = Math.max(
    1,
    Math.ceil(((applicable.length - index) * 30) / 60),
  );

  async function goNext() {
    setStepError(null);
    if (activeStep === "items") {
      const activeItems = draftItems.filter(
        (item) => item.name.trim().length > 0,
      );
      if (activeItems.length !== draftItems.length) {
        setStepError("ledger.onboarding.items.nameRequired");
        return;
      }
      if (activeItems.some((item) => item.sellingPrice <= 0)) {
        setStepError("ledger.onboarding.items.priceRequired");
        return;
      }
      if (
        activeItems.some(
          (item) => item.kind === "goods" && item.buyingPrice <= 0,
        )
      ) {
        setStepError("ledger.onboarding.items.buyingPriceRequired");
        return;
      }
    }

    try {
      if (returnToReview || lastStep) {
        await persistProgress(answers, draftItems, activeStep);
        router.replace("/onboarding/review");
        return;
      }
      const current: OnboardingProgress = {
        status: "in_progress",
        stepId: activeStep,
        answers,
        draftItems: persistedDrafts(draftItems),
        updatedAt: new Date().toISOString(),
      };
      const next = progressAfterStep(current, answers, new Date());
      const nextStep = resumeStep(next.stepId, next.answers);
      setStepId(nextStep);
      void persistProgress(next.answers, draftItems, nextStep).catch(
        () => undefined,
      );
    } catch {
      setSaveError(true);
    }
  }

  function goBack() {
    setStepError(null);
    if (returnToReview) {
      router.replace("/onboarding/review");
      return;
    }
    if (index > 0) {
      const previous = applicable[index - 1];
      if (previous) {
        setStepId(previous);
        void persistProgress(answers, draftItems, previous).catch(
          () => undefined,
        );
      }
    }
  }

  async function skipForNow() {
    if (!db || !session) {
      setSkipError(true);
      return;
    }
    setSaving(true);
    setSaveError(false);
    setSkipError(false);
    try {
      await persistProgress(answers, draftItems, activeStep);
      const result = await saveOnboardingFinish(
        {
          db,
          businessId: session.businessId,
          profileId: session.profileId,
        },
        {
          answers: {
            ...answers,
            ...(answers.items ? { items: persistedDrafts(draftItems) } : {}),
          },
          draftItems: persistedDrafts(draftItems),
          status: "skipped",
        },
      );
      if (result.kind === "saved") {
        router.replace("/dashboard");
      } else {
        setSkipError(true);
      }
    } catch {
      setSkipError(true);
    } finally {
      setSaving(false);
    }
  }

  function addItem() {
    if (!canAddItem(draftItems.length)) return;
    const kind = answers.sells === "services" ? "service" : "goods";
    const next: DraftOnboardingItem = {
      kind,
      name: "",
      unit: kind === "service" ? "trip" : "piece",
      allowsFractional: false,
      sellingPrice: 0,
      buyingPrice: 0,
      lowStockThreshold: null,
    };
    updateDraftItems([...draftItems, next]);
  }

  function addExpenseCategory() {
    const value = customCategory.trim();
    if (!value || answers.expenseCategories?.includes(value)) return;
    updateAnswer({
      expenseCategories: [...(answers.expenseCategories ?? []), value],
    });
    setCustomCategory("");
  }

  if (!session) {
    return <Loading message={t("ledger.onboarding.sessionRequired", locale)} />;
  }
  if (!ready) {
    return <Loading message={t("ledger.onboarding.loading", locale)} />;
  }

  const copy = stepCopy[activeStep];
  const selectedCategories = answers.expenseCategories ?? [];
  const categoryChoices = [
    ...new Set([
      ...(profile?.expenseCategories ?? DEFAULT_EXPENSE_CATEGORIES),
      ...selectedCategories,
    ]),
  ];
  const allowedKind =
    answers.sells === "goods"
      ? ["goods"]
      : answers.sells === "services"
        ? ["service"]
        : ["goods", "service"];

  return (
    <main className="relative isolate min-h-[calc(100dvh-5rem)] bg-ink px-4 py-5 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/landing/mama-mboga-stall-640.webp')",
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/75" />
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-2xl flex-col justify-center">
        <header className="mb-4 flex min-h-12 items-center justify-between gap-4">
          <PageTitle title={t("ledger.onboarding.title", locale)} onImage />
          <button
            type="button"
            onClick={() => void skipForNow()}
            disabled={saving}
            className="min-h-12 shrink-0 rounded-card px-2 text-sm font-semibold text-surface underline decoration-surface/60 underline-offset-4 hover:decoration-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface disabled:opacity-60"
          >
            {saving
              ? t("ledger.onboarding.skipping", locale)
              : t("ledger.onboarding.skip", locale)}
          </button>
        </header>
        <section className="w-full rounded-card bg-surface p-5 text-ink sm:p-8">
          <div className="mb-7">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm text-moss">
              <span>
                {t("ledger.onboarding.stepOf", locale)
                  .replace("{step}", String(index + 1))
                  .replace("{total}", String(applicable.length))}
              </span>
              <span>
                {t("ledger.onboarding.minutesLeft", locale).replace(
                  "{minutes}",
                  String(timeLeft),
                )}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label={t("ledger.onboarding.stepOf", locale)
                .replace("{step}", String(index + 1))
                .replace("{total}", String(applicable.length))}
              aria-valuemin={1}
              aria-valuemax={applicable.length}
              aria-valuenow={index + 1}
            >
              <div
                className="h-full rounded-full bg-sukuma transition-[width] duration-200 motion-reduce:transition-none"
                style={{ width: `${((index + 1) / applicable.length) * 100}%` }}
              />
            </div>
          </div>

          <h2 className="mb-2 text-xl font-semibold leading-7 text-ink">
            {t(copy.question, locale)}
          </h2>
          <p className="mb-6 text-base leading-6 text-moss">
            {t(copy.why, locale)}
          </p>

          <div className="min-h-40">
            {activeStep === "businessName" && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">
                  {t("ledger.onboarding.businessName.label", locale)}
                </span>
                <input
                  autoComplete="organization"
                  className={fieldClass}
                  value={answers.businessName ?? ""}
                  placeholder={t(
                    "ledger.onboarding.businessName.placeholder",
                    locale,
                  )}
                  onChange={(event) =>
                    updateAnswer({ businessName: event.target.value })
                  }
                />
              </label>
            )}

            {activeStep === "businessType" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {businessTypes.map((option) => (
                  <Choice
                    key={option.value}
                    label={t(option.label, locale)}
                    selected={answers.businessType === option.value}
                    onClick={() => updateAnswer({ businessType: option.value })}
                  />
                ))}
              </div>
            )}

            {activeStep === "location" && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">
                  {t("ledger.onboarding.location.label", locale)}
                </span>
                <input
                  autoComplete="address-level2"
                  className={fieldClass}
                  value={answers.location ?? ""}
                  placeholder={t(
                    "ledger.onboarding.location.placeholder",
                    locale,
                  )}
                  onChange={(event) =>
                    updateAnswer({ location: event.target.value })
                  }
                />
              </label>
            )}

            {activeStep === "sells" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(["goods", "services", "both"] as const).map((value) => (
                  <Choice
                    key={value}
                    label={t(`ledger.onboarding.sells.${value}`, locale)}
                    selected={answers.sells === value}
                    onClick={() => updateAnswer({ sells: value })}
                  />
                ))}
              </div>
            )}

            {activeStep === "items" && (
              <div className="space-y-4">
                {draftItems.map((item, indexInList) => {
                  const unitOptions =
                    item.kind === "service" ? serviceUnits : goodsUnits;
                  return (
                    <fieldset
                      key={`${item.kind}-${indexInList}`}
                      className="space-y-3 rounded-card bg-chalk p-4"
                    >
                      <legend className="px-1 text-base font-semibold text-ink">
                        {t("ledger.onboarding.items.kind", locale)}{" "}
                        {indexInList + 1}
                      </legend>
                      {allowedKind.length > 1 && (
                        <div className="grid grid-cols-2 gap-2">
                          {(["goods", "service"] as const).map((kind) => (
                            <Choice
                              key={kind}
                              label={t(
                                `ledger.onboarding.items.${kind}`,
                                locale,
                              )}
                              selected={item.kind === kind}
                              onClick={() =>
                                updateDraftItems(
                                  draftItems.map((current, itemIndex) =>
                                    itemIndex === indexInList
                                      ? {
                                          ...current,
                                          kind,
                                          unit:
                                            kind === "service"
                                              ? "trip"
                                              : "piece",
                                          buyingPrice:
                                            kind === "service"
                                              ? 0
                                              : current.buyingPrice,
                                          allowsFractional:
                                            kind === "service"
                                              ? false
                                              : current.allowsFractional,
                                        }
                                      : current,
                                  ),
                                )
                              }
                            />
                          ))}
                        </div>
                      )}
                      <label className="block">
                        <span className="mb-1 block text-sm font-semibold">
                          {t("ledger.onboarding.items.name", locale)}
                        </span>
                        <input
                          className={fieldClass}
                          value={item.name}
                          placeholder={t(
                            "ledger.onboarding.items.namePlaceholder",
                            locale,
                          )}
                          onChange={(event) =>
                            updateDraftItems(
                              draftItems.map((current, itemIndex) =>
                                itemIndex === indexInList
                                  ? { ...current, name: event.target.value }
                                  : current,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-semibold">
                          {t("ledger.onboarding.items.unit", locale)}
                        </span>
                        <select
                          className={fieldClass}
                          value={item.unit}
                          onChange={(event) =>
                            updateDraftItems(
                              draftItems.map((current, itemIndex) =>
                                itemIndex === indexInList
                                  ? { ...current, unit: event.target.value }
                                  : current,
                              ),
                            )
                          }
                        >
                          {unitOptions.map((unit) => (
                            <option key={unit} value={unit}>
                              {t(
                                `ledger.onboarding.unit.${unit}` as MessageKey,
                                locale,
                              )}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-sm font-semibold">
                          {t("ledger.onboarding.items.sellingPrice", locale)}
                        </span>
                        <input
                          className={fieldClass}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={
                            item.sellingPrice === 0
                              ? ""
                              : String(fromCents(item.sellingPrice))
                          }
                          onChange={(event) => {
                            const cents =
                              event.target.value === ""
                                ? 0
                                : readKes(event.target.value);
                            if (cents === null) return;
                            updateDraftItems(
                              draftItems.map((current, itemIndex) =>
                                itemIndex === indexInList
                                  ? { ...current, sellingPrice: cents }
                                  : current,
                              ),
                            );
                          }}
                        />
                      </label>
                      {item.kind === "goods" && (
                        <>
                          <label className="block">
                            <span className="mb-1 block text-sm font-semibold">
                              {t("ledger.onboarding.items.buyingPrice", locale)}
                            </span>
                            <input
                              className={fieldClass}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              value={
                                item.buyingPrice === 0
                                  ? ""
                                  : String(fromCents(item.buyingPrice))
                              }
                              onChange={(event) => {
                                const cents =
                                  event.target.value === ""
                                    ? 0
                                    : readKes(event.target.value);
                                if (cents === null) return;
                                updateDraftItems(
                                  draftItems.map((current, itemIndex) =>
                                    itemIndex === indexInList
                                      ? { ...current, buyingPrice: cents }
                                      : current,
                                  ),
                                );
                              }}
                            />
                          </label>
                          <label className="flex min-h-12 items-center gap-3 text-base">
                            <input
                              type="checkbox"
                              className="size-5 accent-sukuma"
                              checked={item.allowsFractional}
                              onChange={(event) =>
                                updateDraftItems(
                                  draftItems.map((current, itemIndex) =>
                                    itemIndex === indexInList
                                      ? {
                                          ...current,
                                          allowsFractional:
                                            event.target.checked,
                                        }
                                      : current,
                                  ),
                                )
                              }
                            />
                            <span>
                              {t("ledger.onboarding.items.halfUnits", locale)}
                            </span>
                          </label>
                        </>
                      )}
                      <button
                        type="button"
                        className="min-h-12 px-2 text-sm font-semibold text-tomato underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
                        onClick={() =>
                          updateDraftItems(
                            draftItems.filter(
                              (_, itemIndex) => itemIndex !== indexInList,
                            ),
                          )
                        }
                      >
                        {t("ledger.onboarding.items.remove", locale)}
                      </button>
                    </fieldset>
                  );
                })}
                {canAddItem(draftItems.length) ? (
                  <button
                    type="button"
                    className={`${secondaryClass} w-full`}
                    onClick={addItem}
                  >
                    {t("ledger.onboarding.items.add", locale)}
                  </button>
                ) : (
                  <p className="rounded-card bg-maize-tint p-3 text-base font-medium text-maize">
                    {t("ledger.onboarding.items.maxReached", locale)}
                  </p>
                )}
                <p className="text-sm text-moss">
                  {t("ledger.onboarding.items.count", locale)
                    .replace("{count}", String(draftItems.length))
                    .replace("{max}", String(MAX_ONBOARDING_ITEMS))}
                </p>
              </div>
            )}

            {activeStep === "paymentMethods" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(["cash", "mpesa", "other"] as const).map((method) => {
                  const selected =
                    answers.paymentMethods?.includes(method) ?? false;
                  return (
                    <Choice
                      key={method}
                      label={t(
                        `ledger.onboarding.paymentMethods.${method}`,
                        locale,
                      )}
                      selected={selected}
                      onClick={() =>
                        updateAnswer({
                          paymentMethods: selected
                            ? (answers.paymentMethods ?? []).filter(
                                (value) => value !== method,
                              )
                            : [...(answers.paymentMethods ?? []), method],
                        })
                      }
                    />
                  );
                })}
              </div>
            )}

            {activeStep === "deni" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {deniOptions.map((option) => (
                  <Choice
                    key={option.label}
                    label={t(option.label, locale)}
                    selected={deniChoice === option.choice}
                    onClick={() => {
                      setDeniChoice(option.choice);
                      updateAnswer({
                        deniEnabled: option.value,
                        ...(option.value ? {} : { defaultDueRule: null }),
                      });
                    }}
                  />
                ))}
              </div>
            )}

            {activeStep === "dueRule" && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {dueRules.map((rule) => (
                  <Choice
                    key={rule}
                    label={t(`ledger.onboarding.dueRule.${rule}`, locale)}
                    selected={answers.defaultDueRule === rule}
                    onClick={() => updateAnswer({ defaultDueRule: rule })}
                  />
                ))}
                <Choice
                  label={t("ledger.onboarding.dueRule.none", locale)}
                  selected={answers.defaultDueRule === null}
                  onClick={() => updateAnswer({ defaultDueRule: null })}
                />
              </div>
            )}

            {activeStep === "expenseCategories" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {categoryChoices.map((category) => {
                    const selected = selectedCategories.includes(category);
                    return (
                      <Choice
                        key={category}
                        label={
                          categoryLabels[category]
                            ? t(categoryLabels[category], locale)
                            : category
                        }
                        selected={selected}
                        onClick={() =>
                          updateAnswer({
                            expenseCategories: selected
                              ? selectedCategories.filter(
                                  (value) => value !== category,
                                )
                              : [...selectedCategories, category],
                          })
                        }
                      />
                    );
                  })}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="flex-1">
                    <span className="sr-only">
                      {t(
                        "ledger.onboarding.expenseCategories.placeholder",
                        locale,
                      )}
                    </span>
                    <input
                      className={fieldClass}
                      value={customCategory}
                      placeholder={t(
                        "ledger.onboarding.expenseCategories.placeholder",
                        locale,
                      )}
                      onChange={(event) =>
                        setCustomCategory(event.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className={secondaryClass}
                    onClick={addExpenseCategory}
                  >
                    {t("ledger.onboarding.expenseCategories.add", locale)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {stepError && (
            <p
              role="alert"
              className="mt-4 rounded-card bg-tomato-tint p-3 text-base text-tomato"
            >
              {t(stepError, locale)}
            </p>
          )}
          {saveError && (
            <p
              role="alert"
              className="mt-4 rounded-card bg-tomato-tint p-3 text-base text-tomato"
            >
              {t("ledger.onboarding.saveError", locale)}
            </p>
          )}
          {skipError && (
            <p
              role="alert"
              className="mt-4 rounded-card bg-tomato-tint p-3 text-base text-tomato"
            >
              {t("ledger.onboarding.skipError", locale)}
            </p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              className={secondaryClass}
              onClick={goBack}
              disabled={saving || (index === 0 && !returnToReview)}
            >
              {t("ledger.onboarding.back", locale)}
            </button>
            <button
              type="button"
              className={primaryClass}
              onClick={() => void goNext()}
              disabled={saving}
            >
              {returnToReview
                ? t("ledger.onboarding.saveAnswer", locale)
                : lastStep
                  ? t("ledger.onboarding.review", locale)
                  : t("ledger.onboarding.next", locale)}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
