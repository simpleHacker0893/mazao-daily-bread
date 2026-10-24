import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { t } from "@/i18n/t";
import "./globals.css";

// Placeholder font until A2 brings in Manrope with the design tokens.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: t("shell.app.name"),
  description: t("shell.app.description"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
