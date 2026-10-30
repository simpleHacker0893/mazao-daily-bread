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
  "shell.page.lock": "Fungua Mazao",
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

  "shell.lock.title": "Fungua Mazao",
  "shell.pin.setup.instruction": "Choose a four-digit PIN for this phone.",
  "shell.pin.setup.confirm": "Confirm your PIN",
  "shell.pin.setup.remember":
    "Remember this PIN. To reset it, you will need an internet connection and your email code.",
  "shell.pin.setup.submit": "Save PIN",
  "shell.pin.input.label": "Four-digit PIN",
  "shell.pin.input.confirmLabel": "Confirm four-digit PIN",
  "shell.pin.input.digit": "Digit {digit}",
  "shell.pin.input.backspace": "Delete last digit",
  "shell.pin.input.clear": "Clear PIN",
  "shell.pin.error.invalid": "Enter all four digits in each PIN field.",
  "shell.pin.error.mismatch":
    "The PINs do not match. Check both entries and try again.",
  "shell.pin.error.weak":
    "Choose a less predictable PIN. Repeated digits and 1234 are not allowed.",
  "shell.pin.error.setupNotAllowed":
    "PIN setup is not authorized. Sign in again to continue.",
  "shell.pin.error.accountChanged":
    "The account on this phone changed. Sign in again to continue.",
  "shell.pin.error.storage":
    "This phone could not securely save your PIN. Check device storage and try again.",
  "shell.pin.error.incorrect": "That PIN is not correct. Try again.",
  "shell.pin.error.locked":
    "Too many tries. Wait for the countdown before trying again.",
  "shell.pin.error.accountMissing":
    "No PIN account is set up on this phone. Sign in to continue.",
  "shell.pin.error.signInRequired": "Sign in again to set up your PIN.",
  "shell.pin.lock.email": "Signed in as {email}",
  "shell.pin.lock.forgot": "Forgot PIN?",
  "shell.pin.lock.resetOffline":
    "Connect to the internet to reset your PIN. Your records will stay on this phone.",
  "shell.pin.lock.resetWorking": "Signing out securely…",
  "shell.pin.lock.resetError":
    "Could not start PIN reset. Check your connection and try again.",
  "shell.pin.lock.secondsRemaining": "Try again in {seconds} seconds.",
  "shell.pin.lock.opening": "Opening your books…",
  "shell.pin.guard.loading": "Checking this phone…",
  "shell.pin.guard.storage":
    "Could not read this phone's secure account storage.",

  "shell.auth.signIn.title": "Ingia: Mazao",
  "shell.auth.signUp.title": "Anza bure: Mazao",
  "shell.auth.description":
    "Ingia Mazao uandike mauzo, deni na gharama na kuzihifadhi.",
  "shell.auth.photoAlt":
    "Mama mboga kwenye kibanda chake cha mboga katika soko la Gikomba, akiangalia simu yake",
  "shell.auth.demo": "Jaribu onyesho kwanza",
  "shell.auth.home": "Mwanzo wa Mazao",

  "shell.signIn.title": "Karibu Mazao",
  // English until a native speaker supplies Kiswahili (Q-006, OQ P1-Q14).
  "shell.signIn.privacy.heading": "Your data",
  "shell.signIn.privacy.store":
    "We keep your email and the business records you enter.",
  "shell.signIn.privacy.eu": "Backups are stored on a secure server in the EU.",
  "shell.signIn.privacy.pin": "Your PIN never leaves this phone.",
  "shell.signIn.privacy.delete": "To delete your data, ask the pilot team.",
  "shell.signIn.privacy.link": "Read the privacy notice",
  "shell.signIn.agree": "I agree",
  "shell.signIn.offline": "You're offline. Connect once to sign in.",
  "shell.signIn.working": "Bringing back your records…",
  "shell.signIn.error":
    "Could not reach Mazao. Check your connection and try again.",
  "shell.signIn.retry": "Try again",
  "shell.signIn.refused.before": "This phone belongs to",
  "shell.signIn.refused.after":
    "Ask the owner to remove their account in Settings first.",
  "shell.signIn.resetMismatch":
    "That email is not the account on this phone. Use the email you signed up with.",
};
