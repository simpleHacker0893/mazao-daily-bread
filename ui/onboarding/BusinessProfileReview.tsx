"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { useSession } from "@/auth/session";
import { formatKES } from "@/domain/money";
import {
  buildProfile,
  type DraftOnboardingItem,
  type OnboardingAnswers,
  type OnboardingStepId,
  planItemCreation,
} from "@/domain/onboarding";
import { defaultProfile } from "@/domain/operating-profile";
import type { MessageKey } from "@/i18n/t";
import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import {
  useBusinessDb,
  useItemsWithStock,
  useOnboardingProgress,
  useOperatingProfile,
} from "@/local/queries";
import { saveOnboardingFinish } from "@/local/save";
import { PageTitle } from "@/ui/PageTitle";

const businessTypeLabel: Record<string, MessageKey> = {
  vegetable_trader: "ledger.onboarding.businessType.vegetableTrader",
  shop: "ledger.onboarding.businessType.shop",
  boda_transport: "ledger.onboarding.businessType.boda",
  repair: "ledger.onboarding.businessType.repair",
  other: "ledger.onboarding.businessType.other",
};

const expenseCategoryLabel: Record<string, MessageKey> = {
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

const fieldClass =
  "inline-flex min-h-12 items-center justify-center rounded-card px-3 text-sm font-semibold text-sukuma underline decoration-line underline-offset-4 hover:decoration-sukuma focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma";
const primaryClass =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-card bg-sukuma px-5 text-base font-semibold text-surface transition-colors hover:bg-sukuma-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma active:bg-sukuma-pressed disabled:cursor-not-allowed disabled:opacity-60";

function Loading({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-[50dvh] max-w-3xl items-center justify-center p-5">
      <output aria-live="polite" className="text-base text-ink">
        {message}
      </output>
    </main>
  );
}

function NotAnswered({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-12 rounded-card bg-maize-tint px-3 text-left text-base font-medium text-maize underline decoration-maize/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma"
    >
      {label}
    </button>
  );
}

function ProfileSection({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  onEdit?: () => void;
  editLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-line py-5 last:border-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold leading-6 text-ink">{title}</h2>
        {onEdit && (
          <button type="button" className={fieldClass} onClick={onEdit}>
            {editLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function ReviewRow({
  label,
  value,
  edit,
  editLabel,
  notAnswered,
}: {
  label: string;
  value?: string;
  edit: () => void;
  editLabel: string;
  notAnswered: string;
}) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-sm font-semibold text-moss">{label}</p>
        {value ? (
          <p className="text-base text-ink">{value}</p>
        ) : (
          <NotAnswered onClick={edit} label={notAnswered} />
        )}
      </div>
      <button type="button" className={fieldClass} onClick={edit}>
        {editLabel}
      </button>
    </div>
  );
}

function editUrl(step: OnboardingStepId): string {
  return `/onboarding?mode=redo&return=review&step=${step}`;
}

export function BusinessProfileReview() {
  const locale = useLocale();
  const router = useRouter();
  const session = useSession();
  const db = useBusinessDb();
  const progress = useOnboardingProgress();
  const storedProfile = useOperatingProfile();
  const existingItems = useItemsWithStock();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [issues, setIssues] = useState<MessageKey[]>([]);

  if (!session) {
    return <Loading message={t("ledger.profile.sessionRequired", locale)} />;
  }
  if (
    progress === undefined ||
    storedProfile === undefined ||
    existingItems === undefined
  ) {
    return <Loading message={t("ledger.profile.loading", locale)} />;
  }

  const answers: OnboardingAnswers = progress?.answers ?? {};
  const draftItems: DraftOnboardingItem[] =
    progress?.draftItems ?? answers.items ?? [];
  const profile = buildProfile(answers, storedProfile ?? defaultProfile());
  const allItems = existingItems.map(({ item }) => ({
    name: item.name,
    kind: item.kind,
  }));
  const itemPlan = planItemCreation(draftItems, allItems);
  const goods = draftItems.filter((item) => item.kind === "goods");
  const services = draftItems.filter((item) => item.kind === "service");
  const edit = (step: OnboardingStepId) => router.push(editUrl(step));
  const notAnswered = t("ledger.profile.notAnswered", locale);
  const editLabel = t("ledger.profile.edit", locale);

  async function finishSetup() {
    if (!db || !session) {
      setSaveError(true);
      return;
    }
    if (draftItems.some((item) => !item.name.trim())) {
      setIssues(["ledger.onboarding.items.nameRequired"]);
      return;
    }
    if (draftItems.some((item) => item.sellingPrice <= 0)) {
      setIssues(["ledger.onboarding.items.priceRequired"]);
      return;
    }
    if (
      draftItems.some((item) => item.kind === "goods" && item.buyingPrice <= 0)
    ) {
      setIssues(["ledger.onboarding.items.buyingPriceRequired"]);
      return;
    }
    setSaving(true);
    setSaveError(false);
    setIssues([]);
    try {
      const result = await saveOnboardingFinish(
        {
          db,
          businessId: session.businessId,
          profileId: session.profileId,
        },
        {
          answers,
          draftItems,
          status: "completed",
        },
      );
      if (result.kind === "saved") {
        router.replace("/notebook");
      } else {
        setIssues(result.issues.map((issue) => issue.messageKey));
        setSaveError(true);
      }
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-5rem)] bg-chalk px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5">
          <PageTitle title={t("ledger.profile.title", locale)} />
        </header>

        <div className="rounded-card bg-surface px-4 sm:px-6">
          <ProfileSection
            title={t("ledger.profile.business", locale)}
            editLabel={editLabel}
          >
            <ReviewRow
              label={t("ledger.profile.businessName", locale)}
              value={answers.businessName?.trim()}
              edit={() => edit("businessName")}
              editLabel={editLabel}
              notAnswered={notAnswered}
            />
            <ReviewRow
              label={t("ledger.profile.businessType", locale)}
              value={
                answers.businessType
                  ? t(
                      businessTypeLabel[answers.businessType] ??
                        "ledger.onboarding.businessType.other",
                      locale,
                    )
                  : undefined
              }
              edit={() => edit("businessType")}
              editLabel={editLabel}
              notAnswered={notAnswered}
            />
            <ReviewRow
              label={t("ledger.profile.location", locale)}
              value={answers.location?.trim()}
              edit={() => edit("location")}
              editLabel={editLabel}
              notAnswered={notAnswered}
            />
            <ReviewRow
              label={t("ledger.profile.sells", locale)}
              value={
                answers.sells
                  ? t(`ledger.onboarding.sells.${answers.sells}`, locale)
                  : undefined
              }
              edit={() => edit("sells")}
              editLabel={editLabel}
              notAnswered={notAnswered}
            />
          </ProfileSection>

          <ProfileSection
            title={t("ledger.profile.items", locale)}
            onEdit={() => edit("items")}
            editLabel={editLabel}
          >
            {goods.length > 0 ? (
              <ul className="space-y-2">
                {goods.map((item, index) => {
                  const exists = itemPlan.alreadyExist.some(
                    (known) =>
                      known.kind === item.kind &&
                      known.name.trim().toLowerCase() ===
                        item.name.trim().toLowerCase(),
                  );
                  return (
                    <li
                      key={`${item.name}-${index}`}
                      className="flex flex-col gap-1 py-1"
                    >
                      <p className="text-base font-semibold text-ink">
                        {item.name} · {item.unit}
                      </p>
                      <p className="tabular text-base text-ink">
                        {t("ledger.onboarding.items.sellingPrice", locale)}:{" "}
                        {formatKES(item.sellingPrice)}
                      </p>
                      <p className="tabular text-base text-ink">
                        {t("ledger.onboarding.items.buyingPrice", locale)}:{" "}
                        {formatKES(item.buyingPrice)}
                      </p>
                      {exists && (
                        <p className="text-sm text-moss">
                          {t("ledger.profile.existingItemPrice", locale)}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : answers.sells === "services" ? (
              <p className="text-base text-moss">
                {t("ledger.profile.noGoods", locale)}
              </p>
            ) : (
              <NotAnswered onClick={() => edit("items")} label={notAnswered} />
            )}
          </ProfileSection>

          <ProfileSection
            title={t("ledger.profile.services", locale)}
            onEdit={() => edit("items")}
            editLabel={editLabel}
          >
            {services.length > 0 ? (
              <ul className="space-y-2">
                {services.map((item, index) => (
                  <li
                    key={`${item.name}-${index}`}
                    className="flex flex-col gap-1 py-1"
                  >
                    <p className="text-base font-semibold text-ink">
                      {item.name} · {item.unit}
                    </p>
                    <p className="tabular text-base text-ink">
                      {t("ledger.onboarding.items.sellingPrice", locale)}:{" "}
                      {formatKES(item.sellingPrice)}
                    </p>
                    {itemPlan.alreadyExist.some(
                      (known) =>
                        known.kind === item.kind &&
                        known.name.trim().toLowerCase() ===
                          item.name.trim().toLowerCase(),
                    ) && (
                      <p className="text-sm text-moss">
                        {t("ledger.profile.existingItemPrice", locale)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : answers.sells === "goods" ? (
              <p className="text-base text-moss">
                {t("ledger.profile.noServices", locale)}
              </p>
            ) : (
              <NotAnswered onClick={() => edit("items")} label={notAnswered} />
            )}
          </ProfileSection>

          <ProfileSection
            title={t("ledger.profile.payments", locale)}
            onEdit={() => edit("paymentMethods")}
            editLabel={editLabel}
          >
            {answers.paymentMethods && answers.paymentMethods.length > 0 ? (
              <p className="text-base text-ink">
                {answers.paymentMethods
                  .map((method) =>
                    t(`ledger.onboarding.paymentMethods.${method}`, locale),
                  )
                  .join(", ")}
              </p>
            ) : (
              <NotAnswered
                onClick={() => edit("paymentMethods")}
                label={notAnswered}
              />
            )}
          </ProfileSection>

          <ProfileSection
            title={t("ledger.profile.deni", locale)}
            onEdit={() => edit("deni")}
            editLabel={editLabel}
          >
            {typeof answers.deniEnabled === "boolean" ? (
              <div className="space-y-1">
                <p className="text-base text-ink">
                  {t(
                    answers.deniEnabled
                      ? "ledger.profile.yesDeni"
                      : "ledger.profile.noDeni",
                    locale,
                  )}
                </p>
                {answers.deniEnabled && (
                  <p className="text-base text-ink">
                    {answers.defaultDueRule === null
                      ? t("ledger.profile.noUsualDay", locale)
                      : answers.defaultDueRule
                        ? t(
                            `ledger.onboarding.dueRule.${answers.defaultDueRule}`,
                            locale,
                          )
                        : notAnswered}
                  </p>
                )}
              </div>
            ) : (
              <NotAnswered onClick={() => edit("deni")} label={notAnswered} />
            )}
            {answers.deniEnabled === true &&
              answers.defaultDueRule === undefined && (
                <div className="mt-2">
                  <button
                    type="button"
                    className="min-h-12 rounded-card bg-maize-tint px-3 text-left text-base font-medium text-maize underline decoration-maize/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma"
                    onClick={() => edit("dueRule")}
                  >
                    {notAnswered}
                  </button>
                </div>
              )}
          </ProfileSection>

          <ProfileSection
            title={t("ledger.profile.expenses", locale)}
            onEdit={() => edit("expenseCategories")}
            editLabel={editLabel}
          >
            {answers.expenseCategories &&
            answers.expenseCategories.length > 0 ? (
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {answers.expenseCategories.map((category) => (
                  <li key={category} className="text-base text-ink">
                    {expenseCategoryLabel[category]
                      ? t(expenseCategoryLabel[category], locale)
                      : category}
                  </li>
                ))}
              </ul>
            ) : (
              <NotAnswered
                onClick={() => edit("expenseCategories")}
                label={notAnswered}
              />
            )}
          </ProfileSection>

          <ProfileSection
            title={t("ledger.profile.warnings", locale)}
            editLabel={editLabel}
          >
            <dl className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-base text-ink">
                  {t("ledger.profile.belowCost", locale)}
                </dt>
                <dd className="text-base font-semibold text-ink">
                  {t(
                    profile.rules.belowCost === "warn"
                      ? "ledger.profile.warn"
                      : "ledger.profile.block",
                    locale,
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-base text-ink">
                  {t("ledger.profile.negativeStock", locale)}
                </dt>
                <dd className="text-base font-semibold text-ink">
                  {t(
                    profile.rules.negativeStock === "warn"
                      ? "ledger.profile.warn"
                      : "ledger.profile.block",
                    locale,
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-base text-ink">
                  {t("ledger.profile.priceVariance", locale)}
                </dt>
                <dd className="text-base font-semibold text-ink">
                  {t(
                    profile.rules.priceVariance.mode === "warn"
                      ? "ledger.profile.warn"
                      : "ledger.profile.block",
                    locale,
                  )}{" "}
                  ({profile.rules.priceVariance.thresholdPct}%)
                </dd>
              </div>
            </dl>
          </ProfileSection>
        </div>

        {issues.length > 0 && (
          <div
            role="alert"
            className="mt-4 rounded-card bg-tomato-tint p-4 text-tomato"
          >
            <p className="mb-2 font-semibold">
              {t("ledger.profile.issueHeading", locale)}
            </p>
            <ul className="list-inside list-disc space-y-1">
              {issues.map((issue) => (
                <li key={issue}>{t(issue, locale)}</li>
              ))}
            </ul>
          </div>
        )}
        {saveError && (
          <p
            role="alert"
            className="mt-4 rounded-card bg-tomato-tint p-4 text-base text-tomato"
          >
            {t("ledger.profile.saveError", locale)}
          </p>
        )}
        <div className="mt-5 pb-8">
          <button
            type="button"
            className={primaryClass}
            onClick={() => void finishSetup()}
            disabled={saving}
          >
            {t(
              saving ? "ledger.profile.saving" : "ledger.profile.setUp",
              locale,
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
