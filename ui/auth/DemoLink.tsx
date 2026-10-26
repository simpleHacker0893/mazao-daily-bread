import Link from "next/link";
import { t } from "@/i18n/t";
import { focusRing } from "@/ui/landing/primitives";

/** A quiet "Try the demo first" link under the Clerk panel, on the scrimmed photo. */
export function DemoLink() {
  return (
    <Link
      href="/demo"
      prefetch={false}
      className={`inline-flex min-h-12 items-center rounded-card px-3 font-semibold text-surface underline underline-offset-4 ${focusRing} focus-visible:outline-surface`}
    >
      {t("shell.auth.demo")}
    </Link>
  );
}
