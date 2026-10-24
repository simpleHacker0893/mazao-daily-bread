// Kiswahili ledger half (Dev B). Typed against the English keys, so a missing translation fails typecheck.
import type { ledger as en } from "./en.ledger";

export const ledger: Record<keyof typeof en, string> = {
  "ledger.sale.save": "Hifadhi mauzo",
};
