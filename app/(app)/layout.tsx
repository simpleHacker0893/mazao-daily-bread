import { BottomNav } from "@/ui/shell/BottomNav";
import { SyncChip } from "@/ui/shell/SyncChip";

/**
 * AppShell: top bar with the backup chip, page content, and the bottom nav at
 * every width (D-040). LockGuard joins this layout in Phase 1.
 */
export default function AppShell({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-line border-b bg-surface px-4">
        <SyncChip />
      </header>
      {/* Clears the fixed bottom nav and the phone's gesture area. */}
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
