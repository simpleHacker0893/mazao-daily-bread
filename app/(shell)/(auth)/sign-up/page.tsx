import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { t } from "@/i18n/t";
import { DemoLink } from "@/ui/auth/DemoLink";

export const metadata: Metadata = {
  title: t("shell.auth.signUp.title"),
  description: t("shell.auth.description"),
};

// Hash routing keeps this one static page (no catch-all segment, D-041).
export default function SignUpPage() {
  return (
    <>
      <SignUp routing="hash" />
      <DemoLink />
    </>
  );
}
