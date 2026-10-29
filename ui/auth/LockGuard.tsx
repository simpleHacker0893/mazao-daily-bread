"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { clearPendingSignIn, getDeviceAccount } from "@/auth/pin-flow";
import { clearSession, useSession } from "@/auth/session";
import { type MessageKey, t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import type { DeviceAccount } from "@/local/device-db";

const BACKGROUND_LOCK_MS = 5 * 60 * 1000;

export function LockGuard({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const router = useRouter();
  const session = useSession();
  const [account, setAccount] = useState<DeviceAccount | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    let active = true;
    getDeviceAccount()
      .then((saved) => {
        if (!active) return;
        setAccount(saved ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setError("shell.pin.guard.storage");
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded || error) return;
    if (!account) {
      clearSession();
      router.replace("/");
      return;
    }
    if (
      !session ||
      session.profileId !== account.profileId ||
      session.clerkUserId !== account.clerkUserId ||
      session.businessId !== account.businessId
    ) {
      clearSession();
      router.replace("/lock");
    }
  }, [account, error, loaded, router, session]);

  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt ??= Date.now();
        return;
      }
      if (hiddenAt === null) return;
      const elapsed = Date.now() - hiddenAt;
      hiddenAt = null;
      if (elapsed < BACKGROUND_LOCK_MS) return;
      clearSession();
      void clearPendingSignIn().catch(() => undefined);
      router.replace("/lock");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [router]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-md items-center p-5">
        <p
          role="alert"
          className="w-full rounded-card bg-tomato-tint p-4 text-tomato"
        >
          {t(error, locale)}
        </p>
      </main>
    );
  }
  if (
    !loaded ||
    !account ||
    !session ||
    session.profileId !== account.profileId ||
    session.clerkUserId !== account.clerkUserId ||
    session.businessId !== account.businessId
  ) {
    return (
      <output aria-live="polite" className="block p-6 text-center text-moss">
        {t("shell.pin.guard.loading", locale)}
      </output>
    );
  }
  return children;
}
