import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { t } from "@/i18n/t";
import "./globals.css";

// Manrope: clear numerals and tabular figures (design tokens).
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: t("shell.app.name"),
  description: t("shell.app.description"),
};

// cover: the shell pads for the phone's gesture area with safe-area insets.
export const viewport: Viewport = {
  themeColor: "#fcfdfb",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
