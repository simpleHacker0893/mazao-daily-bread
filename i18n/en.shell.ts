// Shell half of the dictionary (Dev A: auth, lock, nav, sync, settings). R-011.
export const shell = {
  "shell.lock.title": "Enter your PIN",
} as const;

export type NavLabel = { readonly sw: string; readonly en: string };

// D-004 / D-040: Kiswahili label with its English caption, in bottom-nav order.
export const navLabels: readonly NavLabel[] = [
  { sw: "Muhtasari", en: "Overview" },
  { sw: "Mauzo", en: "Sales" },
  { sw: "Deni", en: "Debts" },
  { sw: "Gharama", en: "Expenses" },
  { sw: "Zaidi", en: "More" },
];
