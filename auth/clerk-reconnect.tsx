"use client";
// Clerk loads its script from the network. After a cold offline start it never loads, so when
// the network comes back the page reloads to load Clerk fresh (sign-in, Forgot PIN, backups).
import { useEffect } from "react";

type ClerkWindow = { Clerk?: { loaded?: boolean } };

function clerkLoaded(): boolean {
  return (window as unknown as ClerkWindow).Clerk?.loaded === true;
}

export function ClerkReconnect() {
  useEffect(() => {
    const onOnline = () => {
      if (!clerkLoaded()) window.location.reload();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
  return null;
}

/** Resolves true once Clerk has loaded, false after `timeoutMs` (Forgot PIN, the sync engine). */
export function waitForClerk(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (clerkLoaded()) return resolve(true);
    const started = Date.now();
    const timer = setInterval(() => {
      if (clerkLoaded()) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() - started >= timeoutMs) {
        clearInterval(timer);
        resolve(false);
      }
    }, 100);
  });
}
