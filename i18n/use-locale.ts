"use client";
// Shared contract: the UI language is a device setting (D-049), readable before sign-in and
// offline. Stored in deviceDb.meta['locale']; missing means English. The switch lives in Settings.
import { useLiveQuery } from "dexie-react-hooks";
import { deviceDb } from "@/local/device-db";
import { defaultLocale, type Locale } from "./t";

export const LOCALE_KEY = "locale";

export function useLocale(): Locale {
  const stored = useLiveQuery(() => deviceDb.meta.get(LOCALE_KEY), []);
  return stored?.value === "sw" ? "sw" : defaultLocale;
}
