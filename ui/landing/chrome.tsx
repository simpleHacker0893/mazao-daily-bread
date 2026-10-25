import Link from "next/link";
import { t } from "@/i18n/t";
import {
  Action,
  Container,
  focusRing,
  landingRoutes,
  supportHref,
} from "./primitives";

/** The landing header, shared by /welcome and /privacy. 64 px tall. */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-line border-b bg-chalk">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-x-2">
        <Link
          href="/welcome"
          className={`-ml-1 flex min-h-12 items-center rounded-card px-1 font-extrabold text-2xl text-ink tracking-tight ${focusRing}`}
        >
          {t("landing.brand")}
        </Link>
        <nav aria-label={t("landing.header.navLabel")}>
          <ul className="flex flex-wrap items-center justify-end gap-1 md:gap-2">
            <li>
              <Action href={landingRoutes.demo} variant="text">
                {t("landing.cta.demo")}
              </Action>
            </li>
            {/* At 360 px there is no room for a third action, and "Start free" reaches the same page. */}
            <li className="hidden md:block">
              <Action href={landingRoutes.signIn} variant="text">
                {t("landing.cta.signIn")}
              </Action>
            </li>
            <li>
              <Action href={landingRoutes.start} variant="primary">
                {t("landing.cta.start")}
              </Action>
            </li>
          </ul>
        </nav>
      </Container>
    </header>
  );
}

const footerLink = `inline-flex min-h-12 items-center rounded-card font-semibold text-ink underline-offset-4 hover:underline ${focusRing}`;

export function LandingFooter() {
  return (
    <footer className="border-line border-t bg-chalk">
      <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <p className="font-extrabold text-2xl text-ink tracking-tight">
          {t("landing.brand")}
        </p>
        <nav aria-label={t("landing.footer.navLabel")}>
          <ul className="flex flex-col md:flex-row md:gap-8">
            <li>
              <Link
                href={landingRoutes.privacy}
                prefetch={false}
                className={footerLink}
              >
                {t("landing.footer.privacy")}
              </Link>
            </li>
            <li>
              <a href={supportHref} rel="noopener" className={footerLink}>
                {t("landing.footer.support")}
              </a>
            </li>
          </ul>
        </nav>
        <p className="text-moss">{t("landing.footer.copyright")}</p>
      </Container>
    </footer>
  );
}
