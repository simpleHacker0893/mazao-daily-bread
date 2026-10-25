"use client";

import { t } from "@/i18n/t";
import { type SyncStatus, useSyncStatus } from "@/sync/useSyncStatus";

/** Top-bar backup chip. The hook is a stub until A5 wires the sync queue. */
export function SyncChip() {
  const status = useSyncStatus();

  return (
    <output
      data-sync-status={status.state}
      className={`inline-flex items-center gap-1.5 rounded-card border border-line bg-surface px-2 py-1 font-medium text-[13px] ${
        status.state === "backed-up"
          ? "text-sukuma"
          : status.state === "sign-in-required"
            ? "text-maize"
            : "text-moss"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z" />
        {status.state === "backed-up" && <path d="M9.5 13l2 2 3.5-3.5" />}
      </svg>
      {label(status)}
    </output>
  );
}

function label(status: SyncStatus): string {
  switch (status.state) {
    case "backed-up":
      return t("shell.sync.backedUp");
    case "saving":
      return t("shell.sync.saving");
    case "sign-in-required":
      return t("shell.sync.signInToBackUp");
    case "not-backed-up":
      return status.pending > 0
        ? `${t("shell.sync.notBackedUp")} (${status.pending})`
        : t("shell.sync.notBackedUp");
  }
}
