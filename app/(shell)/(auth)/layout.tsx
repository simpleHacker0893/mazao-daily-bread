import Link from "next/link";
import { ClerkRoot } from "@/auth/clerk";
import { t } from "@/i18n/t";
import { focusRing, LandingImage } from "@/ui/landing/primitives";

/**
 * /sign-in and /sign-up: the stall photo under a flat 70% Ink scrim, with Clerk's form on its
 * own Surface panel (build prompt 11c). Online only; these pages never hold records.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkRoot>
      <div className="relative isolate flex min-h-full flex-1 flex-col items-center px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <LandingImage
          name="mama-mboga-stall"
          alt={t("shell.auth.photoAlt")}
          sizes="100vw"
          eager
          className="absolute inset-0 -z-20 h-full w-full object-[70%_40%]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/70" />
        <Link
          href="/"
          aria-label={t("shell.auth.home")}
          className={`flex min-h-12 items-center rounded-card px-1 font-extrabold text-[1.625rem] text-surface tracking-tight ${focusRing}`}
        >
          {t("shell.app.name")}
        </Link>
        <main className="flex w-full flex-1 flex-col items-center justify-center gap-6 py-8">
          {children}
        </main>
      </div>
    </ClerkRoot>
  );
}
