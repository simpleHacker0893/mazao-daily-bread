// What the top-bar chip shows (blueprint A5.6).
export type SyncStatus =
  | { state: "backed-up" }
  | { state: "saving" }
  | { state: "not-backed-up"; pending: number }
  | { state: "sign-in-required" };

/**
 * Stub for A2: nothing syncs yet, so the honest answer is "Not backed up".
 * A5 replaces the body with the real queue and Clerk state; the shape stays.
 */
export function useSyncStatus(): SyncStatus {
  return { state: "not-backed-up", pending: 0 };
}
