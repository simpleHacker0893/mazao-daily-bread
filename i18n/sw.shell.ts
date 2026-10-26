// Kiswahili shell half (Dev A). Typed against the English keys, so a missing translation fails typecheck.
import type { shell as en } from "./en.shell";

export const shell: Record<keyof typeof en, string> = {
  "shell.app.name": "Mazao",
  "shell.app.description":
    "Uhasibu kwa wafanyabiashara wa Kenya, hata bila mtandao",

  "shell.page.overview": "Muhtasari",
  "shell.page.sales": "Mauzo",
  "shell.page.sales.new": "Mauzo mapya",
  "shell.page.expenses": "Gharama",
  "shell.page.expenses.new": "Gharama mpya",
  "shell.page.debts": "Deni",
  "shell.page.debts.customer": "Deni la mteja",
  "shell.page.items": "Bidhaa",
  "shell.page.settings": "Mipangilio",
  "shell.page.onboarding": "Tuanze",
  "shell.page.onboarding.review": "Wasifu wa biashara",
  "shell.page.notebook": "Leta daftari lako",
  "shell.page.today": "Leo",
  "shell.page.lock": "Weka PIN yako",
  "shell.page.setPin": "Weka PIN",

  "shell.nav.label": "Urambazaji mkuu",
  "shell.nav.overview": "Muhtasari",
  "shell.nav.sales": "Mauzo",
  "shell.nav.debts": "Deni",
  "shell.nav.expenses": "Gharama",
  "shell.nav.more": "Zaidi",
  "shell.nav.items": "Bidhaa",
  "shell.nav.settings": "Mipangilio",
  "shell.nav.close": "Funga",

  "shell.sync.backedUp": "Imehifadhiwa",
  "shell.sync.notBackedUp": "Haijahifadhiwa",
  "shell.sync.saving": "Inahifadhi…",
  "shell.sync.signInToBackUp": "Ingia ili kuhifadhi",

  "shell.lock.title": "Weka PIN yako",

  "shell.auth.signIn.title": "Ingia: Mazao",
  "shell.auth.signUp.title": "Anza bure: Mazao",
  "shell.auth.description":
    "Ingia Mazao uandike mauzo, deni na gharama na kuzihifadhi.",
  "shell.auth.photoAlt":
    "Mama mboga kwenye kibanda chake cha mboga katika soko la Gikomba, akiangalia simu yake",
  "shell.auth.demo": "Jaribu onyesho kwanza",
  "shell.auth.home": "Mwanzo wa Mazao",
};
