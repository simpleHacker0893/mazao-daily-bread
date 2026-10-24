// Shared contract (R-011): merges the two halves. Change only with both devs agreeing.
import { ledger } from "./en.ledger";
import { shell } from "./en.shell";

// Each half owns its prefix, so a spread can never silently overwrite the other half's key.
type HasOnlyPrefix<T, P extends string> =
  Exclude<keyof T, `${P}.${string}`> extends never ? T : never;
const shellKeys: HasOnlyPrefix<typeof shell, "shell"> = shell;
const ledgerKeys: HasOnlyPrefix<typeof ledger, "ledger"> = ledger;

export const en = { ...shellKeys, ...ledgerKeys } as const;

export type MessageKey = keyof typeof en;
