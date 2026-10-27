// English ledger half (Dev B: sales, expenses, deni, stock). R-011.
export const ledger = {
  "ledger.sale.save": "Save sale",

  // Grill rules: why a record can't be saved, or needs a second look (domain/grill.ts)
  "ledger.grill.schema": "Something is missing or not valid.",
  "ledger.grill.arithmetic": "The lines don't add up to the total.",
  "ledger.grill.paidExceedsTotal": "Paid is more than the total.",
  "ledger.grill.deniNeedsCustomer": "Choose who owes this.",
  "ledger.grill.negativeStock": "This sells more than you have in stock.",
  "ledger.grill.belowCost": "This price is below what you paid for it.",
  "ledger.grill.priceVariance": "This price is far from the usual price.",
  "ledger.grill.possibleDuplicate":
    "This looks the same as one you saved a few minutes ago.",
} as const;
