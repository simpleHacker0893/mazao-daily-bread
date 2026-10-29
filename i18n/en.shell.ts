// English shell half (Dev A: auth, lock, nav, sync, settings). R-011.
// English is the default UI language; Kiswahili is a user switch (D-049).
export const shell = {
  "shell.app.name": "Mazao",
  "shell.app.description": "Offline-first bookkeeping for Kenyan merchants",

  // Page titles
  "shell.page.overview": "Overview",
  "shell.page.sales": "Sales",
  "shell.page.sales.new": "New sale",
  "shell.page.expenses": "Expenses",
  "shell.page.expenses.new": "New expense",
  "shell.page.debts": "Debts",
  "shell.page.debts.customer": "Customer debt",
  "shell.page.items": "Items",
  "shell.page.settings": "Settings",
  "shell.page.onboarding": "Let's get started",
  "shell.page.onboarding.review": "Business profile",
  "shell.page.notebook": "Bring in your notebook",
  "shell.page.today": "Today",
  "shell.page.lock": "Unlock Mazao",
  "shell.page.setPin": "Set your PIN",

  // Bottom nav and the More drawer
  "shell.nav.label": "Main navigation",
  "shell.nav.overview": "Overview",
  "shell.nav.sales": "Sales",
  "shell.nav.debts": "Debts",
  "shell.nav.expenses": "Expenses",
  "shell.nav.more": "More",
  "shell.nav.items": "Items",
  "shell.nav.settings": "Settings",
  "shell.nav.close": "Close",

  // Sync chip
  "shell.sync.backedUp": "Backed up",
  "shell.sync.notBackedUp": "Not backed up",
  "shell.sync.saving": "Saving…",
  "shell.sync.signInToBackUp": "Sign in to back up",

  "shell.lock.title": "Unlock Mazao",
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

  // Sign-in and sign-up pages (Clerk)
  "shell.auth.signIn.title": "Sign in: Mazao",
  "shell.auth.signUp.title": "Start free: Mazao",
  "shell.auth.description":
    "Sign in to Mazao to record sales, deni and expenses and back them up.",
  "shell.auth.photoAlt":
    "A mama mboga at her vegetable stall in Gikomba market, checking her phone",
  "shell.auth.demo": "Try the demo first",
  "shell.auth.home": "Mazao home",

  // Sign-in screen (Phase 1 Task 3)
  "shell.signIn.title": "Welcome to Mazao",
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
} as const;

// Bottom-nav order.
export const navKeys = [
  "shell.nav.overview",
  "shell.nav.sales",
  "shell.nav.debts",
  "shell.nav.expenses",
  "shell.nav.more",
] as const satisfies readonly (keyof typeof shell)[];
