// Shared contract (R-011): merges the Kiswahili halves.
import type { MessageKey } from "./en";
import { landing } from "./sw.landing";
import { ledger } from "./sw.ledger";
import { privacy } from "./sw.privacy";
import { shell } from "./sw.shell";

export const sw: Record<MessageKey, string> = {
  ...shell,
  ...ledger,
  ...landing,
  ...privacy,
};
