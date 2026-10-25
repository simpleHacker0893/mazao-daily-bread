import type { Metadata } from "next";
import { type MessageKey, t } from "@/i18n/t";
import { LandingFooter, LandingHeader } from "@/ui/landing/chrome";
import { Container } from "@/ui/landing/primitives";

// Static and precached, like /welcome. Provisional text until the owner supplies the notice (Q-011).
export const metadata: Metadata = {
  title: t("privacy.meta.title"),
  description: t("privacy.meta.description"),
};

const sections: [title: MessageKey, body: MessageKey][] = [
  ["privacy.collect.title", "privacy.collect.body"],
  ["privacy.device.title", "privacy.device.body"],
  ["privacy.backup.title", "privacy.backup.body"],
  ["privacy.share.title", "privacy.share.body"],
  ["privacy.delete.title", "privacy.delete.body"],
  ["privacy.contact.title", "privacy.contact.body"],
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-chalk">
      <LandingHeader />
      <main className="flex-1 py-12 lg:py-20">
        <Container className="flex max-w-[760px] flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="font-extrabold text-[min(2.5rem,12vw)] text-ink leading-[1.05] tracking-tight md:text-6xl">
              {t("privacy.title")}
            </h1>
            <p className="text-lg text-moss leading-relaxed">
              {t("privacy.intro")}
            </p>
          </div>
          {sections.map(([title, body]) => (
            <section key={title} className="flex flex-col gap-2">
              <h2 className="font-bold text-2xl text-ink">{t(title)}</h2>
              <p className="text-lg text-moss leading-relaxed">{t(body)}</p>
            </section>
          ))}
        </Container>
      </main>
      <LandingFooter />
    </div>
  );
}
