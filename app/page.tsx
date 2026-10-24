import { t } from "@/i18n/t";

// Placeholder until A2 builds the AppShell and Muhtasari page.
export default function Home() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <h1 className="text-2xl font-semibold">{t("shell.app.name")}</h1>
    </main>
  );
}
