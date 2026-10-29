"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { waitForClerk } from "@/auth/clerk-reconnect";
import {
  clearPendingSignIn,
  getDeviceAccount,
  getPinSetupState,
  PinFlowError,
  setupPin,
  unlockWithPin,
} from "@/auth/pin-flow";
import { clearSession, setSession } from "@/auth/session";
import { type MessageKey, t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import type { DeviceAccount } from "@/local/device-db";
import { nextRouteAfterPin } from "@/local/routing";
import { PageTitle } from "@/ui/PageTitle";
import { PinPad } from "./PinPad";

const panel = "w-full max-w-md rounded-card bg-surface p-5 text-ink";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma";

function messageFor(error: unknown): MessageKey {
  if (!(error instanceof PinFlowError)) return "shell.pin.error.storage";
  const keys: Record<PinFlowError["code"], MessageKey> = {
    invalid_pin: "shell.pin.error.invalid",
    weak_pin: "shell.pin.error.weak",
    mismatch: "shell.pin.error.mismatch",
    setup_not_allowed: "shell.pin.error.setupNotAllowed",
    account_changed: "shell.pin.error.accountChanged",
    locked: "shell.pin.error.locked",
    incorrect_pin: "shell.pin.error.incorrect",
    storage_unavailable: "shell.pin.error.storage",
  };
  return keys[error.code];
}

function interpolate(
  key: MessageKey,
  values: Record<string, string>,
  locale: ReturnType<typeof useLocale>,
): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, value),
    t(key, locale),
  );
}

export function SetPinScreen() {
  const locale = useLocale();
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      getPinSetupState(null)
        .then((state) =>
          router.replace(state.hasAccount ? "/lock" : "/sign-in"),
        )
        .catch(() => router.replace("/sign-in"));
      return;
    }
    let active = true;
    getPinSetupState(userId)
      .then((state) => {
        if (!active) return;
        if (!state.pending) {
          router.replace(state.hasAccount ? "/lock" : "/sign-in");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (active) setError("shell.pin.error.storage");
      });
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, userId, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !userId) return;
    setBusy(true);
    setError(null);
    try {
      const session = await setupPin({
        pin,
        confirmation,
        clerkUserId: userId,
      });
      setSession(session);
      setPin("");
      setConfirmation("");
      router.replace(await nextRouteAfterPin(session.businessId));
    } catch (cause) {
      setError(messageFor(cause));
      setPin("");
      setConfirmation("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-5 bg-chalk p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <PageTitle title={t("shell.page.setPin", locale)} />
      {!ready ? (
        error ? (
          <p role="alert" className={`${panel} text-tomato`}>
            {t(error, locale)}
          </p>
        ) : (
          <output aria-live="polite" className={panel}>
            {t("shell.pin.guard.loading", locale)}
          </output>
        )
      ) : (
        <form onSubmit={submit} className={`${panel} flex flex-col gap-5`}>
          <p>{t("shell.pin.setup.instruction", locale)}</p>
          <p className="text-sm text-moss">
            {t("shell.pin.setup.remember", locale)}
          </p>
          <PinPad
            label="shell.pin.input.label"
            value={pin}
            onChange={setPin}
            disabled={busy}
            locale={locale}
          />
          <PinPad
            label="shell.pin.input.confirmLabel"
            value={confirmation}
            onChange={setConfirmation}
            disabled={busy}
            locale={locale}
          />
          {error ? (
            <p
              role="alert"
              className="rounded-card bg-tomato-tint p-3 text-tomato"
            >
              {t(error, locale)}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || !isLoaded || !isSignedIn}
            className={`min-h-12 rounded-card bg-sukuma px-4 font-bold text-surface disabled:cursor-not-allowed disabled:opacity-60 ${focus}`}
          >
            {busy
              ? t("shell.pin.lock.opening", locale)
              : t("shell.pin.setup.submit", locale)}
          </button>
        </form>
      )}
    </main>
  );
}

export function LockScreen() {
  const locale = useLocale();
  const router = useRouter();
  const clerk = useClerk();
  const { isLoaded } = useAuth();
  const [account, setAccount] = useState<DeviceAccount | null>(null);
  const [ready, setReady] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    clearSession();
    let active = true;
    Promise.all([getDeviceAccount(), clearPendingSignIn()])
      .then(([saved]) => {
        if (!active) return;
        if (!saved) {
          router.replace("/sign-in");
          setError("shell.pin.error.accountMissing");
          return;
        }
        setAccount(saved);
        setLockedUntil(saved.lockedUntil);
        setReady(true);
      })
      .catch(() => {
        if (active) setError("shell.pin.error.storage");
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!lockedUntil || lockedUntil <= Date.now()) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) setLockedUntil(null);
    }, 250);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const secondsLeft =
    lockedUntil && lockedUntil > now
      ? Math.ceil((lockedUntil - now) / 1000)
      : 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || busy || secondsLeft > 0) return;
    setBusy(true);
    setError(null);
    try {
      const result = await unlockWithPin(pin, account.profileId);
      setSession(result.session);
      router.replace(await nextRouteAfterPin(result.session.businessId));
    } catch (cause) {
      const key = messageFor(cause);
      setError(key);
      setPin("");
      if (cause instanceof PinFlowError && cause.code === "incorrect_pin") {
        try {
          const updated = await getDeviceAccount();
          setLockedUntil(updated?.lockedUntil ?? null);
          setNow(Date.now());
        } catch {
          setError("shell.pin.error.storage");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function forgotPin() {
    if (resetBusy) return;
    setError(null);
    if (!navigator.onLine) {
      setError("shell.pin.lock.resetOffline");
      return;
    }
    setResetBusy(true);
    try {
      if (!isLoaded && !(await waitForClerk(10_000))) {
        setError("shell.pin.lock.resetOffline");
        return;
      }
      await clerk.signOut();
      router.push("/sign-in?mode=reset");
    } catch {
      setError("shell.pin.lock.resetError");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-5 bg-chalk p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <PageTitle title={t("shell.page.lock", locale)} />
      {!ready ? (
        <output aria-live="polite" className={panel}>
          {error ? t(error, locale) : t("shell.pin.guard.loading", locale)}
        </output>
      ) : (
        <form onSubmit={submit} className={`${panel} flex flex-col gap-5`}>
          <p className="font-semibold">
            {interpolate(
              "shell.pin.lock.email",
              { email: account?.email ?? "" },
              locale,
            )}
          </p>
          <PinPad
            label="shell.pin.input.label"
            value={pin}
            onChange={setPin}
            disabled={busy || secondsLeft > 0}
            locale={locale}
          />
          {secondsLeft > 0 ? (
            <output
              aria-live="polite"
              className="text-center font-semibold text-maize"
            >
              {interpolate(
                "shell.pin.lock.secondsRemaining",
                { seconds: String(secondsLeft) },
                locale,
              )}
            </output>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="rounded-card bg-tomato-tint p-3 text-tomato"
            >
              {t(error, locale)}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || secondsLeft > 0 || !pin}
            className={`min-h-12 rounded-card bg-sukuma px-4 font-bold text-surface disabled:cursor-not-allowed disabled:opacity-60 ${focus}`}
          >
            {busy
              ? t("shell.pin.lock.opening", locale)
              : t("shell.page.lock", locale)}
          </button>
          <button
            type="button"
            onClick={forgotPin}
            disabled={resetBusy}
            className={`min-h-12 self-center rounded-card px-4 font-semibold text-sukuma underline underline-offset-4 disabled:opacity-60 ${focus}`}
          >
            {resetBusy
              ? t("shell.pin.lock.resetWorking", locale)
              : t("shell.pin.lock.forgot", locale)}
          </button>
        </form>
      )}
    </main>
  );
}
