// Shared contract (R-011): who is unlocked on this phone. Change only with both devs agreeing.
// In-memory only: the session ends when the tab closes and the PIN is asked again (A4).
"use client";

import { useSyncExternalStore } from "react";

export type Session = {
  profileId: string;
  businessId: string;
  clerkUserId: string;
  email: string;
} | null;

let current: Session = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Session {
  return current;
}

function getServerSnapshot(): Session {
  return null;
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function setSession(session: NonNullable<Session>): void {
  current = session;
  notify();
}

export function clearSession(): void {
  current = null;
  notify();
}

export function useSession(): Session {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
