import { en, type MessageKey } from "./en";
import { sw } from "./sw";

export type { MessageKey } from "./en";
export { navKeys } from "./en.shell";

// D-049: English by default; the merchant can switch to Kiswahili.
export type Locale = "en" | "sw";

export const defaultLocale: Locale = "en";

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, sw };

export function t(key: MessageKey, locale: Locale = defaultLocale): string {
  return dictionaries[locale][key];
}
