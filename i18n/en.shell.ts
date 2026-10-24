// English shell half (Dev A: auth, lock, nav, sync, settings). R-011.
// English is the default UI language; Kiswahili is a user switch (D-049).
export const shell = {
  "shell.app.name": "Mazao",
  "shell.app.description": "Offline-first bookkeeping for Kenyan merchants",
  "shell.lock.title": "Enter your PIN",
  "shell.nav.overview": "Overview",
  "shell.nav.sales": "Sales",
  "shell.nav.debts": "Debts",
  "shell.nav.expenses": "Expenses",
  "shell.nav.more": "More",
} as const;

// Bottom-nav order.
export const navKeys = [
  "shell.nav.overview",
  "shell.nav.sales",
  "shell.nav.debts",
  "shell.nav.expenses",
  "shell.nav.more",
] as const satisfies readonly (keyof typeof shell)[];
