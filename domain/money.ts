import type { Cents } from "./types";

/** Shillings (a number or a "150.00" string) to integer cents. The only rounding rule for money. */
export function toCents(kes: string | number): Cents {
  return Math.round(Number(kes) * 100);
}

export function fromCents(cents: Cents): number {
  return cents / 100;
}

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const withCents = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "KES 1,250", with decimals only when they are not zero ("KES 1,250.50"). */
export function formatKES(cents: Cents): string {
  const format = cents % 100 === 0 ? whole : withCents;
  return `KES ${format.format(fromCents(cents))}`;
}

/** A line's value: quantity times unit price, rounded to whole cents. Used everywhere. */
export function lineTotal(quantity: number, unitPrice: Cents): Cents {
  return Math.round(quantity * unitPrice);
}
