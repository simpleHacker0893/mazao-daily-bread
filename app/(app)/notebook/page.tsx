"use client";

import { t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { NotebookScreen } from "@/ui/notebook/NotebookScreen";
import { PageTitle } from "@/ui/PageTitle";

export default function NotebookPage() {
  const locale = useLocale();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:px-8">
      <PageTitle title={t("ledger.notebook.title", locale)} />
      <NotebookScreen />
    </div>
  );
}
