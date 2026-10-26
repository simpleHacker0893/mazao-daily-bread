// Kiswahili ledger half (Dev B). Typed against the English keys, so a missing translation fails typecheck.
import type { ledger as en } from "./en.ledger";

export const ledger: Record<keyof typeof en, string> = {
  "ledger.sale.save": "Hifadhi mauzo",

  // English until a native speaker supplies Kiswahili (Q-006, OQ P1-Q14). Builders don't invent it.
  "ledger.grill.schema": "Something is missing or not valid.",
  "ledger.grill.arithmetic": "The lines don't add up to the total.",
  "ledger.grill.paidExceedsTotal": "Paid is more than the total.",
  "ledger.grill.deniNeedsCustomer": "Choose who owes this.",
  "ledger.grill.negativeStock": "This sells more than you have in stock.",
  "ledger.grill.belowCost": "This price is below what you paid for it.",
  "ledger.grill.priceVariance": "This price is far from the usual price.",
  "ledger.grill.possibleDuplicate":
    "This looks the same as one you saved a few minutes ago.",
};
