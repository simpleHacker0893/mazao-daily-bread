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
  "shell.page.lock": "Enter your PIN",
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

  "shell.lock.title": "Enter your PIN",
} as const;

// Bottom-nav order.
export const navKeys = [
  "shell.nav.overview",
  "shell.nav.sales",
  "shell.nav.debts",
  "shell.nav.expenses",
  "shell.nav.more",
] as const satisfies readonly (keyof typeof shell)[];
