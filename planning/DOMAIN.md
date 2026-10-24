# DOMAIN: Mazao

Use these words in the UI, code names and docs. Don't use generic substitutes: write "deni", not "credit record".

## Terms

| Term | Meaning | In code |
|---|---|---|
| Merchant | The business owner using Mazao | `profile` + `business` |
| Business | The tenant. Owns all records | `business`, `business_id` |
| Deni | Money owed on credit | — |
| Deni la Wateja | Customer debt owed **to** the merchant | derived `customerBalance` |
| Deni la Wasambazaji | Supplier debt owed **by** the merchant (R1) | derived `supplierOwed` |
| Faida Halisi | Net profit = Sales − COGS − Expenses | `faidaHalisi` |
| Mauzo | Sales | `sale` |
| Manunuzi | Purchases (R1) | `purchase` |
| Gharama | Expenses | `expense` |
| Bidhaa | Items, both goods and services | `item` (`kind`) |
| Kazi | Repair job card (R2) | `job` |
| Mtandao | Network / relationship map (R6) | — |
| Muhtasari | Overview dashboard | — |
| Ripoti | Reports (R3) | — |
| Mipangilio | Settings | — |
| Ushuru | Market fee/levy (an expense category) | `ushuru` |
| Brought forward | Opening balance from the paper notebook | `opening_balance` |
| Merchant Operating Profile | Onboarding output that configures defaults and rules | `operatingProfile` |
| Grill rules | Deterministic validation checks before save | `grill/*` |
| Review Card | Confirmation screen for AI drafts (R4) | — |

## Units
`kilo, gunia, tray, piece, crate, bag, litre, fundo, ndume, other`. Fractional quantities are allowed per item (`allowsFractional`). Services use `trip`, `job` or `piece`.

## Transaction types

| Type | R0 | Effect on customer deni | Effect on stock | In Sales? | In Expenses? |
|---|---|---|---|---|---|
| `sale` | ✓ | + (total − paid) if a customer is set | − qty for goods lines | ✓ | — |
| `customer_payment` | ✓ | − amount | — | — | — |
| `expense` | ✓ | — | — | — | ✓ |
| `opening_balance` | ✓ | + amount (customer) / supplier owed + amount | — | — | — |
| `stock_adjustment` | ✓ (opening stock) | — | ± qty | — | — |
| `void` | ✓ | reverses the original | reverses the original | reverses | reverses |
| `purchase` | R1 | supplier owed + (total − paid) | + qty | — | — (cost goes in via COGS) |
| `supplier_payment` | R1 | supplier owed − amount | — | — | — |

- **Payment methods:** `cash`, `mpesa`, `other`. "Deni" is not a payment method: it's the unpaid remainder.
- **Customer balance:** positive means the customer owes the merchant; negative means the customer is in credit (overpaid, or paid a deposit).

## Default expense categories
transport, ushuru, rent, bags, county fees, airtime, electricity, fuel, repairs/matengenezo, vehicle/bike costs, miscellaneous. Merchants can add their own.

## Worked example (also used in acceptance tests)
On one day:
1. **Sale:** 3 kilo sukuma wiki at KES 50 (cost 30), cash.
2. **Sale:** service "Trip Gikomba–Town" KES 200, M-Pesa.
3. **Expense:** ushuru KES 50, cash.

Totals:
- Sales = 150 + 200 = **350**
- COGS = 3 × 30 = **90**
- Expenses = **50**
- **Faida Halisi = 210**
- Cash in = 150 + 0; M-Pesa in = 200.
