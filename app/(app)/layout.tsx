import { SessionAwareAppShell } from "@/ui/demo/SessionAwareAppShell";

/**
 * AppShell: the normal shell retains its Clerk boundary and navigation. A session-scoped demo
 * is isolated before that authenticated shell mounts. LockGuard joins this layout in Phase 1.
 */
export default function AppShell({ children }: LayoutProps<"/">) {
  return <SessionAwareAppShell>{children}</SessionAwareAppShell>;
}
