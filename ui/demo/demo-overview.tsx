"use client";

import { useState } from "react";
import { demoFixture } from "@/demo/fixture";
import { formatKES } from "@/domain/money";
import { t } from "@/i18n/t";
import { DemoSaveSheet } from "./DemoSaveSheet";

export function DemoOverview() {
  const [saveOpen, setSaveOpen] = useState(false);
  const today = demoFixture.today;

  function exitDemo() {
    window.sessionStorage.removeItem("mazao.demo");
    window.location.assign("/");
  }

  return (
    <div className="min-h-dvh bg-chalk pb-[env(safe-area-inset-bottom)]">
      <aside
        aria-label={t("landing.demo.banner.label")}
        className="sticky top-0 z-30 border-b border-maize bg-maize-tint px-4 py-3 text-ink"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">{t("landing.demo.banner.message")}</p>
          <div className="flex items-center gap-3">
            <a
              className="min-h-12 inline-flex items-center font-semibold underline underline-offset-4"
              href="/sign-in"
              onClick={() => window.sessionStorage.removeItem("mazao.demo")}
            >
              {t("landing.demo.banner.start")}
            </a>
            <button
              type="button"
              onClick={exitDemo}
              className="min-h-12 px-2 font-semibold underline underline-offset-4"
            >
              {t("landing.demo.banner.exit")}
            </button>
          </div>
        </div>
      </aside>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 pb-12 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-semibold text-[22px] leading-7">
              {t("landing.demo.overview.title")}
            </h1>
            <p className="mt-1 text-sm text-moss">
              {demoFixture.businessName} · {demoFixture.location} ·{" "}
              {demoFixture.period}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            className="min-h-[52px] rounded-card bg-sukuma px-5 font-bold text-surface hover:bg-sukuma-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma"
          >
            {t("landing.demo.overview.newSale")}
          </button>
        </header>

        <section
          aria-labelledby="demo-profit-title"
          className="border-y border-line bg-surface px-4 py-5 sm:px-6"
        >
          <h2 id="demo-profit-title" className="text-sm font-medium text-moss">
            {t("landing.demo.overview.profit")}
          </h2>
          <p className="tabular mt-1 font-bold text-4xl tracking-tight">
            {formatKES(today.netProfit)}
          </p>
          <div className="mt-5 grid grid-cols-3 divide-x divide-line">
            <Metric
              label={t("landing.demo.overview.sales")}
              value={formatKES(today.sales)}
            />
            <Metric
              label={t("landing.demo.overview.cost")}
              value={formatKES(today.costOfGoods)}
            />
            <Metric
              label={t("landing.demo.overview.expenses")}
              value={formatKES(today.expenses)}
            />
          </div>
        </section>

        <section
          aria-labelledby="demo-money-title"
          className="border-b border-line pb-5"
        >
          <h2 id="demo-money-title" className="font-semibold text-base">
            {t("landing.demo.overview.moneyIn")}
          </h2>
          <div
            className="mt-3 flex h-3 overflow-hidden rounded-card"
            aria-hidden="true"
          >
            <span style={{ width: today.cashShare }} className="bg-ink" />
            <span style={{ width: today.mpesaShare }} className="bg-mpesa" />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span>
              {t("landing.demo.overview.cash")}:{" "}
              <strong className="tabular">{formatKES(today.cash)}</strong>
            </span>
            <span>
              {t("landing.demo.overview.mpesa")}:{" "}
              <strong className="tabular">{formatKES(today.mpesa)}</strong>
            </span>
            <span className="text-maize">
              {t("landing.demo.overview.givenOnDeni")}: {formatKES(today.deni)}
            </span>
          </div>
        </section>

        <section aria-labelledby="demo-sales-title">
          <h2 id="demo-sales-title" className="font-semibold text-base">
            {t("landing.demo.overview.recentSales")}
          </h2>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {demoFixture.recentSales.map((sale) => (
              <li
                key={sale.item}
                className="flex min-h-14 items-center justify-between gap-4 py-2"
              >
                <span>
                  {sale.item}
                  <span className="ml-2 text-sm text-moss">{sale.payment}</span>
                </span>
                <strong className="tabular shrink-0">
                  {formatKES(sale.amount)}
                </strong>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <DemoSaveSheet open={saveOpen} onClose={() => setSaveOpen(false)} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 first:pl-0 last:pr-0 sm:px-4">
      <p className="text-xs text-moss sm:text-sm">{label}</p>
      <p className="tabular mt-1 font-semibold text-sm sm:text-base">{value}</p>
    </div>
  );
}
