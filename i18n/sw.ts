// Shared contract (R-011): merges the two Kiswahili halves.
import type { MessageKey } from "./en";
import { ledger } from "./sw.ledger";
import { shell } from "./sw.shell";

export const sw: Record<MessageKey, string> = { ...shell, ...ledger };
