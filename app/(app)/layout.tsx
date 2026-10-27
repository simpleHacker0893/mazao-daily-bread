import { UserButton } from "@clerk/nextjs";
import { ClerkRoot } from "@/auth/clerk";
import { BottomNav } from "@/ui/shell/BottomNav";
import { SyncChip } from "@/ui/shell/SyncChip";

/**
 * AppShell: top bar with the backup chip and the account button, page content, and the bottom
 * nav at every width (D-040). Every route here needs a Clerk sign-in (proxy.ts). LockGuard joins
 * this layout in Phase 1.
 */
export default function AppShell({ children }: LayoutProps<"/">) {
  return (
    <ClerkRoot>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-line border-b bg-surface px-4">
          <SyncChip />
          <div className="flex min-h-12 min-w-12 items-center justify-center">
            <UserButton />
          </div>
        </header>
        {/* Clears the fixed bottom nav and the phone's gesture area. */}
        <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </ClerkRoot>
  );
}
