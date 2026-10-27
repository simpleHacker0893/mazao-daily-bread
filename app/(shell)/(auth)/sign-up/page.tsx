import type { Metadata } from "next";
import { Suspense } from "react";
import { t } from "@/i18n/t";
import { DemoLink } from "@/ui/auth/DemoLink";
import { SignInScreen } from "@/ui/auth/SignInScreen";

export const metadata: Metadata = {
  title: t("shell.auth.signUp.title"),
  description: t("shell.auth.description"),
};

// Static page: the screen reads ?mode=reset on the client, inside Suspense.
export default function SignUpPage() {
  return (
    <>
      <Suspense>
        <SignInScreen variant="signUp" />
      </Suspense>
      <DemoLink />
    </>
  );
}
