"use client";

import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { ClerkRoot } from "@/auth/clerk";
import { BottomNav } from "@/ui/shell/BottomNav";
import { SyncChip } from "@/ui/shell/SyncChip";

/** The existing signed-in shell; dynamically loaded only after demo mode is ruled out. */
export function NormalAppShell({ children }: { children: ReactNode }) {
  return (
    <ClerkRoot>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-line border-b bg-surface px-4">
          <SyncChip />
          <div className="flex min-h-12 min-w-12 items-center justify-center">
            <UserButton />
          </div>
        </header>
        <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </ClerkRoot>
  );
}
