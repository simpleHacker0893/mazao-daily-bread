"use client";

import { t } from "@/i18n/t";
import { PageTitle } from "@/ui/PageTitle";

export default function SetPinPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-chalk p-6">
      <PageTitle title={t("shell.page.setPin")} />
    </main>
  );
}
