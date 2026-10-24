// Kiswahili shell half (Dev A). Typed against the English keys, so a missing translation fails typecheck.
import type { shell as en } from "./en.shell";

export const shell: Record<keyof typeof en, string> = {
  "shell.app.name": "Mazao",
  "shell.app.description":
    "Uhasibu kwa wafanyabiashara wa Kenya, hata bila mtandao",
  "shell.lock.title": "Weka PIN yako",
  "shell.nav.overview": "Muhtasari",
  "shell.nav.sales": "Mauzo",
  "shell.nav.debts": "Deni",
  "shell.nav.expenses": "Gharama",
  "shell.nav.more": "Zaidi",
};
