"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState } from "react";
import { t } from "@/i18n/t";
import { isActiveRoute, moreItems, type NavIcon, navTabs } from "./nav";

const tabClass =
  "flex h-16 min-w-12 flex-1 flex-col items-center justify-center gap-1 font-medium text-[12px] leading-none";

/**
 * Bottom navigation at every width (D-040): four tabs plus "More", which opens
 * a bottom sheet with the less-used pages. English labels only (D-049, D-050).
 * The sheet is a native modal <dialog>: focus trap and Escape come for free.
 */
export function BottomNav() {
  const pathname = usePathname();
  const drawer = useRef<HTMLDialogElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const titleId = useId();

  const moreActive =
    drawerOpen || moreItems.some((item) => isActiveRoute(pathname, item.href));

  function openDrawer() {
    drawer.current?.showModal();
    setDrawerOpen(true);
  }

  function closeDrawer() {
    drawer.current?.close();
  }

  return (
    <>
      <nav
        aria-label={t("shell.nav.label")}
        className="fixed inset-x-0 bottom-0 z-40 flex border-line border-t bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        {navTabs.map((tab) => {
          const active = isActiveRoute(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`${tabClass} ${active ? "text-sukuma" : "text-moss"}`}
            >
              <Icon name={tab.icon} />
              {t(tab.label)}
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          onClick={openDrawer}
          className={`${tabClass} ${moreActive ? "text-sukuma" : "text-moss"}`}
        >
          <Icon name="more" />
          {t("shell.nav.more")}
        </button>
      </nav>

      <dialog
        ref={drawer}
        aria-labelledby={titleId}
        onClose={() => setDrawerOpen(false)}
        className="inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-sheet border-line border-t bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-ink backdrop:bg-ink/30"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 id={titleId} className="font-semibold text-[16px]">
            {t("shell.nav.more")}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={t("shell.nav.close")}
            className="flex size-12 items-center justify-center rounded-card text-moss"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {moreItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={closeDrawer}
                aria-current={
                  isActiveRoute(pathname, item.href) ? "page" : undefined
                }
                className="flex min-h-12 items-center rounded-card px-3 font-medium text-[16px] hover:bg-chalk aria-[current=page]:text-sukuma"
              >
                {t(item.label)}
              </Link>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}

/** 24px outline icons, drawn in the tab's text colour. */
function Icon({ name }: { name: NavIcon }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

const iconPaths: Record<NavIcon, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  sales: (
    <>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 01-8 0" />
    </>
  ),
  debts: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  expenses: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
};
