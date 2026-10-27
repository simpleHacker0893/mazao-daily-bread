"use client";
// "Welcome to Mazao": privacy notice, "I agree", then Clerk (email code or Google). After Clerk
// signs in: bootstrap, then completeSignIn decides /lock, /set-pin or a refusal (Phase 1 Task 3).
import { SignIn, SignUp, useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SignInMode } from "@/auth/after-sign-in";
import { bootstrap } from "@/auth/bootstrap";
import { acceptPrivacy, completeSignIn } from "@/auth/sign-in-flow";
import { type MessageKey, t } from "@/i18n/t";
import { useLocale } from "@/i18n/use-locale";
import { restore } from "@/sync/restore";
import { focusRing } from "@/ui/landing/primitives";
import { PageTitle } from "@/ui/PageTitle";

type Phase =
  | { kind: "idle" }
  | { kind: "clearing" }
  | { kind: "working" }
  | { kind: "error" }
  | { kind: "refused"; ownerEmail: string }
  | { kind: "mismatch" };

const privacyLines: MessageKey[] = [
  "shell.signIn.privacy.store",
  "shell.signIn.privacy.eu",
  "shell.signIn.privacy.pin",
  "shell.signIn.privacy.delete",
];

function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export function SignInScreen({ variant }: { variant: "signIn" | "signUp" }) {
  const locale = useLocale();
  const online = useOnline();
  const router = useRouter();
  const mode: SignInMode =
    useSearchParams().get("mode") === "reset" ? "reset" : "first";
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  // Forgot PIN must follow a fresh email-code sign-in made in this page view (C1).
  const [readyForReset, setReadyForReset] = useState(mode === "first");
  const sawLoad = useRef(false);

  useEffect(() => {
    if (!isLoaded || sawLoad.current) return;
    sawLoad.current = true;
    if (mode === "reset" && isSignedIn) {
      setPhase({ kind: "clearing" });
      clerk.signOut().then(() => {
        setReadyForReset(true);
        setPhase({ kind: "idle" });
      });
    } else {
      setReadyForReset(true);
    }
  }, [isLoaded, isSignedIn, mode, clerk]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !readyForReset) return;
    if (phase.kind !== "idle") return;
    setPhase({ kind: "working" });
    (async () => {
      try {
        const boot = await bootstrap();
        const result = await completeSignIn(
          { mode, boot },
          { signOut: () => clerk.signOut(), restore, now: Date.now },
        );
        if (result.kind === "navigate") router.replace(result.to);
        else if (result.kind === "refused") {
          setPhase({ kind: "refused", ownerEmail: result.ownerEmail });
        } else setPhase({ kind: "mismatch" });
      } catch {
        setPhase({ kind: "error" });
      }
    })();
  }, [isLoaded, isSignedIn, readyForReset, phase.kind, mode, clerk, router]);

  const here =
    mode === "reset"
      ? "/sign-in?mode=reset"
      : variant === "signIn"
        ? "/sign-in"
        : "/sign-up";
  const panel = "w-full max-w-md rounded-card bg-surface p-5 text-ink";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <PageTitle title={t("shell.signIn.title", locale)} onImage />

      {!online ? (
        <output className={`${panel} block`}>
          {t("shell.signIn.offline", locale)}
        </output>
      ) : phase.kind === "working" || phase.kind === "clearing" ? (
        <output aria-live="polite" className={`${panel} block`}>
          {t("shell.signIn.working", locale)}
        </output>
      ) : phase.kind === "error" ? (
        <div role="alert" className={`${panel} flex flex-col gap-4`}>
          <p>{t("shell.signIn.error", locale)}</p>
          <button
            type="button"
            onClick={() => setPhase({ kind: "idle" })}
            className={`min-h-12 rounded-card bg-sukuma px-4 font-bold text-surface ${focusRing}`}
          >
            {t("shell.signIn.retry", locale)}
          </button>
        </div>
      ) : phase.kind === "refused" ? (
        <p role="alert" className={panel}>
          {t("shell.signIn.refused.before", locale)}{" "}
          <strong>{phase.ownerEmail}</strong>.{" "}
          {t("shell.signIn.refused.after", locale)}
        </p>
      ) : phase.kind === "mismatch" ? (
        <p role="alert" className={panel}>
          {t("shell.signIn.resetMismatch", locale)}
        </p>
      ) : (
        <>
          <section
            aria-labelledby="privacy-heading"
            className={`${panel} flex flex-col gap-3`}
          >
            <h2 id="privacy-heading" className="font-bold text-lg">
              {t("shell.signIn.privacy.heading", locale)}
            </h2>
            <ul className="flex flex-col gap-1.5 text-moss">
              {privacyLines.map((key) => (
                <li key={key}>{t(key, locale)}</li>
              ))}
            </ul>
            <Link
              href="/privacy"
              className={`inline-flex min-h-12 items-center self-start rounded-card font-semibold text-sukuma underline underline-offset-4 ${focusRing}`}
            >
              {t("shell.signIn.privacy.link", locale)}
            </Link>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 font-bold">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => {
                  setAgreed(event.target.checked);
                  if (event.target.checked) acceptPrivacy(new Date());
                }}
                className="size-6"
              />
              {t("shell.signIn.agree", locale)}
            </label>
          </section>
          {agreed && readyForReset ? (
            variant === "signIn" ? (
              <SignIn routing="hash" forceRedirectUrl={here} />
            ) : (
              <SignUp routing="hash" forceRedirectUrl={here} />
            )
          ) : null}
        </>
      )}
    </div>
  );
}
