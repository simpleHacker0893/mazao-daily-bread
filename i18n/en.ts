// Shared contract (R-011): merges the two halves. Change only with both devs agreeing.
import { ledger } from "./en.ledger";
import { shell } from "./en.shell";

export const en = { ...shell, ...ledger } as const;

export type MessageKey = keyof typeof en;
