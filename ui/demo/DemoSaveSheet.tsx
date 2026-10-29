"use client";

import { useEffect } from "react";
import { t } from "@/i18n/t";

export function DemoSaveSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const dialog = document.getElementById(
      "demo-save-sheet",
    ) as HTMLDialogElement | null;
    if (dialog && !dialog.open) dialog.showModal();
  }, [open]);

  return (
    <dialog
      id="demo-save-sheet"
      aria-labelledby="demo-save-title"
      onClose={onClose}
      className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-sheet bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-ink backdrop:bg-ink/40 sm:inset-x-1/2 sm:bottom-1/2 sm:w-[min(28rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:translate-y-1/2 sm:rounded-card"
    >
      <h2 id="demo-save-title" className="font-semibold text-xl">
        {t("landing.demo.save.title")}
      </h2>
      <p className="mt-3 leading-relaxed">{t("landing.demo.save.body")}</p>
      <a
        href="/sign-in"
        onClick={() => window.sessionStorage.removeItem("mazao.demo")}
        className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-card bg-sukuma px-5 font-bold text-surface"
      >
        {t("landing.demo.banner.start")}
      </a>
      <button
        type="button"
        onClick={() => {
          const dialog = document.getElementById(
            "demo-save-sheet",
          ) as HTMLDialogElement | null;
          dialog?.close();
        }}
        className="ml-3 min-h-12 px-3 font-semibold text-ink underline underline-offset-4"
      >
        {t("landing.demo.save.close")}
      </button>
    </dialog>
  );
}
