// Shared contract (R-011): merges the halves. Change only with both devs agreeing.
import { landing } from "./en.landing";
import { ledger } from "./en.ledger";
import { privacy } from "./en.privacy";
import { shell } from "./en.shell";

// Each half owns its prefix, so a spread can never silently overwrite another half's key.
type HasOnlyPrefix<T, P extends string> =
  Exclude<keyof T, `${P}.${string}`> extends never ? T : never;
const shellKeys: HasOnlyPrefix<typeof shell, "shell"> = shell;
const ledgerKeys: HasOnlyPrefix<typeof ledger, "ledger"> = ledger;
const landingKeys: HasOnlyPrefix<typeof landing, "landing"> = landing;
const privacyKeys: HasOnlyPrefix<typeof privacy, "privacy"> = privacy;

export const en = {
  ...shellKeys,
  ...ledgerKeys,
  ...landingKeys,
  ...privacyKeys,
} as const;

export type MessageKey = keyof typeof en;
