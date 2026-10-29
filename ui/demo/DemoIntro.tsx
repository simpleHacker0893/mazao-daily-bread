"use client";

import { useRouter } from "next/navigation";
import { t } from "@/i18n/t";
import { focusRing, LandingImage } from "@/ui/landing/primitives";

export function DemoIntro() {
  const router = useRouter();

  function openDemo() {
    try {
      window.sessionStorage.setItem("mazao.demo", "1");
      router.push("/dashboard");
    } catch {
      // If browser storage is unavailable, do not enter a mode that cannot persist safely.
    }
  }

  return (
    <main className="relative isolate flex min-h-dvh flex-1 flex-col justify-end overflow-hidden bg-ink px-6 py-10 sm:px-10">
      <LandingImage
        name="phone-fundi-kiosk"
        alt={t("landing.demo.intro.photoAlt")}
        sizes="100vw"
        eager
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/70" />
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <h1 className="max-w-3xl font-extrabold text-[min(3rem,12vw)] text-surface leading-[1.05] tracking-tight md:text-6xl">
          {t("landing.demo.intro.title")}
        </h1>
        <p className="max-w-xl text-lg text-surface leading-relaxed">
          {t("landing.demo.intro.description")}
        </p>
        <button
          type="button"
          onClick={openDemo}
          className={`min-h-[52px] rounded-card bg-sukuma px-6 font-bold text-surface hover:bg-sukuma-pressed ${focusRing}`}
        >
          {t("landing.demo.intro.open")}
        </button>
      </div>
    </main>
  );
}
