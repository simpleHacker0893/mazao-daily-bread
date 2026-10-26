import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

// Clerk's prebuilt UI in the Mazao world: Manrope, 8px radius, Sukuma as the only action
// colour, Maize-morning surfaces. Values mirror the tokens in app/globals.css.
const appearance = {
  variables: {
    colorPrimary: "#14532d",
    colorPrimaryForeground: "#fdfaf2",
    colorBackground: "#fdfaf2",
    colorForeground: "#141a16",
    colorMutedForeground: "#4e5a52",
    colorInput: "#fdfaf2",
    colorInputForeground: "#141a16",
    colorBorder: "#e0d8c6",
    colorRing: "#14532d",
    colorDanger: "#b42318",
    colorNeutral: "#141a16",
    fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
    borderRadius: "8px",
  },
  options: {
    socialButtonsVariant: "blockButton",
  },
} as const;

/**
 * Clerk for the app and the sign-in pages only. The landing page, /privacy and /demo sit
 * outside it, so they never load Clerk (#22).
 */
export function ClerkRoot({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={appearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
