import type { MessageKey } from "@/i18n/t";

export type NavIcon = "overview" | "sales" | "debts" | "expenses" | "more";

export type NavTab = { label: MessageKey; href: string; icon: NavIcon };
export type MoreItem = { label: MessageKey; href: string };

// Bottom nav at every width, no sidebar (D-040). English routes (D-050); Overview at /dashboard (D-055).
export const navTabs: readonly NavTab[] = [
  { label: "shell.nav.overview", href: "/dashboard", icon: "overview" },
  { label: "shell.nav.sales", href: "/sales", icon: "sales" },
  { label: "shell.nav.debts", href: "/debts", icon: "debts" },
  { label: "shell.nav.expenses", href: "/expenses", icon: "expenses" },
];

// The "More" drawer: less-used R0 pages.
export const moreItems: readonly MoreItem[] = [
  { label: "shell.nav.items", href: "/items" },
  { label: "shell.nav.settings", href: "/settings" },
];

/** A tab is active on its own route and on any route nested under it. */
export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
