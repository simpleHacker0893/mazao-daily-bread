import { en, type MessageKey } from "./en";

export type { MessageKey } from "./en";
export { type NavLabel, navLabels } from "./en.shell";

export function t(key: MessageKey): string {
  return en[key];
}
